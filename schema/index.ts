import { model } from "mongoose";
import { RoomType, UserType } from "../types";
import UserSchema from "./User";
import RoomSchema from "./Room";

export const User = model<UserType>("users", UserSchema);
export const Room = model<RoomType>("rooms", RoomSchema);