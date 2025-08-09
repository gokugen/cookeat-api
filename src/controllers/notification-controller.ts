import { NextFunction, Response } from "express";
import { Request } from "../../types";
import { notificationService } from "../services/notification-service";
import { activityChecker } from "../jobs/activity-checker";
import ApiError from "../helpers/api-error";

/**
 * Envoie une notification de test
 */
async function sendTestNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { mobileId, title, body } = req.body;

    if (!mobileId) {
      return next(new ApiError("Mobile ID requis", 400));
    }

    const notificationTitle = title || "🧪 Notification de test";
    const notificationBody = body || "Ceci est une notification de test de CookEat.";

    await notificationService.sendCustomNotification(
      mobileId,
      notificationTitle,
      notificationBody,
      'test'
    );

    res.status(200).json({
      success: true,
      message: "Notification de test envoyée avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de test:', error);
    return next(new ApiError("Erreur lors de l'envoi de la notification", 500));
  }
}

/**
 * Envoie des rappels d'activité à tous les utilisateurs inactifs
 */
async function sendActivityReminders(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.notifyInactiveUsers();

    res.status(200).json({
      success: true,
      message: "Rappels d'activité envoyés avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi des rappels d\'activité:', error);
    return next(new ApiError("Erreur lors de l'envoi des rappels", 500));
  }
}

/**
 * Envoie une notification de bienvenue
 */
async function sendWelcomeNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { mobileId } = req.body;

    if (!mobileId) {
      return next(new ApiError("Mobile ID requis", 400));
    }

    await notificationService.sendWelcomeNotification(mobileId);

    res.status(200).json({
      success: true,
      message: "Notification de bienvenue envoyée avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de bienvenue:', error);
    return next(new ApiError("Erreur lors de l'envoi de la notification", 500));
  }
}

/**
 * Envoie une notification personnalisée
 */
async function sendCustomNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { mobileId, title, body, type } = req.body;

    if (!mobileId) {
      return next(new ApiError("Mobile ID requis", 400));
    }

    if (!title || !body) {
      return next(new ApiError("Titre et contenu de la notification requis", 400));
    }

    await notificationService.sendCustomNotification(
      mobileId,
      title,
      body,
      type || 'custom'
    );

    res.status(200).json({
      success: true,
      message: "Notification personnalisée envoyée avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification personnalisée:', error);
    return next(new ApiError("Erreur lors de l'envoi de la notification", 500));
  }
}

/**
 * Déclenche manuellement une vérification d'activité
 */
async function triggerActivityCheck(req: Request, res: Response, next: NextFunction) {
  try {
    await activityChecker.runManualCheck();

    res.status(200).json({
      success: true,
      message: "Vérification d'activité déclenchée avec succès"
    });

  } catch (error) {
    console.error('Erreur lors du déclenchement de la vérification d\'activité:', error);
    return next(new ApiError("Erreur lors de la vérification d'activité", 500));
  }
}

/**
 * Obtient les statistiques d'activité des utilisateurs
 */
async function getActivityStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await activityChecker.getActivityStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return next(new ApiError("Erreur lors de la récupération des statistiques", 500));
  }
}

export {
  sendTestNotification,
  sendActivityReminders,
  sendWelcomeNotification,
  sendCustomNotification,
  triggerActivityCheck,
  getActivityStats
};
