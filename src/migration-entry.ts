// this file should not be used directly in the code, but only via migration commands

import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../.env") });

import db from "./data-source";

export default db;
