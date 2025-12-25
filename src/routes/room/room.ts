import { Router } from "express";
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

const router = Router();

function getUserId(req: any, res: any): string {
  const fromLocals = res.locals?.user?.id;
  const fromHeader = req.header("x-user-id");
  return (fromLocals || fromHeader || "").toString();
}

router.post("/", async (req: CreateRoomRequest, res) => {
  const userId = getUserId(req, res);
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { error } = createRoomSchema.validate(req.body);
  if (error) return res.status(400).json({ ok: false, error: error.message });

  const result = await RoomService.createRoom(userId, req.body);
  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });

  return res.status(201).json({ ok: true, data: result.data });
});

router.get("/", async (req: GetRoomsRequest, res) => {
  const userId = getUserId(req, res);
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const result = await RoomService.getMyRooms(userId);
  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });

  return res.json({ ok: true, data: result.data });
});

router.get("/:id", async (req: GetRoomByIdRequest, res) => {
  const userId = getUserId(req, res);
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const result = await RoomService.getRoomById(userId, req.params.id);
  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });

  return res.json({ ok: true, data: result.data });
});

router.patch("/:id", async (req: UpdateRoomRequest, res) => {
  const userId = getUserId(req, res);
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { error } = updateRoomSchema.validate(req.body);
  if (error) return res.status(400).json({ ok: false, error: error.message });

  const result = await RoomService.updateRoom(userId, req.params.id, req.body);
  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });

  return res.json({ ok: true, data: result.data });
});

router.delete("/:id", async (req: DeleteRoomRequest, res) => {
  const userId = getUserId(req, res);
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const result = await RoomService.deleteRoom(userId, req.params.id);
  if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });

  return res.json({ ok: true, data: result.data });
});

/**
 * @swagger
 * tags:
 *   - name: Rooms
 *     description: Rooms management (CRUD) for SecureSpace
 */

/**
 * @swagger
 * /room:
 *   post:
 *     summary: Create a room
 *     description: Creates a new room. The creator becomes OWNER in room_members.
 *     tags: [Rooms]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "My apartment"
 *     responses:
 *       201:
 *         description: Room created successfully
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get my rooms
 *     description: Returns rooms where the current user is a member (room_members).
 *     tags: [Rooms]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used for temporary authentication
 *     responses:
 *       200:
 *         description: List of rooms
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
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /room/{id}:
 *   get:
 *     summary: Get room details
 *     description: Returns room details if the current user is a member of this room.
 *     tags: [Rooms]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used for temporary authentication
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details
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
 *                     name:
 *                       type: string
 *                     isArmed:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a room member)
 *       404:
 *         description: Room not found
 *
 *   patch:
 *     summary: Update a room
 *     description: Updates room fields (name, isArmed). Allowed for OWNER/ADMIN only.
 *     tags: [Rooms]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used for temporary authentication
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Updated room name"
 *               isArmed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Room updated successfully
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
 *                     name:
 *                       type: string
 *                     isArmed:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (OWNER/ADMIN only or not a member)
 *       404:
 *         description: Room not found
 *
 *   delete:
 *     summary: Delete a room
 *     description: Deletes the room. Allowed for OWNER only.
 *     tags: [Rooms]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID used for temporary authentication
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted successfully
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (OWNER only or not a member)
 *       404:
 *         description: Room not found
 */


export default router;
