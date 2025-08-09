/**
 * Script de test pour le système de notifications
 * Utilisation: npx ts-node test-notifications.ts
 */

import { activityChecker } from './src/jobs/activity-checker';
import { AnonymousUser } from './schema/index';
import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connexion à la base de données
async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGO_URL as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASS,
      dbName: process.env.MONGO_DB_NAME
    } as ConnectOptions);
    console.log('✅ Connexion à la base de données réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
}

// Créer un utilisateur de test avec une activité ancienne
async function createTestUser() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 8); // 8 jours pour être sûr

    const testUser = new AnonymousUser({
      mobileId: 'test-device-123',
      firstName: 'Utilisateur Test',
      role: 'USER',
      lastActivity: oneWeekAgo,
      notificationToken: 'ExponentPushToken[test-token-123]' // Token de test
    });

    await testUser.save();
    console.log('✅ Utilisateur de test créé avec succès');
    console.log(`📱 mobileId: ${testUser.mobileId}`);
    console.log(`📅 lastActivity: ${testUser.lastActivity}`);

    return testUser;
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('⚠️ L\'utilisateur de test existe déjà');
      return await AnonymousUser.findOne({ mobileId: 'test-device-123' });
    }
    throw error;
  }
}

// Créer un utilisateur de test récemment notifié (pour tester l'anti-spam)
async function createRecentlyNotifiedUser() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Notifié il y a 3 jours

    const testUser = new AnonymousUser({
      mobileId: 'test-device-spam-check',
      firstName: 'Utilisateur Anti-Spam',
      role: 'USER',
      lastActivity: oneWeekAgo,
      notificationToken: 'ExponentPushToken[test-token-spam]',
      lastNotificationSent: threeDaysAgo // Notification récente
    });

    await testUser.save();
    console.log('✅ Utilisateur anti-spam créé avec succès');
    console.log(`📱 mobileId: ${testUser.mobileId}`);
    console.log(`📅 lastActivity: ${testUser.lastActivity}`);
    console.log(`🔔 lastNotificationSent: ${testUser.lastNotificationSent}`);

    return testUser;
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('⚠️ L\'utilisateur anti-spam existe déjà');
      return await AnonymousUser.findOne({ mobileId: 'test-device-spam-check' });
    }
    throw error;
  }
}

// Nettoyer les utilisateurs de test
async function cleanupTestUsers(): Promise<void> {
  try {
    await AnonymousUser.deleteMany({
      mobileId: { $in: ['test-device-123', 'test-device-spam-check'] }
    });
    console.log('🧹 Utilisateurs de test supprimés');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Afficher les statistiques
async function showStats(): Promise<void> {
  try {
    const stats = await activityChecker.getActivityStats();
    console.log('\n📊 Statistiques d\'activité:');
    console.log(`- Total utilisateurs: ${stats.totalUsers}`);
    console.log(`- Utilisateurs actifs: ${stats.activeUsers}`);
    console.log(`- Utilisateurs inactifs: ${stats.inactiveUsers}`);
    console.log(`- Utilisateurs avec token: ${stats.usersWithNotificationToken}`);
    console.log(`- Utilisateurs inactifs éligibles: ${stats.inactiveUsersEligibleForNotification}`);
    console.log(`- Utilisateurs notifiés récemment: ${stats.recentlyNotifiedUsers}`);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
  }
}

// Fonction principale de test
async function runTests(): Promise<void> {
  try {
    console.log('🚀 Début des tests du système de notifications\n');

    // 1. Connexion à la DB
    await connectDB();

    // 2. Afficher les statistiques initiales
    console.log('📊 Statistiques avant test:');
    await showStats();

    // 3. Créer les utilisateurs de test
    console.log('\n🧪 Création d\'un utilisateur de test éligible...');
    const testUser = await createTestUser();

    console.log('\n🚫 Création d\'un utilisateur récemment notifié (test anti-spam)...');
    const spamTestUser = await createRecentlyNotifiedUser();

    // 4. Afficher les nouvelles statistiques
    console.log('\n📊 Statistiques après création des tests:');
    await showStats();

    // 5. Tester la vérification manuelle
    console.log('\n🔍 Test de la vérification manuelle d\'activité...');
    console.log('  → L\'utilisateur éligible devrait recevoir une notification');
    console.log('  → L\'utilisateur récemment notifié ne devrait PAS recevoir de notification (anti-spam)');
    await activityChecker.runManualCheck();

    // 6. Attendre un peu pour voir les résultats
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Nettoyer
    console.log('\n🧹 Nettoyage...');
    await cleanupTestUsers();

    // 8. Statistiques finales
    console.log('\n📊 Statistiques finales:');
    await showStats();

    console.log('\n✅ Tests terminés avec succès!');
    console.log('\n📋 Règles de notification implémentées:');
    console.log('  ✓ Utilisateur inactif depuis plus de 7 jours');
    console.log('  ✓ Possède un token de notification');
    console.log('  ✓ N\'a pas été notifié dans les 5 derniers jours (anti-spam)');
    console.log('\n💡 Pour tester avec de vraies notifications:');
    console.log('1. Lancez l\'application mobile');
    console.log('2. Completez l\'onboarding pour obtenir un token');
    console.log('3. Attendez 1 semaine ou modifiez la lastActivity dans la DB');
    console.log('4. Le job s\'exécutera automatiquement tous les jours à 10h00');
    console.log('5. Une notification sera envoyée maximum tous les 5 jours');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔐 Connexion fermée');
    process.exit(0);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', async () => {
  console.log('\n⚠️ Arrêt demandé...');
  await cleanupTestUsers();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Arrêt demandé...');
  await cleanupTestUsers();
  await mongoose.connection.close();
  process.exit(0);
});

// Lancer les tests
runTests();
