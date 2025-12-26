import { Router, type NextFunction } from "express";
import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomRequest,
  type DeleteRoomRequest,
  type GetRoomByIdRequest,
  type GetRoomsRequest,
  type UpdateRoomRequest,
} from "./types";
import { RoomService } from "../../services/room.service";
import { AppError } from "../../errors/AppError";

const router = Router();

function getUserId(_req: any, res: any): string {
  return (res.locals?.user?.id || "").toString();
}

router.post("/", async (req: CreateRoomRequest, res, next: NextFunction) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return next(new AppError("AUTH_REQUIRED", 401));

    const { error, value } = createRoomSchema.validate(req.body);
    if (error) {
      return next(
        new AppError("VALIDATION_FAILED", 400, {
          message: error.message,
          details: error.details,
        })
      );
    }

    const result = await RoomService.createRoom(userId, value);
    if (!result.ok)
      return res.status(result.status).json({ ok: false, error: result.error });

    return res.status(201).json({ ok: true, data: result.data });
  } catch (e) {
    return next(e);
  }
});

router.get("/", async (req: GetRoomsRequest, res, next: NextFunction) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return next(new AppError("AUTH_REQUIRED", 401));

    const result = await RoomService.getMyRooms(userId);
    if (!result.ok)
      return res.status(result.status).json({ ok: false, error: result.error });

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req: GetRoomByIdRequest, res, next: NextFunction) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return next(new AppError("AUTH_REQUIRED", 401));

    const result = await RoomService.getRoomById(userId, req.params.id);
    if (!result.ok)
      return res.status(result.status).json({ ok: false, error: result.error });

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    return next(e);
  }
});

router.patch(
  "/:id",
  async (req: UpdateRoomRequest, res, next: NextFunction) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return next(new AppError("AUTH_REQUIRED", 401));

      const { error, value } = updateRoomSchema.validate(req.body);
      if (error) {
        return next(
          new AppError("VALIDATION_FAILED", 400, {
            message: error.message,
            details: error.details,
          })
        );
      }

      const result = await RoomService.updateRoom(userId, req.params.id, value);
      if (!result.ok)
        return res
          .status(result.status)
          .json({ ok: false, error: result.error });

      return res.json({ ok: true, data: result.data });
    } catch (e) {
      return next(e);
    }
  }
);

router.delete(
  "/:id",
  async (req: DeleteRoomRequest, res, next: NextFunction) => {
    try {
      const userId = getUserId(req, res);
      if (!userId) return next(new AppError("AUTH_REQUIRED", 401));

      const result = await RoomService.deleteRoom(userId, req.params.id);
      if (!result.ok)
        return res
          .status(result.status)
          .json({ ok: false, error: result.error });

      return res.json({ ok: true, data: result.data });
    } catch (e) {
      return next(e);
    }
  }
);
/**
 * @swagger
 * tags:
 *   - name: Rooms
 *     description: Rooms management (CRUD) for SecureSpace
 */

/**
 * @swagger
 * /rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a new room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My apartment"
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
 *                       example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
 *                     name:
 *                       type: string
 *                       example: "My apartment"
 *                     isArmed:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-26T10:15:30.000Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 */

/**
 * @swagger
 * /rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Get my rooms
 *     security:
 *       - bearerAuth: []
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
 *                       name:
 *                         type: string
 *                         example: "My apartment"
 *                       isArmed:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-12-26T10:15:30.000Z"
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 */

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room by id (if user is a member)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
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
 *                     id:
 *                       type: string
 *                       example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
 *                     name:
 *                       type: string
 *                       example: "My apartment"
 *                     isArmed:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-26T10:15:30.000Z"
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (not a room member)
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /rooms/{id}:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update room (OWNER/ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New room name"
 *               isArmed:
 *                 type: boolean
 *                 example: true
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
 *                     id:
 *                       type: string
 *                       example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
 *                     name:
 *                       type: string
 *                       example: "New room name"
 *                     isArmed:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-26T10:15:30.000Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (OWNER/ADMIN only or not a member)
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete room (OWNER only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
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
 *                     id:
 *                       type: string
 *                       example: "2a4d2f0b-1a58-4a2b-9c60-2e4d8af8b1cc"
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (OWNER only or not a member)
 *       404:
 *         description: Room not found
 */

export default router;
