import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function requireRole(...roles: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const role = String(res.locals.user?.role ?? "");

    if (!res.locals.user?.id) {
      return next(new AppError("AUTH_REQUIRED", 401));
    }

    if (!roles.includes(role)) {
      return next(new AppError("FORBIDDEN", 403));
    }

    next();
  };
}
