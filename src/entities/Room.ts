import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";

import { RoomMember } from "./RoomMember";
import { Sensor } from "./Sensor";
import { SensorEvent } from "./SensorEvent";
import { Alert } from "./Alert";
import { Notification } from "./Notification";
import { RoomActivityLog } from "./RoomActivityLog";

@Entity({ name: "rooms" })
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ name: "is_armed", default: false })
  isArmed!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => RoomMember, (m) => m.room)
  members!: RoomMember[];

  @OneToMany(() => Sensor, (s) => s.room)
  sensors!: Sensor[];

  @OneToMany(() => SensorEvent, (e) => e.room)
  events!: SensorEvent[];

  @OneToMany(() => Alert, (a) => a.room)
  alerts!: Alert[];

  @OneToMany(() => Notification, (n) => n.room)
  notifications!: Notification[];

  @OneToMany(() => RoomActivityLog, (l) => l.room)
  logs!: RoomActivityLog[];
}
