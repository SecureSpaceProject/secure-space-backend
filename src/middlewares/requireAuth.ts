import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.user?.id) {
    return next(new AppError("AUTH_REQUIRED", 401));
  }
  next();
}
