import db from "../data-source";
import { Room } from "../entities/Room";
import { RoomMember } from "../entities/RoomMember";
import { User } from "../entities/User";
import { RoomMemberRole } from "../entities/enums";
import type {
  AddRoomMemberBody,
  RoomMemberDto,
  UpdateRoomMemberRoleBody,
} from "../routes/roomMembers/types";

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

// "DEFAULT" у тебе = звичайний учасник
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
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    const actor = await memberRepo.findOne({ where: { roomId, userId: actorUserId } });
    if (!actor) return { ok: false, status: 403, error: "Forbidden (not a room member)" };
    if (!isOwnerOrAdmin(actor.memberRole)) return { ok: false, status: 403, error: "Forbidden (OWNER/ADMIN only)" };

    if (actor.memberRole === RoomMemberRole.ADMIN) {
      if (body.memberRole !== RoomMemberRole.DEFAULT) {
        return { ok: false, status: 403, error: "Forbidden (ADMIN cannot grant ADMIN/OWNER)" };
      }
    }

    const targetUser = await userRepo.findOne({ where: { id: body.userId } });
    if (!targetUser) return { ok: false, status: 404, error: "User not found" };

    const exists = await memberRepo.findOne({ where: { roomId, userId: body.userId } });
    if (exists) return { ok: false, status: 409, error: "User already in room" };

    const newMember = memberRepo.create({
      roomId,
      userId: body.userId,
      memberRole: body.memberRole as RoomMemberRole,
    });

    await memberRepo.save(newMember);
    return { ok: true, data: toDto(newMember) };
  }

  static async listMembers(actorUserId: string, roomId: string): Promise<ServiceResult<RoomMemberDto[]>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    const actor = await memberRepo.findOne({ where: { roomId, userId: actorUserId } });
    if (!actor) return { ok: false, status: 403, error: "Forbidden (not a room member)" };

    const members = await memberRepo.find({
      where: { roomId },
      order: { addedAt: "ASC" as any }, // типи TypeORM інколи капризні
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
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    const actor = await memberRepo.findOne({ where: { roomId, userId: actorUserId } });
    if (!actor) return { ok: false, status: 403, error: "Forbidden (not a room member)" };
    if (!isOwnerOrAdmin(actor.memberRole)) return { ok: false, status: 403, error: "Forbidden (OWNER/ADMIN only)" };

    const target = await memberRepo.findOne({ where: { roomId, userId: targetUserId } });
    if (!target) return { ok: false, status: 404, error: "Member not found" };

    const newRole = body.memberRole as RoomMemberRole;

    // адмін не може видати ADMIN/OWNER
    if (actor.memberRole === RoomMemberRole.ADMIN) {
      if (!isRegular(newRole)) {
        return { ok: false, status: 403, error: "Forbidden (ADMIN cannot grant ADMIN/OWNER)" };
      }
    }

    // додатковий захист: ADMIN не може міняти роль OWNER
    if (actor.memberRole === RoomMemberRole.ADMIN && target.memberRole === RoomMemberRole.OWNER) {
      return { ok: false, status: 403, error: "Forbidden (ADMIN cannot modify OWNER)" };
    }

    target.memberRole = newRole;
    await memberRepo.save(target);

    return { ok: true, data: toDto(target) };
  }

  static async removeMember(
    actorUserId: string,
    roomId: string,
    targetUserId: string
  ): Promise<ServiceResult<{ userId: string }>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    const actor = await memberRepo.findOne({ where: { roomId, userId: actorUserId } });
    if (!actor) return { ok: false, status: 403, error: "Forbidden (not a room member)" };
    if (!isOwnerOrAdmin(actor.memberRole)) return { ok: false, status: 403, error: "Forbidden (OWNER/ADMIN only)" };

    const target = await memberRepo.findOne({ where: { roomId, userId: targetUserId } });
    if (!target) return { ok: false, status: 404, error: "Member not found" };

    // адмін не може видаляти OWNER/ADMIN (тільки звичайних)
    if (actor.memberRole === RoomMemberRole.ADMIN) {
      if (!isRegular(target.memberRole)) {
        return { ok: false, status: 403, error: "Forbidden (ADMIN can remove DEFAULT only)" };
      }
    }

    // owner/admin може видалити, але заборонимо видаляти OWNER не-овнером
    if (target.memberRole === RoomMemberRole.OWNER && actor.memberRole !== RoomMemberRole.OWNER) {
      return { ok: false, status: 403, error: "Forbidden (Only OWNER can remove OWNER)" };
    }

    await memberRepo.remove(target);
    return { ok: true, data: { userId: targetUserId } };
  }
}
