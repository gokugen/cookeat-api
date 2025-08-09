import { Schema } from "mongoose";
import { UserRoles, UserType } from "../types";

export default new Schema<UserType>({
	firstName: { type: String, required: true },
	email: { type: String, unique: true, required: true },
	password: { type: String, required: true, select: false },
	role: { type: String, default: UserRoles.USER },
	temporaryToken: { type: String },
	tempPassword: { type: String },
	refreshToken: { type: String },
	useExternalConnexion: { type: Boolean, default: false },
	nbSearch: { type: Number },
	language: { type: String, default: 'fr' }
}, { minimize: false });
