import db from "./data-source";
import { RoomActivityLog } from "./entities/RoomActivityLog";
import { ActivityAction, ActivityTargetType } from "./entities/enums";
import { Room } from "./entities/Room";
import { User } from "./entities/User";

export async function logRoomActivity(args: {
  roomId: string;
  actorUserId: string;

  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId?: string | null;
}) {
  const repo = db.getRepository(RoomActivityLog);

  const log = repo.create({
    room: { id: args.roomId } as Room,
    actorUser: { id: args.actorUserId } as User,

    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId ?? null,
  });

  await repo.save(log);
}
