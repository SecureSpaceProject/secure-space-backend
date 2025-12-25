import type { Request } from "express";
import type { BaseResponse } from "../../interfaces";
import Joi from "joi";

export type MeDto = {
  id: string;
  email: string;
  role: string;
  createdAt: string; 
  status: string;
};

export type UpdateMeBody = {
  email?: string;
};

export type GetMeRequest = Request;

export type UpdateMeRequest = Request<unknown, unknown, UpdateMeBody>;

export type MeResponse = BaseResponse<MeDto>;

export const updateMeSchema = Joi.object({
  email: Joi.string().email().max(255),
}).min(1);