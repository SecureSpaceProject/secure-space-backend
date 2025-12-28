import { Router } from "express";
import {
  addRoomMemberSchema,
  updateRoomMemberRoleSchema,
  type AddRoomMemberRequest,
  type DeleteRoomMemberRequest,
  type GetRoomMembersRequest,
  type UpdateRoomMemberRoleRequest,
} from "./types";
import { RoomMemberService } from "../../services/room-member.service";
import type { NextFunction } from "express";
import { AppError } from "../../errors/AppError";

const router = Router({ mergeParams: true });

function getUserId(_req: any, res: any): string | null {
  const id = res.locals?.user?.id;
  if (id === undefined || id === null) return null;
  return String(id);
}

router.post("/:roomId/members", async (req: AddRoomMemberRequest, res) => {
  const actorUserId = getUserId(req, res);
  if (!actorUserId)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { error } = addRoomMemberSchema.validate(req.body);
  if (error) return res.status(400).json({ ok: false, error: error.message });

  const result = await RoomMemberService.addMember(
    actorUserId,
    req.params.roomId,
    req.body
  );
  if (!result.ok)
    return res.status(result.status).json({ ok: false, error: result.error });

  return res.status(201).json({ ok: true, data: result.data });
});

router.get(
  "/:roomId/members",
  async (req: GetRoomMembersRequest, res, next: NextFunction) => {
    const actorUserId = getUserId(req, res);
    if (!actorUserId) return next(new AppError("AUTH_REQUIRED", 401));

    const result = await RoomMemberService.listMembers(
      actorUserId,
      req.params.roomId
    );
    if (!result.ok)
      return res.status(result.status).json({ ok: false, error: result.error });

    return res.json({ ok: true, data: result.data });
  }
);

router.patch(
  "/:roomId/members/:userId",
  async (req: UpdateRoomMemberRoleRequest, res, next: NextFunction) => {
    const actorUserId = getUserId(req, res);
    if (!actorUserId) return next(new AppError("AUTH_REQUIRED", 401));

    const { error } = updateRoomMemberRoleSchema.validate(req.body);
    if (error) return res.status(400).json({ ok: false, error: error.message });

    const result = await RoomMemberService.updateMemberRole(
      actorUserId,
      req.params.roomId,
      req.params.userId,
      req.body
    );

    if (!result.ok)
      return res.status(result.status).json({ ok: false, error: result.error });

    return res.json({ ok: true, data: result.data });
  }
);

router.delete("/:roomId/members/:userId", async (req, res, next) => {
  const actorUserId = getUserId(req, res);
  if (!actorUserId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const result = await RoomMemberService.removeMember(
    actorUserId,
    req.params.roomId,
    req.params.userId
  );

  if (!result.ok) {
    return res
      .status(result.status ?? 500)
      .json({ ok: false, error: result.error });
  }

  return res.json({ ok: true, data: result.data });
});

/**
 * @swagger
 * tags:
 *   - name: RoomMembers
 *     description: Manage room members and access roles
 */

/**
 * @swagger
 * /roommembers/{roomId}/members:
 *   post:
 *     summary: Add a user to a room
 *     description: |
 *       Adds a user to the room with a specified role.
 *       Allowed for OWNER/ADMIN.
 *       ADMIN cannot grant ADMIN or OWNER roles (can only add DEFAULT).
 *     tags: [RoomMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
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
 *             required: [userId, memberRole]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "a1f4eec6-7c2b-4c2e-9d1a-8b2f3a4c5d6e"
 *               memberRole:
 *                 type: string
 *                 example: "DEFAULT"
 *                 description: One of DEFAULT, ADMIN, OWNER
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (not a room member / insufficient permissions / role grant rules)
 *       404:
 *         description: Room not found or User not found
 *       409:
 *         description: User already in room
 *
 *   get:
 *     summary: Get room members
 *     description: Returns list of room members. Allowed for any room member.
 *     tags: [RoomMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: List of room members
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (not a room member)
 *       404:
 *         description: Room not found
 */

/**
 * @swagger
 * /roommembers/{roomId}/members/{userId}:
 *   patch:
 *     summary: Update member role
 *     description: |
 *       Updates role of a room member.
 *       Allowed for OWNER/ADMIN.
 *       ADMIN cannot grant ADMIN or OWNER roles.
 *       ADMIN cannot modify OWNER.
 *     tags: [RoomMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberRole]
 *             properties:
 *               memberRole:
 *                 type: string
 *                 example: "ADMIN"
 *                 description: One of DEFAULT, ADMIN, OWNER
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (not a room member / insufficient permissions / role grant rules)
 *       404:
 *         description: Room not found or Member not found
 *
 *   delete:
 *     summary: Remove a member from room
 *     description: |
 *       Removes a user from a room.
 *       Allowed for OWNER/ADMIN.
 *       ADMIN can remove only DEFAULT members.
 *       Only OWNER can remove OWNER.
 *     tags: [RoomMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (not a room member / insufficient permissions / removal rules)
 *       404:
 *         description: Room not found or Member not found
 */

export default router;
