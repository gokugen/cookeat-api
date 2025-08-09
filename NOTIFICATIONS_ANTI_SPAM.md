# 🚫 Système Anti-Spam pour les Notifications

## Vue d'ensemble

Le système de notifications CookEat implémente une logique anti-spam pour éviter de spammer les utilisateurs inactifs avec trop de notifications de rappel.

## Règles de Notification

Pour qu'un utilisateur anonyme reçoive une notification de rappel d'activité, il doit respecter **TOUTES** ces conditions :

### ✅ Conditions Obligatoires

1. **Inactivité** : `lastActivity` > 7 jours
2. **Token valide** : Possède un `notificationToken` valide
3. **Anti-spam** : `lastNotificationSent` > 5 jours OU jamais notifié

### 📊 Logique MongoDB

```javascript
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

const eligibleUsers = await AnonymousUser.find({
  // Condition 1: Inactif depuis plus d'une semaine
  lastActivity: { $lt: oneWeekAgo },
  
  // Condition 2: Possède un token de notification
  notificationToken: { $exists: true, $ne: null },
  
  // Condition 3: Anti-spam (5 jours minimum entre notifications)
  $or: [
    { lastNotificationSent: { $exists: false } }, // Jamais notifié
    { lastNotificationSent: null },               // Jamais notifié
    { lastNotificationSent: { $lt: fiveDaysAgo } } // Notifié il y a plus de 5 jours
  ]
});
```

## Scénarios d'Usage

### ✅ Utilisateur Éligible

```javascript
{
  mobileId: "device-123",
  lastActivity: "2024-01-01", // Il y a 8 jours
  notificationToken: "ExponentPushToken[...]",
  lastNotificationSent: null // Jamais notifié
}
// → ✅ Recevra une notification
```

### ✅ Utilisateur Éligible (Re-notification)

```javascript
{
  mobileId: "device-456",
  lastActivity: "2024-01-01", // Il y a 8 jours
  notificationToken: "ExponentPushToken[...]",
  lastNotificationSent: "2024-01-03" // Il y a 6 jours
}
// → ✅ Recevra une notification (6 > 5 jours)
```

### ❌ Utilisateur Non-Éligible (Récemment Notifié)

```javascript
{
  mobileId: "device-789",
  lastActivity: "2024-01-01", // Il y a 8 jours
  notificationToken: "ExponentPushToken[...]",
  lastNotificationSent: "2024-01-06" // Il y a 3 jours
}
// → ❌ Ne recevra PAS de notification (3 < 5 jours)
```

### ❌ Utilisateur Non-Éligible (Pas de Token)

```javascript
{
  mobileId: "device-999",
  lastActivity: "2024-01-01", // Il y a 8 jours
  notificationToken: null, // Pas de token
  lastNotificationSent: null
}
// → ❌ Ne recevra PAS de notification (pas de token)
```

## Planification Automatique

- **Fréquence** : Tous les jours à 10h00
- **Job** : `activityChecker.start()` dans `index.ts`
- **Cron** : `'0 10 * * *'` (node-cron)

## Statistiques Disponibles

L'endpoint `GET /api/notification/stats` retourne :

```javascript
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "inactiveUsers": 30,
    "usersWithNotificationToken": 100,
    "inactiveUsersEligibleForNotification": 5, // Respectent l'anti-spam
    "recentlyNotifiedUsers": 15 // Notifiés dans les 5 derniers jours
  }
}
```

## Tests

Utilisez le script de test pour valider la logique :

```bash
cd /Users/hadjadji/work/perso/cookeat/api
npx ts-node test-notifications.ts
```

Le test crée :
1. Un utilisateur éligible (inactif, jamais notifié)
2. Un utilisateur avec notification récente (test anti-spam)

Seul le premier devrait recevoir une notification.

## Endpoints API

### Déclencher Manuellement (Admin)
```http
POST /api/notification/activity-reminders
Authorization: Bearer <admin-token>
```

### Voir les Statistiques (Admin)
```http
GET /api/notification/stats
Authorization: Bearer <admin-token>
```

### Test de Notification
```http
POST /api/notification/test
{
  "mobileId": "device-123",
  "title": "Test",
  "body": "Message de test"
}
```

## Sécurité

- Les endpoints admin nécessitent une authentification
- Les tokens de notification sont stockés de manière sécurisée
- La validation anti-spam est appliquée automatiquement
- Logs détaillés pour le monitoring
