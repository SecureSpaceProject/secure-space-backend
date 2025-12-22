import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import * as entities from "./entities";

const db = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,

  entities: Object.values(entities),

  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],

  synchronize: false,
  migrationsRun: true,
  logging: false,
});

export default db;
