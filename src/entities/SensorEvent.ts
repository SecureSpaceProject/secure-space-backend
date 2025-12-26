import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { SensorType, SensorState } from "./enums";
import { Room } from "./Room";
import { Sensor } from "./Sensor";
import { Alert } from "./Alert";

@Entity({ name: "sensor_events" })
export class SensorEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "sensor_id" })
  sensorId!: string;

  @Column({ type: "enum", enum: SensorState, nullable: true })
  state!: SensorState;

  @Column({ type: "enum", enum: SensorType })
  eventType!: SensorType;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Sensor, (s) => s.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sensor_id" })
  sensor!: Sensor;

  @ManyToOne(() => Alert, (a) => a.event, { nullable: true })
  alert?: Alert;
}
