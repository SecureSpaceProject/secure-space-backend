import type { NextFunction, Request } from "express";
import type { BaseResponse } from "../interfaces";

export default function mockAuth(
  req: Request,
  res: BaseResponse,
  next: NextFunction
) {
  const userId = req.header("x-user-id");

  if (!userId || userId.trim().length === 0) {
    return res.status(401).json({ ok: false, error: "Missing x-user-id header" });
  }

  res.locals.user = { id: userId.trim() } as any;

  return next();
}
