import { RouteType } from "../../types";
import { createGuestUser, confirmPayment } from "../controllers/payment-controller";


export default [
    {
        url: "/payment/create-guest",
        method: "post",
        func: createGuestUser
    },
    {
        url: "/payment/confirm",
        method: "post",
        func: confirmPayment
    }
] as RouteType[];
