import { Router } from "express";
import db from "..//../data-source";

import { Sensor } from "..//../entities/Sensor";
import { SensorEvent } from "..//../entities/SensorEvent";
import { RoomMember } from "..//../entities/RoomMember";
import { SensorType, SensorState } from "..//../entities/enums";

import { requireAuth } from "..//../middlewares/requireAuth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Sensors
 *     description: Sensors management & IoT event simulation
 */

/**
 * @swagger
 * /sensors:
 *   post:
 *     summary: Create sensor in room
 *     description: Creates a sensor and assigns it to a room.
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
 *                 example: "22222222-2222-2222-2222-222222222222"
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a room member)
 */
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
        error: "invalid type",
        allowed: Object.values(SensorType),
      });
    }

    const roomMemberRepo = db.getRepository(RoomMember);
    const membership = await roomMemberRepo.findOne({
      where: { roomId, userId } as any,
    });
    if (!membership) {
      return res.status(403).json({ ok: false, error: "NOT_A_ROOM_MEMBER" });
    }

    const deviceSecret = crypto.randomBytes(24).toString("base64url");
    const deviceSecretHash = await bcrypt.hash(deviceSecret, 10);

    const sensorRepo = db.getRepository(Sensor);
    const sensor = sensorRepo.create({
      roomId,
      name,
      type,
      isActive: true,
      deviceSecretHash,
    } as any);

    await sensorRepo.save(sensor);
    return res.json({ ok: true, data: { sensor, deviceSecret } });
  } catch (e) {
    next(e);
  }
});

/**
 * @swagger
 * /sensors/{sensorId}/events:
 *   post:
 *     summary: Simulate sensor event (insert into sensor_events)
 *     description: |
 *       - If sensor.type = MOTION -> creates eventType=MOTION, state=null
 *       - If sensor.type = OPEN -> creates eventType=OPEN, state=OPEN|CLOSED
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
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
 *                 example: "OPEN"
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a room member)
 *       404:
 *         description: Sensor not found
 */
router.post("/:sensorId/events", requireAuth, async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { state } = req.body || {};
    const userId = (req as any).user?.id as string;

    const sensorRepo = db.getRepository(Sensor);
    const eventRepo = db.getRepository(SensorEvent);
    const roomMemberRepo = db.getRepository(RoomMember);

    const sensor = await sensorRepo.findOne({ where: { id: sensorId } as any });
    if (!sensor)
      return res.status(404).json({ ok: false, error: "SENSOR_NOT_FOUND" });

    const membership = await roomMemberRepo.findOne({
      where: { roomId: sensor.roomId, userId } as any,
    });
    if (!membership)
      return res.status(403).json({ ok: false, error: "NOT_A_ROOM_MEMBER" });

    if (sensor.type === SensorType.MOTION) {
      const ev = eventRepo.create({
        sensorId: sensor.id,
        eventType: SensorType.MOTION,
        state: null,
      } as any);

      await eventRepo.save(ev);
      return res.json({ ok: true, data: ev });
    }

    if (sensor.type === SensorType.OPEN) {
      if (state !== SensorState.OPEN && state !== SensorState.CLOSED) {
        return res.status(400).json({
          ok: false,
          error: "state is required for OPEN sensor and must be OPEN/CLOSED",
          allowed: [SensorState.OPEN, SensorState.CLOSED],
        });
      }

      const ev = eventRepo.create({
        sensorId: sensor.id,
        eventType: SensorType.OPEN,
        state,
      } as any);

      await eventRepo.save(ev);
      return res.json({ ok: true, data: ev });
    }

    return res
      .status(400)
      .json({ ok: false, error: "UNSUPPORTED_SENSOR_TYPE" });
  } catch (e) {
    next(e);
  }
});

export default router;
