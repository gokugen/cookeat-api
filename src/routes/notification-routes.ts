import { checkAdmin } from "../controllers/auth-controller";
import { RouteType } from "../../types";
import {
  sendTestNotification,
  sendActivityReminders,
  sendWelcomeNotification,
  sendCustomNotification,
  triggerActivityCheck,
  getActivityStats
} from "../controllers/notification-controller";

export default [
  {
    url: "/notification/test",
    method: "post",
    func: sendTestNotification
  },
  {
    url: "/notification/activity-reminders",
    method: "post",
    func: [checkAdmin, sendActivityReminders]
  },
  {
    url: "/notification/welcome",
    method: "post",
    func: sendWelcomeNotification
  },
  {
    url: "/notification/custom",
    method: "post",
    func: [checkAdmin, sendCustomNotification]
  },
  {
    url: "/notification/trigger-check",
    method: "post",
    func: [checkAdmin, triggerActivityCheck]
  },
  {
    url: "/notification/stats",
    method: "get",
    func: [checkAdmin, getActivityStats]
  }
] as RouteType[];
