import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";

type JwtPayload = {
  sub: string;
  role?: string;
};

export default function jwtAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header) return next();

  if (!header.startsWith("Bearer ")) {
    return next(
      new AppError("AUTH_REQUIRED", 401, { reason: "INVALID_AUTH_HEADER" })
    );
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return next(
      new AppError("AUTH_REQUIRED", 401, { reason: "MISSING_TOKEN" })
    );
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as JwtPayload;

    res.locals.user = {
      id: payload.sub,
      role: payload.role ?? "USER",
    } as any;

    return next();
  } catch {
    return next(
      new AppError("AUTH_REQUIRED", 401, { reason: "TOKEN_INVALID" })
    );
  }
}
