import type { Request } from "express";
import type { BaseResponse } from "../../interfaces";
import Joi from "joi";

export type RoomMemberDto = {
  id: string;
  roomId: string;
  userId: string;
  memberRole: string;
  addedAt: string;
};

export type AddRoomMemberBody = {
  userId: string;
  memberRole: string; 
};

export type UpdateRoomMemberRoleBody = {
  memberRole: string;
};

export type AddRoomMemberRequest = Request<{ roomId: string }, unknown, AddRoomMemberBody>;
export type GetRoomMembersRequest = Request<{ roomId: string }>;
export type DeleteRoomMemberRequest = Request<{ roomId: string; userId: string }>;
export type UpdateRoomMemberRoleRequest = Request<
  { roomId: string; userId: string },
  unknown,
  UpdateRoomMemberRoleBody
>;

export type RoomMemberResponse = BaseResponse<RoomMemberDto>;
export type RoomMembersResponse = BaseResponse<RoomMemberDto[]>;
export type DeleteMemberResponse = BaseResponse<{ userId: string }>;

export const addRoomMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  memberRole: Joi.string().valid("DEFAULT", "ADMIN", "OWNER").required(),
});

export const updateRoomMemberRoleSchema = Joi.object({
  memberRole: Joi.string().valid("DEFAULT", "ADMIN", "OWNER").required(),
});
