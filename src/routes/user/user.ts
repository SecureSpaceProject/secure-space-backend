import { Router } from "express";
import validate from "../../middlewares/validate";
import { UserService } from "../../services/user.service";
import { updateMeSchema } from "./types";
import type { GetMeRequest, MeResponse, UpdateMeRequest } from "./types";
import type { NextFunction } from "express";


const router = Router();
const userService = new UserService();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile operations
 */

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get current user profile
 *     description: |
 *       Returns information about the currently authenticated user.
 *       Authentication is simulated via `x-user-id` header.
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used for temporary authentication
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "11111111-1111-1111-1111-111111111111"
 *                     email:
 *                       type: string
 *                       example: "test.user@securespace.local"
 *                     role:
 *                       type: string
 *                       example: "USER"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (missing x-user-id)
 *       404:
 *         description: User not found
 */
router.get("/me", async (req: GetMeRequest, res: MeResponse, next: NextFunction) => {
  try {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const dto = await userService.getMe(String(userId));
    return res.json({ ok: true, data: dto });
  } catch (e) {
    return next(e);
  }
});

/**
 * @swagger
 * /me:
 *   patch:
 *     summary: Update current user profile
 *     description: |
 *       Updates allowed fields of the current user's profile.
 *       Currently supports updating email only.
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used for temporary authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "updated.user@securespace.com"
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.patch(
  "/me",
  validate(updateMeSchema),
  async (req: UpdateMeRequest, res: MeResponse, next: NextFunction) => {
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
