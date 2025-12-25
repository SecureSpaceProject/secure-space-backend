import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import db from "../data-source";
import { User } from "../entities/User";
import type { Repository } from "typeorm";
import type { MeDto as AuthUserDto } from "../routes/users/types";

export class AuthService {
  private repo: Repository<User>;

  constructor() {
    this.repo = db.getRepository(User);
  }

  private toDto(u: User): AuthUserDto {
    return {
      id: String(u.id),
      email: String(u.email),
      role: String(u.role),
      createdAt: u.createdAt.toISOString(),
      status: String(u.status),
    };
  }

  private signAccessToken(userId: string, role: string): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET is missing in .env");

    const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
      "15m") as jwt.SignOptions["expiresIn"];

    return jwt.sign({ sub: userId, role }, secret, { expiresIn });
  }

  async register(email: string, password: string): Promise<AuthUserDto> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.repo.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) {
      const err: any = new Error("Email already in use");
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.repo.create({
      email: normalizedEmail,
      passwordHash,
      role: "USER" as any,
      status: "ACTIVE" as any,
    });

    await this.repo.save(user);
    return this.toDto(user);
  }

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.repo.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    return {
      accessToken: this.signAccessToken(String(user.id), String(user.role)),
    };
  }
}
