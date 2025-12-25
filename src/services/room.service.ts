import db from "../data-source"; 
import { Room } from "../entities/Room";
import { RoomMember } from "../entities/RoomMember";
import { RoomMemberRole } from "../entities/enums";
import type { CreateRoomBody, RoomDto, UpdateRoomBody } from "../routes/rooms/types";

type Ok<T> = { ok: true; data: T };
type Fail = { ok: false; status: number; error: string };
type ServiceResult<T> = Ok<T> | Fail;

function toRoomDto(room: Room): RoomDto {
  return {
    id: room.id,
    name: room.name,
    isArmed: room.isArmed,
    createdAt: room.createdAt.toISOString(),
  };
}

function isOwnerOrAdmin(role: RoomMemberRole): boolean {
  return role === RoomMemberRole.OWNER || role === RoomMemberRole.ADMIN;
}

export class RoomService {
  static async createRoom(userId: string, body: CreateRoomBody): Promise<ServiceResult<RoomDto>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const room = roomRepo.create({
      name: body.name,
      isArmed: false,
    });

    await roomRepo.save(room);

    const member = memberRepo.create({
      roomId: room.id,
      userId,
      memberRole: RoomMemberRole.OWNER,
    });

    await memberRepo.save(member);

    return { ok: true, data: toRoomDto(room) };
  }

  static async getMyRooms(userId: string): Promise<ServiceResult<RoomDto[]>> {
    const roomRepo = db.getRepository(Room);

    const rooms = await roomRepo
      .createQueryBuilder("r")
      .innerJoin(RoomMember, "rm", "rm.room_id = r.id AND rm.user_id = :userId", { userId })
      .orderBy("r.created_at", "DESC")
      .getMany();

    return { ok: true, data: rooms.map(toRoomDto) };
  }

  static async getRoomById(userId: string, roomId: string): Promise<ServiceResult<RoomDto>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const member = await memberRepo.findOne({ where: { roomId, userId } });
    if (!member) return { ok: false, status: 403, error: "Forbidden (not a room member)" };

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    return { ok: true, data: toRoomDto(room) };
  }

  static async updateRoom(
    userId: string,
    roomId: string,
    body: UpdateRoomBody
  ): Promise<ServiceResult<RoomDto>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const member = await memberRepo.findOne({ where: { roomId, userId } });
    if (!member) return { ok: false, status: 403, error: "Forbidden (not a room member)" };

    if (!isOwnerOrAdmin(member.memberRole)) {
      return { ok: false, status: 403, error: "Forbidden (OWNER/ADMIN only)" };
    }

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    if (typeof body.name === "string") room.name = body.name;
    if (typeof body.isArmed === "boolean") room.isArmed = body.isArmed;

    await roomRepo.save(room);

    return { ok: true, data: toRoomDto(room) };
  }

  static async deleteRoom(userId: string, roomId: string): Promise<ServiceResult<{ id: string }>> {
    const roomRepo = db.getRepository(Room);
    const memberRepo = db.getRepository(RoomMember);

    const member = await memberRepo.findOne({ where: { roomId, userId } });
    if (!member) return { ok: false, status: 403, error: "Forbidden (not a room member)" };

    if (member.memberRole !== RoomMemberRole.OWNER) {
      return { ok: false, status: 403, error: "Forbidden (OWNER only)" };
    }

    const room = await roomRepo.findOne({ where: { id: roomId } });
    if (!room) return { ok: false, status: 404, error: "Room not found" };

    await roomRepo.remove(room);

    return { ok: true, data: { id: roomId } };
  }
}
