import { Room } from "../../schema";
import ApiError from "../helpers/api-error";
import { NextFunction, Response } from "express";
import { Request } from "../../types";
import generator from "generate-password"


async function createRoom(req: Request, res: Response, next: NextFunction) {
    return new Room({
        ...req.body, views: req.user.views, link: generator.generate({
            length: 10,
            numbers: true
        })
    })
        .save()
        .then((savedRoom) => res.status(201).send(savedRoom))
        .catch(next);
}

function getRooms(req: Request, res: Response, next: NextFunction) {
    Room.find({}).then(rooms => res.status(200).send(rooms))
}

async function updateRoom(req: Request, res: Response, next: NextFunction) {
    Room.findByIdAndUpdate(req.params.id, { ...req.body })
        .then(updatedRoom => res.status(200).send(updatedRoom))
        .catch(next);
}

async function removeRoom(req: Request, res: Response, next: NextFunction) {
    Room.findByIdAndDelete(req.params.id)
        .then(() => res.status(200).send())
        .catch(next);
}

export {
    createRoom,
    getRooms,
    updateRoom,
    removeRoom
}
