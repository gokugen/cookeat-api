import { User } from "../../schema";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import ApiError from "../helpers/api-error";
import { Response, NextFunction } from "express";
import { getPasswordError, generateTemporaryTokenBeforeHash, generateRefreshToken } from "../helpers/functions";
import axios from "axios";
import { Request } from "../../types";
import { sendPasswordResetEmail, sendEmailWithLanguage } from "../services/email-service";

function checkAdmin(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (user?.role !== "ADMIN")
        return next(new ApiError("Forbidden", 403));
    return next();
}

async function signUp(req: Request, res: Response, next: NextFunction) {
    if (!req.body.password)
        return next(new ApiError("Password missing", 400));

    return new User({
        ...req.body,
        password: bcrypt.hashSync(req.body.password, 10)
    })
        .save()
        .then(async (savedUser) => {
            const refreshToken = generateRefreshToken();
            savedUser.refreshToken = refreshToken;
            await savedUser.save();

            // Envoyer un email de bienvenue
            try {
                await sendEmailWithLanguage(
                    savedUser.email,
                    'welcome',
                    'welcome',
                    req.user.language || 'fr'
                );
            } catch (error) {
                console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
                // On continue même si l'email échoue
            }

            res.status(201).send({
                token: jwt.sign({ _id: savedUser._id }, process.env.ACCESSTOKENSECRET as Secret, { expiresIn: '15m' }),
                refreshToken: refreshToken
            });
        })
        .catch(next);
}

function signIn(req: Request, res: Response, next: NextFunction) {
    if (!req.body.email || !req.body.password)
        return next(new ApiError("Parameters missing", 400));

    User.findOne({ email: req.body.email.toLowerCase() }, "+password").then(user => {
        if (!user)
            return next(new ApiError("Invalid credentials", 401));
        // else if (user.temporaryToken)
        //     return next(new ApiError("Veuillez créer un mot de passe grâce à l'email qui vous a été envoyé", 401));

        if (!bcrypt.compareSync(req.body.password, user.password))
            return next(new ApiError("Invalid credentials", 401));

        // Generate refresh token and update user
        const refreshToken = generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save();

        // Generate an access token
        return res.status(200).send({
            token: jwt.sign({ _id: user._id }, process.env.ACCESSTOKENSECRET as Secret, { expiresIn: '15m' }),
            refreshToken: refreshToken
        });
    }).catch(next);
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    if (!req.body.email)
        return next(new ApiError("Email missing", 400));

    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });

        if (!user)
            return res.status(200).send();

        // Générer un token temporaire
        const temporaryToken = generateTemporaryTokenBeforeHash();
        user.temporaryToken = temporaryToken;
        await user.save();

        // Envoyer l'email de réinitialisation
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${temporaryToken}&id=${user._id}`;

        try {
            await sendPasswordResetEmail(user.email, resetUrl, req.user.language || 'fr');
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            // On continue même si l'email échoue pour ne pas révéler si l'email existe
        }

        res.status(200).send();
    } catch (error) {
        next(error);
    }
}

function resetPassword(req: Request, res: Response, next: NextFunction) {
    if (!req.body.token || !req.body.id || !req.body.password)
        return next(new ApiError("Parameters missing", 400));

    const passwordError = getPasswordError(req.body.password, req.user.language || 'fr');
    if (passwordError)
        return next(new ApiError(passwordError, 400));

    User.findById(req.body.id).then(user => {
        if (!user)
            return next(new ApiError("Invalid reset link", 400));

        if (!user.temporaryToken || user.temporaryToken !== req.body.token)
            return next(new ApiError("Invalid or expired reset link", 400));

        // Mettre à jour le mot de passe et supprimer le token temporaire
        user.password = bcrypt.hashSync(req.body.password, 10);
        user.temporaryToken = undefined;
        user.save();

        res.status(200).send();
    }).catch(next);
}

function refreshToken(req: Request, res: Response, next: NextFunction) {
    if (!req.body.refreshToken)
        return next(new ApiError("Parameters missing", 400));

    User.findOne({ refreshToken: req.body.refreshToken }).then(user => {
        if (!user)
            return next(new ApiError("Invalid refresh token", 401));

        // Generate new refresh token and update user
        const newRefreshToken = generateRefreshToken();
        user.refreshToken = newRefreshToken;
        user.save();

        // Generate new access token
        return res.status(200).send({
            token: jwt.sign({ _id: user._id }, process.env.ACCESSTOKENSECRET as Secret, { expiresIn: '15m' }),
            refreshToken: newRefreshToken
        });
    }).catch(next);
}

function logout(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;

    if (user) {
        // Invalider le refresh token en le supprimant
        user.refreshToken = undefined;
        user.save();
    }

    res.status(200).send();
}

async function googleAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.body.code)
        return next(new ApiError("Parameters missing", 400));

    try {
        // Échanger le code d'autorisation contre un token d'accès Google
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code: req.body.code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;

        // Récupérer les informations de l'utilisateur Google
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const { email, name, picture } = userInfoResponse.data;

        // Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Créer un nouvel utilisateur
            user = new User({
                email: email.toLowerCase(),
                password: '', // Pas de mot de passe pour les utilisateurs Google
                useExternalConnexion: true
            });
            await user.save();
        }

        // Générer refresh token et mettre à jour l'utilisateur
        const refreshToken = generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save();

        // Générer un token d'accès
        const token = jwt.sign({ _id: user._id }, process.env.ACCESSTOKENSECRET as Secret, { expiresIn: '15m' });

        res.status(200).send({
            token,
            refreshToken,
        });

    } catch (error) {
        console.error('Erreur Google Auth:', error);
        return next(new ApiError("Invalid credentials", 401));
    }
}

export {
    signUp,
    signIn,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout,
    googleAuth,
    checkAdmin
};
