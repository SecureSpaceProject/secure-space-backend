import db from "../data-source";
import { Room } from "../entities/Room";
import { RoomMember } from "../entities/RoomMember";
import { User } from "../entities/User";
import { RoomMemberRole } from "../entities/enums";
import { AppError } from "../errors/AppError";
import type {
  AddRoomMemberBody,
  RoomMemberDto,
  UpdateRoomMemberRoleBody,
} from "../routes/roomMembers/types";
import { logRoomActivity } from "../roomActivityLogger";
import { ActivityAction, ActivityTargetType } from "../entities/enums";
import { RoomActivityLog } from "../entities/RoomActivityLog";

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; status: number; error: string };
type ServiceResult<T> = Ok<T> | Fail;

function toDto(m: RoomMember): RoomMemberDto {
  return {
    id: m.id,
    roomId: m.roomId,
    userId: m.userId,
    memberRole: m.memberRole,
    addedAt: m.addedAt.toISOString(),
  };
}

function isOwnerOrAdmin(role: RoomMemberRole): boolean {
  return role === RoomMemberRole.OWNER || role === RoomMemberRole.ADMIN;
}

function isRegular(role: RoomMemberRole): boolean {
  return role === RoomMemberRole.DEFAULT;
}

export class RoomMemberService {
  static async addMember(
    actorUserId: string,
    roomId: string,
    body: AddRoomMemberBody
  ): Promise<ServiceResult<RoomMemberDto>> {
    const roomRepo = db.getRepository(Room);
    const userRepo = db.getRepository(User);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new AppError("ROOM_NOT_FOUND", 404);

    const actor = await memberRepo.findOne({
      where: { roomId, userId: actorUserId },
    });
    if (!actor) throw new AppError("FORBIDDEN", 403);
    if (!isOwnerOrAdmin(actor.memberRole)) throw new AppError("FORBIDDEN", 403);

    if (actor.memberRole === RoomMemberRole.ADMIN) {
      if (body.memberRole !== RoomMemberRole.DEFAULT) {
        throw new AppError("FORBIDDEN", 403);
      }
    }

    const targetUser = await userRepo.findOne({ where: { id: body.userId } });
    if (!targetUser) throw new AppError("USER_NOT_FOUND", 404);

    const exists = await memberRepo.findOne({
      where: { roomId, userId: body.userId },
    });
    if (exists) throw new AppError("VALIDATION_FAILED", 409);

    const newMember = memberRepo.create({
      roomId,
      userId: body.userId,
      memberRole: body.memberRole as RoomMemberRole,
    });

    await memberRepo.save(newMember);
    await logRoomActivity({
      roomId,
      actorUserId,
      action: ActivityAction.ADD_MEMBER,
      targetType: ActivityTargetType.ROOM_MEMBER,
      targetId: newMember.id,
    });

    return { ok: true, data: toDto(newMember) };
  }

  static async listMembers(
    actorUserId: string,
    roomId: string
  ): Promise<ServiceResult<RoomMemberDto[]>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new AppError("ROOM_NOT_FOUND", 404);

    const actor = await memberRepo.findOne({
      where: { roomId, userId: actorUserId },
    });
    if (!actor) throw new AppError("FORBIDDEN", 403);

    const members = await memberRepo.find({
      where: { roomId },
      order: { addedAt: "ASC" as any },
    });

    return { ok: true, data: members.map(toDto) };
  }

  static async updateMemberRole(
    actorUserId: string,
    roomId: string,
    targetUserId: string,
    body: UpdateRoomMemberRoleBody
  ): Promise<ServiceResult<RoomMemberDto>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new AppError("ROOM_NOT_FOUND", 404);

    const actor = await memberRepo.findOne({
      where: { roomId, userId: actorUserId },
    });
    if (!actor) throw new AppError("FORBIDDEN", 403);
    if (!isOwnerOrAdmin(actor.memberRole)) throw new AppError("FORBIDDEN", 403);

    const target = await memberRepo.findOne({
      where: { roomId, userId: targetUserId },
    });
    if (!target) throw new AppError("NOT_FOUND", 404);

    const newRole = body.memberRole as RoomMemberRole;

    if (actor.memberRole === RoomMemberRole.ADMIN) {
      if (!isRegular(newRole)) {
        throw new AppError("FORBIDDEN", 403);
      }
    }

    if (
      actor.memberRole === RoomMemberRole.ADMIN &&
      target.memberRole === RoomMemberRole.OWNER
    ) {
      throw new AppError("FORBIDDEN", 403);
    }

    target.memberRole = newRole;
    await memberRepo.save(target);
    await logRoomActivity({
      roomId,
      actorUserId,
      action: ActivityAction.UPDATE_MEMBER_ROLE,
      targetType: ActivityTargetType.ROOM_MEMBER,
      targetId: target.id,
    });

    return { ok: true, data: toDto(target) };
  }

  static async removeMember(
    actorUserId: string,
    roomId: string,
    userId: string
  ) {
    try {
      const memberRepo = db.getRepository(RoomMember);
      const roomRepo = db.getRepository(Room);
      const activityRepo = db.getRepository(RoomActivityLog);

      // 1. кімната
      const room = await roomRepo.findOne({
        where: { id: roomId },
      });

      if (!room) {
        return {
          ok: false,
          status: 404,
          error: "ROOM_NOT_FOUND",
        };
      }

      // 2. мембер
      const member = await memberRepo.findOne({
        where: {
          room: { id: roomId },
          user: { id: userId },
        },
        relations: ["user"],
      });

      if (!member) {
        return {
          ok: false,
          status: 404,
          error: "MEMBER_NOT_FOUND",
        };
      }

      // 3. зберігаємо ВСЕ що треба ДО remove
      const removedMemberId = member.id;
      const removedUserId = member.user.id;

      // 4. видаляємо
      await memberRepo.remove(member);

      // 5. activity log — ТІЛЬКИ ENUM-и
      await activityRepo.save({
        room,
        actorUserId,
        action: ActivityAction.REMOVE_MEMBER,
        targetType: ActivityTargetType.ROOM_MEMBER,
        targetId: removedMemberId,
      });

      // 6. нормальна відповідь
      return {
        ok: true,
        data: {
          roomId,
          userId: removedUserId,
        },
      };
    } catch (error) {
      console.error("removeMember failed:", error);
      return {
        ok: false,
        status: 500,
        error: "INTERNAL_ERROR",
      };
    }
  }
}
