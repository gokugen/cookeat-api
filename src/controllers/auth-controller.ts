import { User } from "../../schema";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import ApiError from "../helpers/api-error";
import { Response, NextFunction } from "express";
import { getPasswordError } from "../helpers/functions";
import { Request } from "../../types";

function checkAdmin(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (user?.role !== "ADMIN")
        return next(new ApiError("Forbidden", 403));
    return next();
}

function signUp(req: Request, res: Response, next: NextFunction) {
    if (!req.body.password)
        return next(new ApiError("Password missing", 400));

    const passwordError = getPasswordError(req.body.password);
    if (passwordError)
        return next(new ApiError(passwordError, 400));

    return new User({
        ...req.body,
        password: bcrypt.hashSync(req.body.password, 10)
    })
        .save()
        .then((savedUser) => res.status(201).send({ token: jwt.sign({ _id: savedUser._id }, process.env.ACCESSTOKENSECRET as Secret) }))
        .catch(next);
}

function signIn(req: Request, res: Response, next: NextFunction) {
    if (!req.body.email || !req.body.password)
        return next(new ApiError("Parameters missing", 400));

    User.findOne({ email: req.body.email.toLowerCase() }, "+password").then(user => {
        if (!user)
            return next(new ApiError("Identifiant ou mot de passe incorrect", 401));
        // else if (user.temporaryToken)
        //     return next(new ApiError("Veuillez créer un mot de passe grâce à l'email qui vous a été envoyé", 401));

        if (!bcrypt.compareSync(req.body.password, user.password))
            return next(new ApiError("Identifiant ou mot de passe incorrect", 401));

        // Generate an access token
        return res.status(200).send({ token: jwt.sign({ _id: user._id }, process.env.ACCESSTOKENSECRET as Secret) });
    }).catch(next);
}

export { checkAdmin, signUp, signIn }
