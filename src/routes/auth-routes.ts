import { RouteType } from "types";
import { signUp, signIn } from "../controllers/auth-controller";

export default [
    {
        url: "/sign-up",
        method: "post",
        func: signUp
    },
    {
        url: "/sign-in",
        method: "post",
        func: signIn
    }
] as RouteType[];
