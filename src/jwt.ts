import { User } from "../schema";
import { NextFunction, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { Request } from "types";
import ApiError from "./helpers/api-error";

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.ACCESSTOKENSECRET as Secret, (err: any, params: any) => {
            if (err)
                return next(new ApiError("Unauthorized", 401));

            User.findById(params._id).then(user => {
                if (!user)
                    return next(new ApiError("Unauthorized", 401))
                req.user = user;
                return next();
            })
        });
    } else
        return next(new ApiError("Forbidden", 403));
}