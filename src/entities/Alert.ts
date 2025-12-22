import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { AlertStatus } from "./enums";
import { Room } from "./Room";
import { SensorEvent } from "./SensorEvent";
import { User } from "./User";

@Entity({ name: "alerts" })
export class Alert {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @Column({ name: "event_id" })
  eventId!: string;

  @Column({ name: "closed_by_user_id", nullable: true })
  closedByUserId!: string | null;

  @Column({ type: "enum", enum: AlertStatus, default: AlertStatus.OPEN })
  status!: AlertStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: "closed_at", type: "timestamptz", nullable: true })
  closedAt!: Date | null;

  @ManyToOne(() => Room, (r) => r.alerts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => SensorEvent, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: SensorEvent;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "closed_by_user_id" })
  closedByUser!: User | null;
}
