# Guide de Déploiement

Guide complet pour déployer OpenLivestock Manager en production.

---

## Prérequis

- **Compte Cloudflare** (le niveau gratuit fonctionne)
- **Compte Neon** (le niveau gratuit fonctionne)
- **Compte GitHub** (pour CI/CD)
- **Node.js 22+** ou **Bun 1.0+**

---

## Démarrage Rapide (5 minutes)

```bash
# 1. Cloner et installer
git clone https://github.com/yourusername/openlivestock.git
cd openlivestock
bun install

# 2. Configurer la base de données
bun run db:migrate
bun run db:seed

# 3. Déployer
bun run deploy
```

---

## Étape 1 : Configuration de la Base de Données (Neon)

### Créer un Projet Neon

1. Allez sur [console.neon.tech](https://console.neon.tech)
2. Cliquez sur **New Project**
3. Choisissez la région la plus proche de vos utilisateurs
4. Copiez la chaîne de connexion

### Configurer la Base de Données

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Exécuter les Migrations

```bash
# Créer les tables
bun run db:migrate

# Seeder les données initiales (utilisateur admin + données de référence)
bun run db:seed

# Optionnel : Seeder les données de démonstration pour les tests
bun run db:seed:dev
```

### Vérifier la Base de Données

```bash
# Vérifier que les tables existent
bun run db:status

# Ou utiliser l'éditeur SQL Neon
# Exécuter : SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Étape 2 : Configuration Cloudflare Workers

### Installer Wrangler CLI

```bash
npm install -g wrangler
# ou
bun add -g wrangler
```

### Se Connecter à Cloudflare

```bash
wrangler login
```

### Configurer le Worker

Modifiez `wrangler.jsonc` :

```jsonc
{
    "name": "openlivestock-production",
    "main": "./.output/server/index.mjs",
    "compatibility_date": "2024-01-01",
    "compatibility_flags": ["nodejs_compat"],
    "vars": {
        "NODE_ENV": "production",
    },
}
```

### Définir les Secrets

```bash
# Connexion base de données
wrangler secret put DATABASE_URL
# Collez votre chaîne de connexion Neon

# Secret Better Auth (générer avec : openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Optionnel : Fournisseur SMS (Termii)
wrangler secret put TERMII_API_KEY

# Optionnel : Fournisseur Email (Resend)
wrangler secret put RESEND_API_KEY
```

---

## Étape 3 : Construire & Déployer

### Construire pour la Production

```bash
bun run build
```

Cela crée un bundle optimisé dans `.output/`.

### Déployer sur Cloudflare

```bash
bun run deploy
# ou
wrangler deploy
```

### Vérifier le Déploiement

```bash
# Vérifier le statut du déploiement
wrangler deployments list

# Voir les logs
wrangler tail
```

Votre application est maintenant en ligne à : `https://openlivestock-production.your-subdomain.workers.dev`

---

## Étape 4 : Domaine Personnalisé (Optionnel)

### Ajouter le Domaine à Cloudflare

1. Allez sur le tableau de bord Cloudflare → Workers & Pages
2. Sélectionnez votre worker
3. Cliquez sur **Triggers** → **Custom Domains**
4. Ajoutez votre domaine (ex: `app.votreferme.com`)

### Mettre à Jour les DNS

Cloudflare configure automatiquement les enregistrements DNS.

---

## Variables d'Environnement

### Requis

| Variable             | Description               | Exemple                   |
| -------------------- | ------------------------- | ------------------------- |
| `DATABASE_URL`       | Connexion PostgreSQL Neon | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Secret de session Auth    | `openssl rand -base64 32` |

### Optionnel

| Variable              | Description          | Défaut    |
| --------------------- | -------------------- | --------- |
| `SMS_PROVIDER`        | Service SMS          | `console` |
| `EMAIL_PROVIDER`      | Service Email        | `console` |
| `TERMII_API_KEY`      | Clé API Termii       | -         |
| `TERMII_SENDER_ID`    | ID expéditeur Termii | -         |
| `TWILIO_ACCOUNT_SID`  | SID compte Twilio    | -         |
| `TWILIO_AUTH_TOKEN`   | Jeton auth Twilio    | -         |
| `TWILIO_PHONE_NUMBER` | Téléphone Twilio     | -         |
| `RESEND_API_KEY`      | Clé API Resend       | -         |
| `SMTP_HOST`           | Serveur SMTP         | -         |
| `SMTP_PORT`           | Port SMTP            | `587`     |
| `SMTP_USER`           | Utilisateur SMTP     | -         |
| `SMTP_PASSWORD`       | Mot de passe SMTP    | -         |
| `SMTP_FROM`           | Email expéditeur     | -         |

---

## CI/CD avec GitHub Actions

### Créer le Workflow

`.github/workflows/deploy.yml` :

```yaml
name: Deploy to Cloudflare

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - uses: oven-sh/setup-bun@v1
              with:
                  bun-version: latest

            - name: Install dependencies
              run: bun install

            - name: Run tests
              run: bun run test

            - name: Build
              run: bun run build

            - name: Deploy to Cloudflare
              uses: cloudflare/wrangler-action@v3
              with:
                  apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Ajouter les Secrets à GitHub

1. Allez sur le dépôt GitHub → Settings → Secrets
2. Ajoutez `CLOUDFLARE_API_TOKEN`
3. Ajoutez `DATABASE_URL`
4. Ajoutez `BETTER_AUTH_SECRET`

---

## Surveillance & Débogage

### Voir les Logs

```bash
# Logs en temps réel
wrangler tail

# Filtrer par statut
wrangler tail --status error

# Filtrer par méthode
wrangler tail --method POST
```

### Surveillance des Performances

Tableau de bord Cloudflare → Workers & Pages → Analytics :

- Nombre de requêtes
- Taux d'erreur
- Temps CPU
- Temps de réponse

### Surveillance de la Base de Données

Tableau de bord Neon → Monitoring :

- Nombre de connexions
- Performance des requêtes
- Utilisation du stockage

---

## Mise à l'Échelle

### Cloudflare Workers

- **Niveau gratuit** : 100 000 requêtes/jour
- **Niveau payant** : Requêtes illimitées (5$/mois + 0,50$/million de requêtes)
- **Mise à l'échelle automatique** : Gère automatiquement les pics de trafic

### Base de Données Neon

- **Niveau gratuit** : 0,5 Go de stockage, 1 unité de calcul
- **Niveau payant** : Échelle de calcul et de stockage indépendante
- **Pooling de connexions** : Intégré, aucune configuration nécessaire

---

## Sauvegarde & Récupération

### Sauvegardes de Base de Données

Neon fournit des sauvegardes automatiques :

- **Récupération à un instant donné** : Restaurez à n'importe quel moment des 7 derniers jours (niveau gratuit)
- **Sauvegardes manuelles** : Créez une branche pour une sauvegarde à long terme

```bash
# Créer une branche de sauvegarde
neon branches create --name backup-2026-01-15
```

### Exporter les Données

```bash
# Exporter toutes les données
pg_dump $DATABASE_URL > backup.sql

# Restaurer
psql $DATABASE_URL < backup.sql
```

---

## Liste de Contrôle de Sécurité

- [ ] Utiliser un `BETTER_AUTH_SECRET` fort (32+ caractères)
- [ ] Activer Cloudflare WAF (Web Application Firewall)
- [ ] Configurer la limitation de débit dans Cloudflare
- [ ] Utiliser des variables d'environnement pour tous les secrets
- [ ] Activer HTTPS uniquement (défaut Cloudflare)
- [ ] Revoir la liste d'autorisation IP Neon (si nécessaire)
- [ ] Activer la journalisation d'audit
- [ ] Configurer les alertes de surveillance

---

## Dépannage

### Erreurs de Construction

**Erreur** : `Cannot find module '../db'`

**Solution** : Assurez-vous des imports dynamiques dans les fonctions serveur :

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb() // ✅
```

### Erreurs de Connexion à la Base de Données

**Erreur** : `Connection timeout`

**Solution** : Vérifiez que le projet Neon est actif (non suspendu) :

```bash
# Réveiller la base de données
curl $DATABASE_URL
```

### Erreurs Worker

**Erreur** : `Script startup exceeded CPU limit`

**Solution** : Réduisez la taille du bundle :

```bash
# Analyser le bundle
bun run build --analyze

# Vérifier les grosses dépendances
du -sh node_modules/*
```

### Erreurs de Migration

**Erreur** : `relation "table" already exists`

**Solution** : Vérifiez le statut de la migration :

```bash
bun run db:status

# Si nécessaire, effectuez un rollback et relancez
bun run db:rollback
bun run db:migrate
```

---

## Optimisation des Performances

### Cloudflare

- Activer la mise en cache des assets statiques
- Utiliser le CDN Cloudflare pour les images
- Activer la compression Brotli
- Configurer des règles de cache personnalisées

### Base de Données

- Ajouter des index pour les requêtes courantes (déjà inclus)
- Utiliser le pooling de connexions (défaut Neon)
- Surveiller les requêtes lentes dans le tableau de bord Neon
- Envisager des répliques en lecture pour un trafic élevé

### Application

- Activer la mise en cache PWA
- Optimiser les images (format WebP)
- Lazy loading des composants
- Utiliser React.memo pour les composants coûteux

---

## Estimation des Coûts

### Niveau Gratuit (Convient aux petites fermes)

- **Cloudflare Workers** : 100 000 requêtes/jour
- **Base de Données Neon** : 0,5 Go de stockage, 1 unité de calcul
- **Total** : 0$/mois

### Niveau Payant (Convient aux fermes moyennes)

- **Cloudflare Workers** : 5$/mois + utilisation
- **Base de Données Neon** : 19$/mois (2 unités de calcul, 10 Go)
- **Total** : ~25$/mois

### Entreprise (Grandes fermes, plusieurs sites)

- **Cloudflare Workers** : Tarification personnalisée
- **Base de Données Neon** : Tarification personnalisée
- **Total** : Contacter les ventes

---

## Prochaines Étapes

1. **Configurer la surveillance** : Configurez des alertes pour les erreurs
2. **Activer les sauvegardes** : Planifiez des sauvegardes régulières de la base de données
3. **Domaine personnalisé** : Ajoutez le domaine de votre ferme
4. **SMS/Email** : Configurez les fournisseurs de production
5. **Intégration** : Créez la première ferme et invitez des utilisateurs

---

## Support

- **Documentation** : [docs/INDEX.md](./INDEX.md)
- **Problèmes GitHub** : [github.com/yourusername/openlivestock/issues](https://github.com/yourusername/openlivestock/issues)
- **Communauté** : [Lien Discord/Slack]

---

**Dernière Mise à Jour** : 15 Janvier 2026
