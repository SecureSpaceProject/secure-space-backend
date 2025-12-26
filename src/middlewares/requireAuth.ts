import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user =
    (res.locals as any).user ?? (req as any).user ?? (req as any).auth ?? null;

  const userId =
    user?.id ??
    user?.sub ??
    (req as any).userId ??
    (res.locals as any).userId ??
    null;

  if (!userId) {
    return next(new AppError("AUTH_REQUIRED", 401));
  }

  (res.locals as any).user = { ...(user || {}), id: userId };
  (req as any).user = { ...((req as any).user || {}), id: userId };

  next();
}
