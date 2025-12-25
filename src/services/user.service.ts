import db from "../data-source";
import { User } from "../entities/User";       
import type { MeDto, UpdateMeBody } from "../routes/users/types";

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
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }

    return this.toMeDto(user);
  }

  async updateMe(userId: string, patch: UpdateMeBody): Promise<MeDto> {
    const user = await this.repo.findOne({
      where: { id: userId } as any,
    });

    if (!user) {
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }

    if (patch.email !== undefined) {
      (user as any).email = patch.email;
    }

    await this.repo.save(user);
    return this.toMeDto(user);
  }
}
