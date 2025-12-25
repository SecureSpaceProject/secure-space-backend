import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import db from "../data-source";
import { User } from "../entities/User";

export class AdminService {
  private userRepo = db.getRepository(User);

  async listUsers() {
    return this.userRepo.find({
      order: { createdAt: "DESC" as any },
      select: ["id", "email", "role", "status", "createdAt"] as any,
    });
  }

  async setUserStatus(userId: string, status: "ACTIVE" | "BLOCKED") {
    const user = await this.userRepo.findOne({ where: { id: userId } as any });
    if (!user) return null;

    (user as any).status = status;
    await this.userRepo.save(user);

    return { id: (user as any).id, status: (user as any).status };
  }

  async backupDatabase() {
    const backupsDir = path.resolve(process.cwd(), "backups");
    fs.mkdirSync(backupsDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${stamp}.sql`;
    const filePath = path.join(backupsDir, fileName);

    const {
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_CONTAINER,
    } = process.env;

    if (!POSTGRES_DB || !POSTGRES_USER || !POSTGRES_PASSWORD) {
      throw new Error(
        "POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD not set"
      );
    }

    const container = POSTGRES_CONTAINER || "postgres";

    const innerCommand =
      `PGPASSWORD="${POSTGRES_PASSWORD}" ` +
      `pg_dump --username="${POSTGRES_USER}" ` +
      `--format=plain --no-owner --no-privileges "${POSTGRES_DB}"`;

    await new Promise<void>((resolve, reject) => {
      const dump = spawn(
        "docker",
        ["exec", "-i", container, "sh", "-lc", innerCommand],
        { windowsHide: true }
      );

      dump.on("error", (err) => {
        reject(new Error(`docker exec failed: ${err.message}`));
      });

      const out = fs.createWriteStream(filePath);
      dump.stdout.pipe(out);

      let errText = "";
      dump.stderr.on("data", (d) => (errText += d.toString()));

      dump.on("close", (code) => {
        if (code !== 0) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
          return reject(new Error(`pg_dump failed (code ${code}): ${errText}`));
        }
        resolve();
      });
    });

    return {
      ok: true,
      file: fileName,
    };
  }
}
