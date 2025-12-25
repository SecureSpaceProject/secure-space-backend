import type { Request } from "express";
import type { BaseResponse } from "../../interfaces";
import Joi from "joi";

export type RegisterBody = { email: string; password: string };
export type LoginBody = { email: string; password: string };

export type RegisterRequest = Request<unknown, unknown, RegisterBody>;
export type LoginRequest = Request<unknown, unknown, LoginBody>;

export type RegisterResponse = BaseResponse<{ user: any }>;
export type LoginResponse = BaseResponse<{ accessToken: string; tokenType: "Bearer"; expiresIn: string }>;

export const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(128).required(),
});
