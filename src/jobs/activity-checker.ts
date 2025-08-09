import * as cron from 'node-cron';
import { notificationService } from '../services/notification-service';
import { AnonymousUser } from '../../schema';

class ActivityChecker {
  private isRunning = false;

  /**
   * Démarre le job de vérification d'activité quotidien à 10h00
   */
  start(): void {
    console.log('🚀 Démarrage du job de vérification d\'activité...');

    // Tous les jours à 10h00
    cron.schedule('0 10 * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ Job de vérification d\'activité déjà en cours...');
        return;
      }

      this.isRunning = true;
      console.log('🔍 Démarrage de la vérification d\'activité des utilisateurs...');

      try {
        await this.checkAndNotifyInactiveUsers();
      } catch (error) {
        console.error('❌ Erreur lors de la vérification d\'activité:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Job de vérification d\'activité programmé (tous les jours à 10h00)');
  }

  /**
 * Vérifie et notifie les utilisateurs inactifs
 */
  private async checkAndNotifyInactiveUsers(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      console.log(`📊 Recherche d'utilisateurs inactifs depuis le ${oneWeekAgo.toLocaleDateString('fr-FR')}`);
      console.log(`🚫 Exclusion des utilisateurs notifiés depuis moins de 5 jours (après le ${fiveDaysAgo.toLocaleDateString('fr-FR')})`);

      // Trouver tous les utilisateurs inactifs depuis plus d'une semaine
      // ET qui n'ont pas été notifiés dans les 5 derniers jours (anti-spam)
      const inactiveUsers = await AnonymousUser.find({
        lastActivity: { $lt: oneWeekAgo },
        notificationToken: { $exists: true, $ne: null },
        $or: [
          { lastNotificationSent: { $exists: false } }, // Jamais notifié
          { lastNotificationSent: null }, // Jamais notifié
          { lastNotificationSent: { $lt: fiveDaysAgo } } // Notifié il y a plus de 5 jours
        ]
      });

      console.log(`📱 ${inactiveUsers.length} utilisateur(s) inactif(s) éligible(s) pour notification trouvé(s)`);

      if (inactiveUsers.length === 0) {
        console.log('✅ Aucun utilisateur inactif éligible à notifier');
        return;
      }

      // Envoyer les notifications en parallèle
      const notificationPromises = inactiveUsers.map(user => {
        const lastNotified = user.lastNotificationSent
          ? new Date(user.lastNotificationSent).toLocaleDateString('fr-FR')
          : 'Jamais';
        console.log(`📤 Envoi de notification à l'utilisateur ${user.mobileId} (dernière notification: ${lastNotified})`);
        return notificationService.sendActivityReminderNotification(user.mobileId);
      });

      await Promise.all(notificationPromises);

      console.log(`✅ ${inactiveUsers.length} notification(s) d'activité envoyée(s) avec succès`);

      // Marquer les utilisateurs comme notifiés pour éviter les doublons
      await this.markUsersAsNotified(inactiveUsers);

    } catch (error) {
      console.error('❌ Erreur lors de la vérification des utilisateurs inactifs:', error);
      throw error;
    }
  }

  /**
   * Marque les utilisateurs comme ayant été notifiés
   */
  private async markUsersAsNotified(users: any[]): Promise<void> {
    try {
      const userIds = users.map(user => user._id);

      // Ajouter un champ lastNotificationSent pour éviter de spammer
      await AnonymousUser.updateMany(
        { _id: { $in: userIds } },
        { lastNotificationSent: new Date() }
      );

      console.log(`📝 ${userIds.length} utilisateur(s) marqué(s) comme notifié(s)`);
    } catch (error) {
      console.error('❌ Erreur lors du marquage des utilisateurs:', error);
    }
  }

  /**
   * Exécute une vérification manuelle (pour les tests)
   */
  async runManualCheck(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Vérification déjà en cours...');
      return;
    }

    this.isRunning = true;
    console.log('🧪 Exécution manuelle de la vérification d\'activité...');

    try {
      await this.checkAndNotifyInactiveUsers();
    } catch (error) {
      console.error('❌ Erreur lors de la vérification manuelle:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
 * Obtient des statistiques sur l'activité des utilisateurs
 */
  async getActivityStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersWithNotificationToken: number;
    inactiveUsersEligibleForNotification: number;
    recentlyNotifiedUsers: number;
  }> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const [
        totalUsers,
        activeUsers,
        usersWithToken,
        inactiveUsersEligibleForNotification,
        recentlyNotifiedUsers
      ] = await Promise.all([
        AnonymousUser.countDocuments({}),
        AnonymousUser.countDocuments({ lastActivity: { $gte: oneWeekAgo } }),
        AnonymousUser.countDocuments({ notificationToken: { $exists: true, $ne: null } }),
        // Utilisateurs inactifs éligibles pour notification (respectant la règle des 5 jours)
        AnonymousUser.countDocuments({
          lastActivity: { $lt: oneWeekAgo },
          notificationToken: { $exists: true, $ne: null },
          $or: [
            { lastNotificationSent: { $exists: false } },
            { lastNotificationSent: null },
            { lastNotificationSent: { $lt: fiveDaysAgo } }
          ]
        }),
        // Utilisateurs notifiés récemment (dans les 5 derniers jours)
        AnonymousUser.countDocuments({
          lastNotificationSent: { $gte: fiveDaysAgo }
        })
      ]);

      const inactiveUsers = totalUsers - activeUsers;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersWithNotificationToken: usersWithToken,
        inactiveUsersEligibleForNotification,
        recentlyNotifiedUsers
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

export const activityChecker = new ActivityChecker();
