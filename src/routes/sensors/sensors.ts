import { Router } from "express";
import db from "..//../data-source";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { DeepPartial } from "typeorm";

import { requireAuth } from "..//../middlewares/requireAuth";

import { Sensor } from "..//../entities/Sensor";
import { SensorEvent } from "..//../entities/SensorEvent";
import { Room } from "..//../entities/Room";
import { Alert } from "..//../entities/Alert";
import { Notification } from "..//../entities/Notification";
import { RoomMember } from "..//../entities/RoomMember";
import {
  SensorType,
  SensorState,
  RoomMemberRole,
  AlertStatus,
} from "..//../entities/enums";
import { logRoomActivity } from "..//..//roomActivityLogger";
import { ActivityAction, ActivityTargetType } from "..//../entities/enums";

const router = Router();

async function handleAlertIfNeeded(args: { roomId: string; eventId: string }) {
  const { roomId, eventId } = args;

  const roomRepo = db.getRepository(Room);
  const alertRepo = db.getRepository(Alert);
  const memberRepo = db.getRepository(RoomMember);
  const notifRepo = db.getRepository(Notification);

  const room = await roomRepo.findOne({ where: { id: roomId } as any });
  if (!room) return;
  if (!room.isArmed) return;

  const activeAlert = await alertRepo.findOne({
    where: { roomId, status: AlertStatus.OPEN } as any,
  });
  if (activeAlert) return;

  const savedAlert = await alertRepo.save({
    roomId,
    eventId,
    status: AlertStatus.OPEN,
    closedAt: null,
    closedByUserId: null,
  } as DeepPartial<Alert>);

  const members = await memberRepo.find({ where: { roomId } as any });

  const notifications: DeepPartial<Notification>[] = members.map((m) => ({
    userId: m.userId,
    roomId,
    alertId: savedAlert.id,
    message: "У кімнаті зафіксовано спрацювання датчика. Тривогу увімкнено.",
    status: "PENDING" as any,
    readAt: null,
  }));

  if (notifications.length > 0) {
    await notifRepo.save(notifications);
  }
}

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { roomId, name, type } = req.body || {};
    const userId = (req as any).user?.id as string;

    if (!roomId || typeof roomId !== "string") {
      return res.status(400).json({ ok: false, error: "roomId is required" });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "name is required" });
    }
    if (!type || !Object.values(SensorType).includes(type)) {
      return res.status(400).json({
        ok: false,
        error: "INVALID_SENSOR_TYPE",
        allowed: Object.values(SensorType),
      });
    }

    const roomMemberRepo = db.getRepository(RoomMember);

    const membership = await roomMemberRepo
      .createQueryBuilder("rm")
      .where("rm.roomId = :roomId", { roomId })
      .andWhere("rm.userId = :userId", { userId })
      .getOne();

    if (!membership) {
      return res.status(403).json({ ok: false, error: "NOT_A_ROOM_MEMBER" });
    }

    if (
      membership.memberRole !== RoomMemberRole.OWNER &&
      membership.memberRole !== RoomMemberRole.ADMIN
    ) {
      return res.status(403).json({ ok: false, error: "INSUFFICIENT_ROLE" });
    }

    const deviceSecret = crypto.randomBytes(24).toString("base64url");
    const deviceSecretHash = await bcrypt.hash(deviceSecret, 10);

    const sensorRepo = db.getRepository(Sensor);

    const sensor = await sensorRepo.save({
      roomId,
      name,
      type,
      isActive: true,
      deviceSecretHash,
    } as any);

    await logRoomActivity({
      roomId,
      actorUserId: userId,
      action: ActivityAction.ADD_SENSOR,
      targetType: ActivityTargetType.SENSOR,
      targetId: sensor.id,
    });

    return res.json({ ok: true, data: { sensor, deviceSecret } });
  } catch (e) {
    next(e);
  }
});

router.post("/:sensorId/events", requireAuth, async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { state } = req.body || {};
    const userId = (req as any).user?.id as string;

    const sensorRepo = db.getRepository(Sensor);
    const eventRepo = db.getRepository(SensorEvent);
    const roomMemberRepo = db.getRepository(RoomMember);

    const sensor = await sensorRepo.findOne({ where: { id: sensorId } as any });
    if (!sensor) {
      return res.status(404).json({ ok: false, error: "SENSOR_NOT_FOUND" });
    }

    const membership = await roomMemberRepo
      .createQueryBuilder("rm")
      .where("rm.roomId = :roomId", { roomId: sensor.roomId })
      .andWhere("rm.userId = :userId", { userId })
      .getOne();

    if (!membership) {
      return res.status(403).json({ ok: false, error: "NOT_A_ROOM_MEMBER" });
    }

    if (sensor.type === SensorType.MOTION) {
      const savedEv = await eventRepo.save({
        sensorId: sensor.id,
        eventType: SensorType.MOTION,
        state: null,
      } as any);

      await handleAlertIfNeeded({ roomId: sensor.roomId, eventId: savedEv.id });

      return res.json({ ok: true, data: savedEv });
    }

    if (sensor.type === SensorType.OPEN) {
      if (state !== SensorState.OPEN && state !== SensorState.CLOSED) {
        return res.status(400).json({
          ok: false,
          error: "INVALID_STATE",
          allowed: [SensorState.OPEN, SensorState.CLOSED],
        });
      }

      const savedEv = await eventRepo.save({
        sensorId: sensor.id,
        eventType: SensorType.OPEN,
        state,
      } as any);

      await handleAlertIfNeeded({ roomId: sensor.roomId, eventId: savedEv.id });

      return res.json({ ok: true, data: savedEv });
    }

    return res
      .status(400)
      .json({ ok: false, error: "UNSUPPORTED_SENSOR_TYPE" });
  } catch (e) {
    next(e);
  }
});

/**
 * @swagger
 * tags:
 *   - name: Sensors
 *     description: Sensors (JWT) + event simulation + optional alert creation
 */

/**
 * @swagger
 * /sensors:
 *   post:
 *     summary: Create sensor in room (OWNER/ADMIN only)
 *     description: |
 *       Creates a sensor and assigns it to a room.
 *       Access:
 *       - User must be a member of the room
 *       - Only room OWNER or ADMIN can create sensors
 *       Response returns `deviceSecret` which is used by the IoT device endpoint.
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, name, type]
 *             properties:
 *               roomId:
 *                 type: string
 *                 example: "38b2eb30-1c47-4e7f-9344-3d17a9bcfc35"
 *               name:
 *                 type: string
 *                 example: "Датчик дверей кухня"
 *               type:
 *                 type: string
 *                 enum: [MOTION, OPEN]
 *                 example: "OPEN"
 *     responses:
 *       200:
 *         description: Sensor created
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
 *                     sensor:
 *                       type: object
 *                     deviceSecret:
 *                       type: string
 *                       description: Secret for IoT device (send in X-Device-Secret header)
 *       400:
 *         description: Validation error (missing/invalid roomId, name, type)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "INVALID_SENSOR_TYPE"
 *       401:
 *         description: Unauthorized (missing/invalid JWT)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "AUTH_REQUIRED"
 *       403:
 *         description: Forbidden (not a room member or insufficient role)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   examples:
 *                     notMember:
 *                       value: "NOT_A_ROOM_MEMBER"
 *                     noRole:
 *                       value: "INSUFFICIENT_ROLE"
 */

/**
 * @swagger
 * /sensors/{sensorId}/events:
 *   post:
 *     summary: Create sensor event (JWT user)
 *     description: |
 *       Creates a SensorEvent as an authenticated user (JWT).
 *       User must be a member of the room where this sensor belongs.
 *
 *       Event rules:
 *       - If sensor.type = MOTION -> creates eventType=MOTION, state=null
 *       - If sensor.type = OPEN -> requires body.state OPEN/CLOSED
 *
 *       Alert rules (after saving event):
 *       - If room.isArmed=true AND there is no active OPEN alert in the room,
 *         then creates Alert(OPEN) and Notifications for all room members.
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *         example: "22222222-2222-2222-2222-222222222222"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 enum: [OPEN, CLOSED]
 *           examples:
 *             motion:
 *               summary: Motion (no body needed)
 *               value: {}
 *             doorOpen:
 *               summary: Door opened
 *               value:
 *                 state: "OPEN"
 *             doorClosed:
 *               summary: Door closed
 *               value:
 *                 state: "CLOSED"
 *     responses:
 *       200:
 *         description: Sensor event created
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
 *                   description: Saved SensorEvent entity
 *       400:
 *         description: Invalid state or unsupported sensor type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   examples:
 *                     invalidState:
 *                       value: "INVALID_STATE"
 *                     unsupported:
 *                       value: "UNSUPPORTED_SENSOR_TYPE"
 *       401:
 *         description: Unauthorized (missing/invalid JWT)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "AUTH_REQUIRED"
 *       403:
 *         description: Forbidden (not a room member)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "NOT_A_ROOM_MEMBER"
 *       404:
 *         description: Sensor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "SENSOR_NOT_FOUND"
 */

export default router;
