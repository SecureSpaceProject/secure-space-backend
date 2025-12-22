import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
} from "typeorm";

import { RoomMemberRole } from "./enums";
import { Room } from "./Room";
import { User } from "./User";

@Entity({ name: "room_members" })
@Unique(["roomId", "userId"])
export class RoomMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @Column({
    type: "enum",
    enum: RoomMemberRole,
    name: "member_role",
    default: RoomMemberRole.DEFAULT,
  })
  memberRole!: RoomMemberRole;

  @CreateDateColumn({ name: "added_at" })
  addedAt!: Date;

  @ManyToOne(() => Room, (r) => r.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => User, (u) => u.memberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
