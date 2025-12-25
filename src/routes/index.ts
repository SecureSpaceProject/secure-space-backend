import { Router } from "express";
import userRouter from "./users/users";
import roomsRouter from "./rooms/rooms";
import roomMembersRouter from "./roomMembers/roomMembers";
import authRouter from "./auth/auth";
import adminUsersRouter from "./admin/admin";
const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/rooms", roomsRouter);
router.use("/rooms", roomMembersRouter);
router.use("/admin", adminUsersRouter);

export default router;
