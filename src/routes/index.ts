import { Router } from "express";
import userRouter from "./users/users";
import roomsRouter from "./rooms/rooms";
import roomMembersRouter from "./roomMembers/roomMembers";

const router = Router();

router.use("/users", userRouter);
router.use("/rooms", roomsRouter);
router.use("/rooms", roomMembersRouter);

export default router;
