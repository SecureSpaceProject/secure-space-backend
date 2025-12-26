import { Router } from "express";
import db from "..//../data-source";
import bcrypt from "bcryptjs";

import { Sensor } from "..//../entities/Sensor";
import { Room } from "..//../entities/Room";
import { Alert } from "..//../entities/Alert";
import { DeepPartial } from "typeorm";
import { Notification } from "..//../entities/Notification";
import { SensorEvent } from "..//../entities/SensorEvent";
import { SensorType, SensorState } from "..//../entities/enums";
import { RoomMember } from "..//..//entities/RoomMember";

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
    where: { roomId, status: "OPEN" as any } as any,
  });
  if (activeAlert) return;

  const alertToSave: DeepPartial<Alert> = {
    roomId,
    eventId,
    status: "OPEN" as any,
    closedAt: null,
    closedByUserId: null,
  };

  const savedAlert = await alertRepo.save(alertToSave);

  const members = await memberRepo.find({ where: { roomId } as any });

  const notificationsToSave: DeepPartial<Notification>[] = members.map((m) => ({
    userId: m.userId,
    roomId,
    alertId: savedAlert.id,
    message: "У кімнаті зафіксовано спрацювання датчика. Тривогу увімкнено.",
    status: "PENDING" as any,
    readAt: null,
  }));

  if (notificationsToSave.length > 0) {
    await notifRepo.save(notificationsToSave);
  }
}

router.post("/:sensorId/events", async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { state } = req.body || {};

    const deviceSecret = String(req.header("X-Device-Secret") || "");
    if (!deviceSecret) {
      return res
        .status(401)
        .json({ ok: false, error: "MISSING_DEVICE_SECRET" });
    }

    const sensorRepo = db.getRepository(Sensor);
    const eventRepo = db.getRepository(SensorEvent);

    const sensor = await sensorRepo.findOne({ where: { id: sensorId } as any });
    if (!sensor) {
      return res.status(404).json({ ok: false, error: "SENSOR_NOT_FOUND" });
    }

    if (!sensor.deviceSecretHash) {
      return res
        .status(401)
        .json({ ok: false, error: "DEVICE_SECRET_NOT_CONFIGURED" });
    }

    const ok = await bcrypt.compare(deviceSecret, sensor.deviceSecretHash);
    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, error: "INVALID_DEVICE_SECRET" });
    }

    if (sensor.type === SensorType.MOTION) {
      const savedEv = await eventRepo.save({
        sensorId: sensor.id,
        eventType: SensorType.MOTION,
        state: null,
      } as any);

      await handleAlertIfNeeded({
        roomId: sensor.roomId,
        eventId: savedEv.id,
      });

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

      await handleAlertIfNeeded({
        roomId: sensor.roomId,
        eventId: savedEv.id,
      });

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
 *   - name: IoT
 *     description: Device ingest endpoints (X-Device-Secret)
 */

/**
 * @swagger
 * /iot/{sensorId}/events:
 *   post:
 *     summary: IoT device ingest event (X-Device-Secret)
 *     description: |
 *       Device sends events using **X-Device-Secret** header (no JWT).
 *
 *       Behavior:
 *       - If sensor.type = MOTION -> creates SensorEvent with state = null
 *       - If sensor.type = OPEN -> requires body.state = OPEN or CLOSED
 *       - After saving SensorEvent:
 *         if room.isArmed = true AND there is no active OPEN alert in this room,
 *         then creates Alert(OPEN) and Notifications for all room members.
 *     tags: [IoT]
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *         example: "22222222-2222-2222-2222-222222222222"
 *       - in: header
 *         name: X-Device-Secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Device secret generated when sensor was created
 *         example: "rD2gV9Z2eHn_8lZQ7uDkqg4s1yJmB1cK"
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
 *         description: SensorEvent created
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
 *                   example: "INVALID_STATE"
 *       401:
 *         description: Missing/invalid device secret or secret not configured
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
 *                   example: "INVALID_DEVICE_SECRET"
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
