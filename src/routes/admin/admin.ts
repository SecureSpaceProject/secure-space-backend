import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { AdminService } from "../../services/admin.service";

const router = Router();
const adminService = new AdminService();

router.get(
  "/users",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res, next) => {
    try {
      const users = await adminService.listUsers();
      return res.json({ ok: true, data: users });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/users/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: string };

      if (!status || !["ACTIVE", "BLOCKED"].includes(status)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid status. Use ACTIVE or BLOCKED.",
        });
      }

      const updated = await adminService.setUserStatus(
        id,
        status as "ACTIVE" | "BLOCKED"
      );
      if (!updated)
        return res.status(404).json({ ok: false, error: "User not found" });

      return res.json({ ok: true, data: updated });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/backup",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res, next) => {
    try {
      const result = await adminService.backupDatabase();
      return res.json({ ok: true, data: result });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative endpoints
 */

/**
 * @swagger
 * /admin/backup:
 *   post:
 *     summary: Create full database backup (pg_dump)
 *     description: |
 *       Creates a full PostgreSQL database backup using pg_dump.
 *       Requires ADMIN role. Backup file will be saved into ./backups directory on the server.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
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
 *                     fileName:
 *                       type: string
 *                       example: "backup_securespace_2025-12-25T15-20-10-123Z.sql"
 *                     filePath:
 *                       type: string
 *                       example: "C:\\project\\secure-space-backend\\backups\\backup_securespace_2025-12-25T15-20-10-123Z.sql"
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (ADMIN only)
 *       500:
 *         description: Backup failed (pg_dump error or missing DB env vars)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin)
 *     description: Returns list of all users. Requires ADMIN role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
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
 *                         format: uuid
 *                         example: "11111111-1111-1111-1111-111111111111"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "test.user@gmail.com"
 *                       role:
 *                         type: string
 *                         example: "USER"
 *                       status:
 *                         type: string
 *                         example: "ACTIVE"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (ADMIN only)
 */

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Block or unblock user (admin)
 *     description: Sets user status to ACTIVE or BLOCKED. Requires ADMIN role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, BLOCKED]
 *                 example: "BLOCKED"
 *     responses:
 *       200:
 *         description: User status updated
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
 *                       format: uuid
 *                       example: "11111111-1111-1111-1111-111111111111"
 *                     status:
 *                       type: string
 *                       example: "BLOCKED"
 *       400:
 *         description: Invalid status (use ACTIVE or BLOCKED)
 *       401:
 *         description: Unauthorized (missing/expired/invalid JWT)
 *       403:
 *         description: Forbidden (ADMIN only)
 *       404:
 *         description: User not found
 */

export default router;
