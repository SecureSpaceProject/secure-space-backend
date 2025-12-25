import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

type JwtPayload = {
  sub: string; 
  role?: string;
};

export default function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) return next();

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

    res.locals.user = {
      id: payload.sub,
      role: payload.role ?? "USER",
    } as any;

    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Token expired or invalid" });
  }
}
