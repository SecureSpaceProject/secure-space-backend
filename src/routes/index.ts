import { Router } from "express";
import userRouter from "./user/user";
import roomsRouter from "./room/room";

const router = Router();

router.use("/user", userRouter);
router.use("/room", roomsRouter);

export default router;
