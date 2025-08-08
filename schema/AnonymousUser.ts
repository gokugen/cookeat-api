import { Schema } from "mongoose";
import { AnonymousUserType, UserRoles } from "../types";

export default new Schema<AnonymousUserType>({
	mobileId: { type: String, unique: true, required: true },
	firstName: { type: String },
	role: { type: String, default: UserRoles.USER },
	sex: { type: String },
	age: { type: String },
	cookingLevel: { type: String },
	cookingFrequency: { type: String },
	cookingForWho: { type: String },
	cookingTime: { type: String },
	diet: { type: String },
	howDidHeKnowCookEatAI: { type: String },
	lastActivity: { type: Date, default: () => new Date() }
}, { minimize: false });
