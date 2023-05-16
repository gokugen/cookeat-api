import { Schema } from "mongoose";
import { Roles, UserType } from "../types";

export default new Schema<UserType>({
	email: { type: String, unique: true, required: true },
	username: { type: String, unique: true, required: true },
	password: { type: String, select: false },
	role: { type: String, default: Roles.USER },
	views: { type: Array },
	videosFiles: { type: Array },
}, { minimize: false });
