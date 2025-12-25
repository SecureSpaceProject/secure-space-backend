import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from "typeorm";

import { UserRole, UserStatus } from "./enums";
import { RoomMember } from "./RoomMember";
import { Notification } from "./Notification";
import { Alert } from "./Alert";
import { RoomActivityLog } from "./RoomActivityLog";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => RoomMember, (m) => m.user)
  memberships!: RoomMember[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications!: Notification[];

  @OneToMany(() => Alert, (a) => a.closedByUser)
  closedAlerts!: Alert[];

  @OneToMany(() => RoomActivityLog, (l) => l.actorUser)
  activityLogs!: RoomActivityLog[];
}
