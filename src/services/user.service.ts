import db from "../data-source";
import { User } from "../entities/User";
import type { MeDto, UpdateMeBody } from "../routes/users/types";
import { AppError } from "../errors/AppError";

export class UserService {
  private repo = db.getRepository(User);

  private toMeDto(u: User): MeDto {
    const anyU = u as any;

    return {
      id: String(anyU.id),
      email: String(anyU.email),
      role: String(anyU.role),
      createdAt: new Date(anyU.createdAt ?? anyU.created_at).toISOString(),
      status: String(anyU.status),
    };
  }

  async getMe(userId: string): Promise<MeDto> {
    const user = await this.repo.findOne({
      where: { id: userId } as any,
    });

    if (!user) {
      throw new AppError("USER_NOT_FOUND", 404);
    }

    return this.toMeDto(user);
  }

  async updateMe(userId: string, patch: UpdateMeBody): Promise<MeDto> {
    const user = await this.repo.findOne({
      where: { id: userId } as any,
    });

    if (!user) {
      throw new AppError("USER_NOT_FOUND", 404);
    }

    if (patch.email !== undefined) {
      (user as any).email = patch.email;
    }

    await this.repo.save(user);
    return this.toMeDto(user);
  }
}
