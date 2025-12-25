import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import "dotenv/config";

import { User } from "./entities/User";
import { Room } from "./entities/Room";
import { RoomMember } from "./entities/RoomMember";
import { Sensor } from "./entities/Sensor";
import { SensorEvent } from "./entities/SensorEvent";
import { Alert } from "./entities/Alert";
import { Notification } from "./entities/Notification";
import { RoomActivityLog } from "./entities/RoomActivityLog";

const db = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,

  entities: [User, Room, RoomMember, Sensor, SensorEvent, Alert, Notification, RoomActivityLog],

  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],

  synchronize: false,
  migrationsRun: false,
  logging: false,
});

export default db;
