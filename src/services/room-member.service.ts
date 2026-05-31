import db from "../data-source";
import { Room } from "../entities/Room";
import { RoomMember } from "../entities/RoomMember";
import { User } from "../entities/User";
import {
  ActivityAction,
  ActivityTargetType,
  RoomMemberRole,
} from "../entities/enums";
import { AppError } from "../errors/AppError";
import type {
  AddRoomMemberBody,
  RoomMemberDto,
  UpdateRoomMemberRoleBody,
} from "../routes/roomMembers/types";
import { logRoomActivity } from "../roomActivityLogger";

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; status: number; error: string };
type ServiceResult<T> = Ok<T> | Fail;

function toDto(m: RoomMember): RoomMemberDto {
  const user = (m as any).user;

  return {
    id: m.id,
    roomId: m.roomId,
    userId: m.userId,
    memberRole: m.memberRole,
    addedAt: m.addedAt.toISOString(),
    ...(user
      ? {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        }
      : {}),
  } as RoomMemberDto;
}

function isOwnerOrAdmin(role: RoomMemberRole): boolean {
  return role === RoomMemberRole.OWNER || role === RoomMemberRole.ADMIN;
}

function isRegular(role: RoomMemberRole): boolean {
  return role === RoomMemberRole.DEFAULT;
}

async function findTargetUser(body: AddRoomMemberBody): Promise<User | null> {
  const userRepo = db.getRepository(User);

  if (body.userId) {
    return userRepo.findOne({
      where: { id: body.userId },
    });
  }

  if (body.email) {
    const email = body.email.trim().toLowerCase();

    if (!email) {
      return null;
    }

    return userRepo
      .createQueryBuilder("user")
      .where("LOWER(user.email) = LOWER(:email)", { email })
      .getOne();
  }

  return null;
}

export class RoomMemberService {
  static async addMember(
    actorUserId: string,
    roomId: string,
    body: AddRoomMemberBody,
  ): Promise<ServiceResult<RoomMemberDto>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError("ROOM_NOT_FOUND", 404);
    }

    const actor = await memberRepo.findOne({
      where: { roomId, userId: actorUserId },
    });

    if (!actor) {
      throw new AppError("FORBIDDEN", 403);
    }

    if (!isOwnerOrAdmin(actor.memberRole)) {
      throw new AppError("FORBIDDEN", 403);
    }

    if (
      actor.memberRole === RoomMemberRole.ADMIN &&
      body.memberRole !== RoomMemberRole.DEFAULT
    ) {
      throw new AppError("FORBIDDEN", 403);
    }

    const targetUser = await findTargetUser(body);

    if (!targetUser) {
      throw new AppError("USER_NOT_FOUND", 404);
    }

    const exists = await memberRepo.findOne({
      where: {
        roomId,
        userId: targetUser.id,
      },
    });

    if (exists) {
      throw new AppError("VALIDATION_FAILED", 409);
    }

    const newMember = memberRepo.create({
      roomId,
      userId: targetUser.id,
      memberRole: body.memberRole as RoomMemberRole,
    });

    const savedMember = await memberRepo.save(newMember);

    (savedMember as any).user = targetUser;

    await logRoomActivity({
      roomId,
      actorUserId,
      action: ActivityAction.ADD_MEMBER,
      targetType: ActivityTargetType.ROOM_MEMBER,
      targetId: savedMember.id,
    });

    return {
      ok: true,
      data: toDto(savedMember),
    };
  }

  static async listMembers(
    actorUserId: string,
    roomId: string,
  ): Promise<ServiceResult<RoomMemberDto[]>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError("ROOM_NOT_FOUND", 404);
    }

    const actor = await memberRepo.findOne({
      where: { roomId, userId: actorUserId },
    });

    if (!actor) {
      throw new AppError("FORBIDDEN", 403);
    }

    const members = await memberRepo.find({
      where: { roomId },
      relations: ["user"],
      order: { addedAt: "ASC" as any },
    });

    return {
      ok: true,
      data: members.map(toDto),
    };
  }

  static async updateMemberRole(
    actorUserId: string,
    roomId: string,
    targetUserId: string,
    body: UpdateRoomMemberRoleBody,
  ): Promise<ServiceResult<RoomMemberDto>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError("ROOM_NOT_FOUND", 404);
    }

    const actor = await memberRepo.findOne({
      where: { roomId, userId: actorUserId },
    });

    if (!actor) {
      throw new AppError("FORBIDDEN", 403);
    }

    if (!isOwnerOrAdmin(actor.memberRole)) {
      throw new AppError("FORBIDDEN", 403);
    }

    const target = await memberRepo.findOne({
      where: {
        roomId,
        userId: targetUserId,
      },
      relations: ["user"],
    });

    if (!target) {
      throw new AppError("NOT_FOUND", 404);
    }

    const newRole = body.memberRole as RoomMemberRole;

    if (actor.memberRole === RoomMemberRole.ADMIN && !isRegular(newRole)) {
      throw new AppError("FORBIDDEN", 403);
    }

    if (
      actor.memberRole === RoomMemberRole.ADMIN &&
      target.memberRole === RoomMemberRole.OWNER
    ) {
      throw new AppError("FORBIDDEN", 403);
    }

    target.memberRole = newRole;

    const savedTarget = await memberRepo.save(target);

    await logRoomActivity({
      roomId,
      actorUserId,
      action: ActivityAction.UPDATE_MEMBER_ROLE,
      targetType: ActivityTargetType.ROOM_MEMBER,
      targetId: savedTarget.id,
    });

    return {
      ok: true,
      data: toDto(savedTarget),
    };
  }

  static async removeMember(
    actorUserId: string,
    roomId: string,
    userId: string,
  ): Promise<ServiceResult<{ roomId: string; userId: string }>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError("ROOM_NOT_FOUND", 404);
    }

    const actor = await memberRepo.findOne({
      where: {
        roomId,
        userId: actorUserId,
      },
    });

    if (!actor) {
      throw new AppError("FORBIDDEN", 403);
    }

    if (!isOwnerOrAdmin(actor.memberRole)) {
      throw new AppError("FORBIDDEN", 403);
    }

    const target = await memberRepo.findOne({
      where: {
        roomId,
        userId,
      },
      relations: ["user"],
    });

    if (!target) {
      throw new AppError("NOT_FOUND", 404);
    }

    if (
      actor.memberRole === RoomMemberRole.ADMIN &&
      target.memberRole === RoomMemberRole.OWNER
    ) {
      throw new AppError("FORBIDDEN", 403);
    }

    const removedMemberId = target.id;
    const removedUserId = target.userId;

    await memberRepo.remove(target);

    await logRoomActivity({
      roomId,
      actorUserId,
      action: ActivityAction.REMOVE_MEMBER,
      targetType: ActivityTargetType.ROOM_MEMBER,
      targetId: removedMemberId,
    });

    return {
      ok: true,
      data: {
        roomId,
        userId: removedUserId,
      },
    };
  }
}
