import { RouteType } from "../../types";
import { getCurrentSubscription, cancelSubscription, reactivateSubscription } from "../controllers/subscription-controller";

export default [
  {
    url: "/subscription/current",
    method: "get",
    func: getCurrentSubscription
  },
  {
    url: "/subscription/cancel",
    method: "post",
    func: cancelSubscription
  },
  {
    url: "/subscription/reactivate",
    method: "post",
    func: reactivateSubscription
  }
] as RouteType[]; 