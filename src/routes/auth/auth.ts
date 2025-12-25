import { Router } from "express";
import validate from "../../middlewares/validate";
import { AuthService } from "../../services/auth.service";
import { loginSchema, registerSchema } from "./types";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./types";
import type { NextFunction } from "express";

const router = Router();
const authService = new AuthService();

router.post(
  "/register",
  validate(registerSchema),
  async (req: RegisterRequest, res: RegisterResponse, next: NextFunction) => {
    try {
      const user = await authService.register(
        req.body.email,
        req.body.password
      );
      return res.status(201).json({ ok: true, data: { user } as any });
    } catch (e) {
      return next(e);
    }
  }
);

router.post(
  "/login",
  validate(loginSchema),
  async (req: LoginRequest, res: LoginResponse, next: NextFunction) => {
    try {
      const { accessToken } = await authService.login(
        req.body.email,
        req.body.password
      );
      return res.json({
        ok: true,
        data: {
          accessToken,
          tokenType: "Bearer",
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
        },
      });
    } catch (e) {
      return next(e);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вхід (отримати JWT access token)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test.user@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123123"
 *     responses:
 *       200:
 *         description: OK
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
 *                     accessToken:
 *                       type: string
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                     expiresIn:
 *                       type: string
 *                       example: "15m"
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test.user@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123123"
 *     responses:
 *       201:
 *         description: Created
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
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       409:
 *         description: Email already in use
 */

export default router;
