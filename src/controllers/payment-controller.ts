import { User } from "../../schema";
import ApiError from "../helpers/api-error";
import { NextFunction, Response } from "express";
import { Request } from "../../types";
import bcrypt from "bcryptjs";
import generatePassword from "generate-password";
import jwt from "jsonwebtoken";

// Fonction pour créer un utilisateur guest
async function createUserFromGuest(email: string, firstName: string) {
    try {
        console.log('🔐 Création utilisateur guest pour:', email);

        // Générer un mot de passe temporaire
        const tempPassword = generatePassword.generate({
            length: 12,
            numbers: true,
            symbols: true,
            uppercase: true,
            lowercase: true,
        });

        console.log('🔑 Mot de passe généré:', tempPassword);

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Créer l'utilisateur
        const user = new User({
            email: email,
            firstName: firstName,
            password: hashedPassword,
            subscriptionStatus: 'active',
        });

        console.log('👤 Utilisateur créé, sauvegarde...');
        await user.save();
        console.log('✅ Utilisateur sauvegardé avec succès');

        // Vérifier que JWT_SECRET est défini
        if (!process.env.ACCESSTOKENSECRET) {
            throw new Error('ACCESSTOKENSECRET environment variable is not defined');
        }

        // Générer le token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.ACCESSTOKENSECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Token JWT généré pour:', email);

        return { token, user, tempPassword };
    } catch (error) {
        console.error('Erreur lors de la création du compte:', error);
        throw error;
    }
}

// Endpoint pour créer un utilisateur guest avant le paiement
async function createGuestUser(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, firstName } = req.body;

        if (!email) {
            return next(new ApiError("Email required", 400));
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ApiError("User already exists", 400));
        }

        // Créer l'utilisateur avec createUserFromGuest
        const { token, user, tempPassword } = await createUserFromGuest(
            email,
            firstName || email.split('@')[0]
        );

        res.status(200).json({
            user,
            token,
            tempPassword
        });
    } catch (error) {
        next(error);
    }
}

// Endpoint pour confirmer un paiement (appelé après paiement natif réussi)
async function confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
        const { planId, amount } = req.body;

        if (!req.user) {
            return next(new ApiError("User not authenticated", 401));
        }

        // Mettre à jour l'abonnement de l'utilisateur
        req.user.subscriptionStatus = 'active';
        // Tu peux ajouter d'autres champs selon tes besoins
        // req.user.plan = planId;
        // req.user.subscriptionAmount = amount;

        await req.user.save();

        res.status(200).json({
            message: 'Payment confirmed successfully',
            user: req.user
        });
    } catch (error) {
        next(error);
    }
}

export {
    createGuestUser,
    confirmPayment,
}
