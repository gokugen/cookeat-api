import { RouteType } from "types";
import { createRoom, getRooms, updateRoom, removeRoom } from "../controllers/room-controller";

export default [
    {
        url: "/rooms",
        method: "post",
        func: createRoom
    },
    {
        url: "/rooms",
        method: "get",
        func: getRooms
    },
    {
        url: "/rooms/:id",
        method: "patch",
        func: [updateRoom]
    },
    {
        url: "/rooms/:id",
        method: "delete",
        func: [removeRoom]
    }
] as RouteType[];
