import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Room } from "./Room";
import { Sensor } from "./Sensor";
import { Alert } from "./Alert";

@Entity({ name: "sensor_events" })
export class SensorEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @Column({ name: "sensor_id" })
  sensorId!: string;

  @Column({ default: true })
  triggered!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Room, (r) => r.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @ManyToOne(() => Sensor, (s) => s.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sensor_id" })
  sensor!: Sensor;

  @ManyToOne(() => Alert, (a) => a.event, { nullable: true })
  alert?: Alert;
}
