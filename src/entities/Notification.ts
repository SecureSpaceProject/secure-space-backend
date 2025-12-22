import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { NotificationStatus } from "./enums";
import { User } from "./User";
import { Room } from "./Room";
import { Alert } from "./Alert";

@Entity({ name: "notifications" })
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @Column({ name: "alert_id" })
  alertId!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt!: Date | null;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Room, (r) => r.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => Alert, { onDelete: "CASCADE" })
  @JoinColumn({ name: "alert_id" })
  alert!: Alert;
}
