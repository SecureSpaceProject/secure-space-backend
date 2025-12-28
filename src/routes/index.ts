import { Router } from "express";
import userRouter from "./users/users";
import roomsRouter from "./rooms/rooms";
import roomMembersRouter from "./roomMembers/roomMembers";
import authRouter from "./auth/auth";
import adminUsersRouter from "./admin/admin";
import sensorsRouter from "./sensors/sensors";
import iotRouter from "./iot/iot";
const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/rooms", roomsRouter);
router.use("/roommembers", roomMembersRouter);
router.use("/admin", adminUsersRouter);
router.use("/sensors", sensorsRouter);
router.use("/iot", iotRouter);

export default router;
