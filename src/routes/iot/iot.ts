import { Router } from "express";
import db from "..//../data-source";
import bcrypt from "bcryptjs";

import { Sensor } from "..//../entities/Sensor";
import { SensorEvent } from "..//../entities/SensorEvent";
import { SensorType, SensorState } from "..//../entities/enums";

const router = Router();

/**
 * @swagger
 * /iot/sensors/{sensorId}/events:
 *   post:
 *     summary: Device ingest event (no JWT)
 *     description: |
 *       IoT device sends events using X-Device-Secret header.
 *       - MOTION: body can be empty {}
 *       - OPEN: body must include state OPEN/CLOSED
 *     tags: [IoT]
 *     parameters:
 *       - in: path
 *         name: sensorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Sensor ID
 *       - in: header
 *         name: X-Device-Secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Device secret generated when sensor was created
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
 *     responses:
 *       200:
 *         description: Event created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid device secret
 *       404:
 *         description: Sensor not found
 */
router.post("/sensors/:sensorId/events", async (req, res, next) => {
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
    if (!sensor)
      return res.status(404).json({ ok: false, error: "SENSOR_NOT_FOUND" });

    if (!sensor.deviceSecretHash) {
      return res
        .status(401)
        .json({ ok: false, error: "DEVICE_SECRET_NOT_CONFIGURED" });
    }

    const ok = await bcrypt.compare(deviceSecret, sensor.deviceSecretHash);
    if (!ok)
      return res
        .status(401)
        .json({ ok: false, error: "INVALID_DEVICE_SECRET" });

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
          error: "INVALID_STATE",
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
