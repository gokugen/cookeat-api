import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { AnonymousUser } from '../../schema';

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  /**
   * Envoie une notification push à un utilisateur spécifique
   */
  async sendPushNotification(
    notificationToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Vérifier que le token est valide
      if (!Expo.isExpoPushToken(notificationToken)) {
        console.error(`❌ Token de notification invalide: ${notificationToken}`);
        return;
      }

      const message: ExpoPushMessage = {
        to: notificationToken,
        sound: 'default',
        title,
        body,
        data: data || {},
      };

      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('❌ Erreur lors de l\'envoi de la notification:', error);
        }
      }

      console.log('✅ Notification envoyée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification push:', error);
    }
  }

  /**
   * Envoie une notification de rappel d'activité
   */
  async sendActivityReminderNotification(mobileId: string): Promise<void> {
    try {
      const user = await AnonymousUser.findOne({ mobileId });

      if (!user || !user.notificationToken) {
        console.log(`⚠️ Utilisateur non trouvé ou sans token de notification: ${mobileId}`);
        return;
      }

      const title = "🍳 Temps de cuisiner !";
      const body = "Cela fait une semaine que vous n'avez pas utilisé CookEat. Découvrez de nouvelles recettes !";
      const data = {
        type: 'activity_reminder',
        mobileId
      };

      await this.sendPushNotification(user.notificationToken, title, body, data);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du rappel d\'activité:', error);
    }
  }

  /**
 * Trouve et notifie tous les utilisateurs inactifs depuis plus d'une semaine
 * (respecte la règle anti-spam de 5 jours)
 */
  async notifyInactiveUsers(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      console.log(`🔍 Recherche d'utilisateurs inactifs depuis le ${oneWeekAgo.toISOString()}`);
      console.log(`🚫 Exclusion des utilisateurs notifiés depuis le ${fiveDaysAgo.toISOString()} (anti-spam)`);

      const inactiveUsers = await AnonymousUser.find({
        lastActivity: { $lt: oneWeekAgo },
        notificationToken: { $exists: true, $ne: null },
        $or: [
          { lastNotificationSent: { $exists: false } },
          { lastNotificationSent: null },
          { lastNotificationSent: { $lt: fiveDaysAgo } }
        ]
      });

      console.log(`📱 ${inactiveUsers.length} utilisateur(s) inactif(s) éligible(s) trouvé(s)`);

      if (inactiveUsers.length === 0) {
        console.log('✅ Aucun utilisateur éligible pour notification (respecte l\'anti-spam)');
        return;
      }

      const notifications = inactiveUsers.map(user => {
        const lastNotified = user.lastNotificationSent
          ? new Date(user.lastNotificationSent).toLocaleDateString('fr-FR')
          : 'Jamais';
        console.log(`📤 Notification envoyée à ${user.mobileId} (dernière: ${lastNotified})`);
        return this.sendActivityReminderNotification(user.mobileId);
      });

      await Promise.all(notifications);

      console.log(`✅ Notifications d'activité envoyées à ${inactiveUsers.length} utilisateur(s) (anti-spam respecté)`);
    } catch (error) {
      console.error('❌ Erreur lors de la notification des utilisateurs inactifs:', error);
    }
  }

  /**
   * Envoie une notification de bienvenue
   */
  async sendWelcomeNotification(mobileId: string): Promise<void> {
    try {
      const user = await AnonymousUser.findOne({ mobileId });

      if (!user || !user.notificationToken) {
        console.log(`⚠️ Utilisateur non trouvé ou sans token de notification: ${mobileId}`);
        return;
      }

      const title = "🎉 Bienvenue sur CookEat !";
      const body = "Découvrez des recettes personnalisées selon vos ingrédients disponibles.";
      const data = {
        type: 'welcome',
        mobileId
      };

      await this.sendPushNotification(user.notificationToken, title, body, data);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification de bienvenue:', error);
    }
  }

  /**
   * Envoie une notification personnalisée
   */
  async sendCustomNotification(
    mobileId: string,
    title: string,
    body: string,
    type: string = 'custom'
  ): Promise<void> {
    try {
      const user = await AnonymousUser.findOne({ mobileId });

      if (!user || !user.notificationToken) {
        console.log(`⚠️ Utilisateur non trouvé ou sans token de notification: ${mobileId}`);
        return;
      }

      const data = {
        type,
        mobileId
      };

      await this.sendPushNotification(user.notificationToken, title, body, data);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification personnalisée:', error);
    }
  }
}

export const notificationService = new NotificationService();
