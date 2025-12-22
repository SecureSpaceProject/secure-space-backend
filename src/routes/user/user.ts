import { Router } from "express";
import validate from "../../middlewares/validate";
import { UserService } from "../../services/user.service";
import { updateMeSchema } from "./types";
import type { GetMeRequest, MeResponse, UpdateMeRequest } from "./types";

const router = Router();
const userService = new UserService();

router.get("/me", async (req: GetMeRequest, res: MeResponse, next) => {
  try {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const dto = await userService.getMe(String(userId));
    return res.json({ ok: true, data: dto });
  } catch (e) {
    return next(e);
  }
});

router.patch(
  "/me",
  validate(updateMeSchema),
  async (req: UpdateMeRequest, res: MeResponse, next) => {
    try {
      const userId = res.locals.user?.id;
      if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

      const dto = await userService.updateMe(String(userId), req.body);
      return res.json({ ok: true, data: dto });
    } catch (e) {
      return next(e);
    }
  }
);

export default router;
