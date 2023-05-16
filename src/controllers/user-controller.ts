import { User } from "../../schema";
import ApiError from "../helpers/api-error";
import bcrypt from "bcryptjs";
import { NextFunction, Response } from "express";
import { Request } from "../../types";

async function whoAmI(req: Request, res: Response, next: NextFunction) {
    return res.status(200).send(req.user);
}

async function updateCurrentUser(req: Request, res: Response, next: NextFunction) {
    const body = { ...req.body };

    if (body.password)
        body.password = bcrypt.hashSync(body.password, 10);

    const user = req.user as any;

    if (!user)
        return next(new ApiError("User not found", 404));

    if (body.password) {
        if (user.useExternalConnexion)
            return next(new ApiError("Forbidden", 401));
        body.password = bcrypt.hashSync(body.password, 10);
    }

    delete req.body.__v;
    for (const key in req.body)
        user[key] = req.body[key];

    user.save();

    res.status(200).send(user);
}

async function updateUser(req: Request, res: Response, next: NextFunction) {
    const body = { ...req.body };
    const user: any = await User.findById(req.params.id);

    if (!user)
        return next(new ApiError("User not found", 404));

    if (body.password) {
        if (user.useExternalConnexion)
            return next(new ApiError("Forbidden", 401));
        body.password = bcrypt.hashSync(body.password, 10);
    }

    delete req.body.__v;
    for (const key in req.body)
        user[key] = req.body[key];

    user.save();

    res.status(200).send(user);
}

async function addCameraViewToUser(req: Request, res: Response, next: NextFunction) {
    const user: any = await User.findById(req.params.id);

    if (!user)
        return next(new ApiError("User not found", 404));

    if (!user.views.includes(req.body.streamUrl)) {
        user.views.push(req.body.streamUrl)
        user.save()
    }
    else
        return next(new ApiError("Live already added", 404));

    res.status(200).send(user);
}

function getUsers(req: Request, res: Response, next: NextFunction) {
    User.find({}, "+role").then(users => res.status(200).send(users))
}

export {
    whoAmI,
    updateCurrentUser,
    updateUser,
    addCameraViewToUser,
    getUsers,
}
