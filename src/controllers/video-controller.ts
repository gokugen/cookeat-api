import { User } from "../../schema";
import multer from "multer"
import ApiError from "../helpers/api-error";
import { NextFunction, Response } from "express";
import { getFilePathAndUrl } from "../helpers/functions"
import { Request } from "../../types";
import path from "path";
import fs from "fs";

// Configurer le stockage pour multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dirPath = path.join(__dirname, "..", "..", process.env.NODE_ENV !== "local" ? ".." : "", "public", req.params.userId.toLowerCase());
        await fs.promises.mkdir(dirPath, { recursive: true }).catch(console.log);
        cb(null, dirPath);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + `-${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage })

function uploadVideo(req: Request, res: Response, next: NextFunction) {
    const uploadVideo = upload.array("videos")

    uploadVideo(req, res, async (err) => {
        if (err) {
            console.log(err);
            return next(new ApiError("Bad request", 400));
        }

        User.findById(req.params.userId).then((user) => {
            console.log(req.files)
            const promises: any = []
            // @ts-ignore
            req.files.forEach((file: any) => promises.push(getFilePathAndUrl(user._id.toString() as string, file.filename)))

            Promise.all(promises).then((response: any) => {
                // @ts-ignore
                response.forEach((obj, index: number) => user.videosFiles.push({ uri: obj.fileUrl, duration: req.files[index].duration }))
                user.save()
                res.status(200).send()
            }).catch(console.log)
        }).catch(next)
    });
}

function getVideos(req: Request, res: Response, next: NextFunction) {
    const uploadVideo = upload.array("videos")

    uploadVideo(req, res, async (err) => {
        if (err) {
            console.log(err);
            return next(new ApiError("Bad request", 400));
        }

        res.status(200).send();
    });
}

export {
    uploadVideo,
    getVideos
}
