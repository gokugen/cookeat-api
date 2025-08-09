import { User, AnonymousUser } from "../../schema";
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

function getUsers(req: Request, res: Response, next: NextFunction) {
    User.find({}, "+role").then(users => res.status(200).send(users))
}

async function saveOnboardingAnswers(req: Request, res: Response, next: NextFunction) {
    try {
        const { answers, mobileId } = req.body;

        if (!mobileId) {
            return next(new ApiError("Mobile ID requis", 400));
        }

        if (!answers || Object.keys(answers).length === 0) {
            return next(new ApiError("Réponses d'onboarding requises", 400));
        }

        // Vérifier si un utilisateur anonyme existe déjà avec ce mobileId
        let anonymousUser = await AnonymousUser.findOne({ mobileId });

        if (!anonymousUser) {
            // Créer un nouvel utilisateur anonyme
            anonymousUser = new AnonymousUser({
                mobileId,
                firstName: "Utilisateur",
                role: "USER"
            });
        }

        // Mapper les réponses aux champs de l'utilisateur anonyme
        const questionMapping: Record<string, string> = {
            'question_0': 'sex',
            'question_1': 'age',
            'question_2': 'cookingLevel',
            'question_3': 'cookingFrequency',
            'question_4': 'cookingForWho',
            'question_5': 'cookingTime',
            'question_6': 'diet',
            'question_7': 'howDidHeKnowCookEatAI'
        };

        // Mettre à jour les champs avec les réponses
        for (const [questionKey, answer] of Object.entries(answers)) {
            const fieldName = questionMapping[questionKey];
            if (fieldName) {
                (anonymousUser as any)[fieldName] = answer;
            }
        }

        await anonymousUser.save();

        res.status(200).json({
            success: true,
            message: "Réponses d'onboarding sauvegardées avec succès",
            userId: anonymousUser._id
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde des réponses d\'onboarding:', error);
        return next(new ApiError("Erreur lors de la sauvegarde des réponses", 500));
    }
}

async function updateNotificationToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { mobileId, notificationToken } = req.body;

        if (!mobileId) {
            return next(new ApiError("Mobile ID requis", 400));
        }

        if (!notificationToken) {
            return next(new ApiError("Token de notification requis", 400));
        }

        // Trouver l'utilisateur anonyme
        let anonymousUser = await AnonymousUser.findOne({ mobileId });

        if (!anonymousUser) {
            // Créer un nouvel utilisateur anonyme avec le token
            anonymousUser = new AnonymousUser({
                mobileId,
                firstName: "Utilisateur",
                role: "USER",
                notificationToken
            });
        } else {
            // Mettre à jour le token existant
            anonymousUser.notificationToken = notificationToken;
        }

        await anonymousUser.save();

        res.status(200).json({
            success: true,
            message: "Token de notification mis à jour avec succès"
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du token de notification:', error);
        return next(new ApiError("Erreur lors de la mise à jour du token", 500));
    }
}

async function updateUserActivity(req: Request, res: Response, next: NextFunction) {
    try {
        const { mobileId } = req.body;

        if (!mobileId) {
            return next(new ApiError("Mobile ID requis", 400));
        }

        // Trouver et mettre à jour l'activité de l'utilisateur anonyme
        const anonymousUser = await AnonymousUser.findOne({ mobileId });

        if (!anonymousUser) {
            return next(new ApiError("Utilisateur anonyme non trouvé", 404));
        }

        anonymousUser.lastActivity = new Date();
        await anonymousUser.save();

        res.status(200).json({
            success: true,
            message: "Activité utilisateur mise à jour avec succès"
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'activité:', error);
        return next(new ApiError("Erreur lors de la mise à jour de l'activité", 500));
    }
}

export {
    whoAmI,
    updateCurrentUser,
    updateUser,
    getUsers,
    saveOnboardingAnswers,
    updateNotificationToken,
    updateUserActivity,
}
