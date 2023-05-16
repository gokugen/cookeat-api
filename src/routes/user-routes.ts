import { checkAdmin } from "../controllers/auth-controller";
import { RouteType } from "../../types";
import { whoAmI, getUsers, updateCurrentUser, updateUser, addCameraViewToUser } from "../controllers/user-controller";

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
        func: getUsers
    },
    {
        url: "/users/:id",
        method: "patch",
        func: [checkAdmin, updateUser]
    },
    {
        url: "/users/:id/views",
        method: "post",
        func: addCameraViewToUser
    }
] as RouteType[];
