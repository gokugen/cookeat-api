import { RouteType } from "../../types";
import { getVideos, uploadVideo } from "../controllers/video-controller";

export default [
    {
        url: "/videos/:userId/upload",
        method: "post",
        func: uploadVideo
    },
    {
        url: "/videos/:userId",
        method: "get",
        func: getVideos
    }
] as RouteType[];
