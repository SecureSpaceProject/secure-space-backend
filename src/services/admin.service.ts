import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import bcrypt from "bcrypt";
import db from "../data-source";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";

type ImportUserRow = {
  email?: string;
  password?: string;
  role?: string;
  status?: string;
};

export class AdminService {
  private userRepo = db.getRepository(User);

  async listUsers() {
    return this.userRepo.find({
      order: { createdAt: "DESC" as any },
      select: ["id", "email", "role", "status", "createdAt"] as any,
    });
  }

  async exportUsers() {
    const users = await this.listUsers();

    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      users,
    };
  }

  async importUsers(rows: ImportUserRow[]) {
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ email?: string; reason: string }> = [];

    for (const row of rows) {
      const email = String(row.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(row.password ?? "");
      const role = String(row.role ?? "USER").toUpperCase();
      const status = String(row.status ?? "ACTIVE").toUpperCase();

      if (!email || !password) {
        failed += 1;
        errors.push({ email, reason: "EMAIL_OR_PASSWORD_MISSING" });
        continue;
      }

      if (!email.includes("@")) {
        failed += 1;
        errors.push({ email, reason: "INVALID_EMAIL" });
        continue;
      }

      if (password.length < 6) {
        failed += 1;
        errors.push({ email, reason: "PASSWORD_TOO_SHORT" });
        continue;
      }

      if (!["USER", "ADMIN"].includes(role)) {
        failed += 1;
        errors.push({ email, reason: "INVALID_ROLE" });
        continue;
      }

      if (!["ACTIVE", "BLOCKED"].includes(status)) {
        failed += 1;
        errors.push({ email, reason: "INVALID_STATUS" });
        continue;
      }

      const existing = await this.userRepo
        .createQueryBuilder("user")
        .where("LOWER(user.email) = LOWER(:email)", { email })
        .getOne();

      if (existing) {
        skipped += 1;
        errors.push({ email, reason: "ALREADY_EXISTS" });
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = this.userRepo.create({
        email,
        passwordHash,
        role: role as any,
        status: status as any,
      });

      await this.userRepo.save(user);
      created += 1;
    }

    return {
      created,
      skipped,
      failed,
      errors,
    };
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
      throw new AppError("BACKUP_FAILED", 500, {
        reason: "ENV_NOT_SET",
        missing: [
          !POSTGRES_DB ? "POSTGRES_DB" : null,
          !POSTGRES_USER ? "POSTGRES_USER" : null,
          !POSTGRES_PASSWORD ? "POSTGRES_PASSWORD" : null,
        ].filter(Boolean),
      });
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
        { windowsHide: true },
      );

      dump.on("error", (err) => {
        reject(
          new AppError("BACKUP_FAILED", 500, {
            reason: "DOCKER_EXEC_FAILED",
            message: err.message,
          }),
        );
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

          return reject(
            new AppError("BACKUP_FAILED", 500, {
              reason: "PG_DUMP_FAILED",
              code,
              stderr: errText,
            }),
          );
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
