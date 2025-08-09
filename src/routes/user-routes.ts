import { checkAdmin } from "../controllers/auth-controller";
import { RouteType } from "../../types";
import { whoAmI, getUsers, updateCurrentUser, updateUser, saveOnboardingAnswers, updateNotificationToken, updateUserActivity } from "../controllers/user-controller";

export default [
    {
        url: "/users/who-am-i",
        method: "get",
        func: whoAmI
    },
    {
        url: "/users",
        method: "patch",
        func: updateCurrentUser
    },
    {
        url: "/users",
        method: "get",
        func: [checkAdmin, getUsers]
    },
    {
        url: "/users/:id",
        method: "patch",
        func: [checkAdmin, updateUser]
    },
    {
        url: "/user/onboarding",
        method: "post",
        func: saveOnboardingAnswers
    },
    {
        url: "/user/notification-token",
        method: "post",
        func: updateNotificationToken
    },
    {
        url: "/user/activity",
        method: "post",
        func: updateUserActivity
    }
] as RouteType[];
