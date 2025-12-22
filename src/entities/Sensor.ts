import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

import { SensorType } from "./enums";
import { Room } from "./Room";
import { SensorEvent } from "./SensorEvent";

@Entity({ name: "sensors" })
export class Sensor {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @Column()
  name!: string;

  @Column({ type: "enum", enum: SensorType })
  type!: SensorType;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Room, (r) => r.sensors, { onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @OneToMany(() => SensorEvent, (e) => e.sensor)
  events!: SensorEvent[];
}
