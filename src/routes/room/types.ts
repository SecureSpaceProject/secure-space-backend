import type { Request } from "express";
import type { BaseResponse } from "../../interfaces";
import Joi from "joi";

export type RoomDto = {
  id: string;
  name: string;
  isArmed: boolean;
  createdAt: string;
};

export type CreateRoomBody = {
  name: string;
};

export type UpdateRoomBody = {
  name?: string;
  isArmed?: boolean;
};

export type CreateRoomRequest = Request<unknown, unknown, CreateRoomBody>;
export type GetRoomsRequest = Request;
export type GetRoomByIdRequest = Request<{ id: string }>;
export type UpdateRoomRequest = Request<{ id: string }, unknown, UpdateRoomBody>;
export type DeleteRoomRequest = Request<{ id: string }>;

export type RoomResponse = BaseResponse<RoomDto>;
export type RoomsResponse = BaseResponse<RoomDto[]>;

export const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

export const updateRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  isArmed: Joi.boolean(),
}).min(1);
