import type { Request, Response, NextFunction } from "express";

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.user?.id) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
}
