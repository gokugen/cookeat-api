import { model } from "mongoose";
import { UserType, AnonymousUserType } from "../types";
import UserSchema from "./User";
import AnonymousUserSchema from "./AnonymousUser";
import RecipeSchema, { RecipeType } from "./Recipe";

export const User = model<UserType>("users", UserSchema);
export const AnonymousUser = model<AnonymousUserType>("anonymous_users", AnonymousUserSchema);
export const Recipe = model<RecipeType>("recipes", RecipeSchema);