import type { Request, Response, NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const role = String(res.locals.user?.role ?? "");
    if (!role)
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (!roles.includes(role))
      return res.status(403).json({ ok: false, error: "Forbidden" });
    next();
  };
}
