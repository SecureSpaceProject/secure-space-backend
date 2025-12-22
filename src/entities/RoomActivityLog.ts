import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";

import { ActivityAction, ActivityTargetType } from "./enums";
import { Room } from "./Room";
import { User } from "./User";

@Entity({ name: "room_activity_log" })
@Check(
  `("target_type" IS NULL AND "target_id" IS NULL) OR ("target_type" IS NOT NULL AND "target_id" IS NOT NULL)`
)
export class RoomActivityLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @Column({ name: "actor_user_id" })
  actorUserId!: string;

  @Column({ type: "enum", enum: ActivityAction })
  action!: ActivityAction;

  @Column({ type: "text", nullable: true })
  details!: string | null;

  @Column({
    type: "enum",
    enum: ActivityTargetType,
    name: "target_type",
    nullable: true,
  })
  targetType!: ActivityTargetType | null;

  @Column({ name: "target_id", type: "text", nullable: true })
  targetId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Room, (r) => r.logs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "actor_user_id" })
  actorUser!: User;
}
