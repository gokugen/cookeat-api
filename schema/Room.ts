import { Schema } from "mongoose";
import { RoomType } from "../types";

export default new Schema<RoomType>({
	isPublic: { type: Boolean, default: true },
	title: { type: String },
	category: { type: String },
	tags: { type: Array },
	views: { type: Array }
}, { minimize: false });
