import type { ErrorCode } from "./errors";

export class AppError extends Error {
  status: number;
  code: ErrorCode;
  details?: unknown;

  constructor(code: ErrorCode, status = 400, details?: unknown) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
