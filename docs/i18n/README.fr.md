# OpenLivestock Manager

<p align="center">
  <img src="../../public/logo-icon.png" alt="Logo OpenLivestock" width="120" />
</p>

<p align="center">
  <strong>Gestion de bétail open-source et hors ligne, prenant en charge 6 types d'élevage.</strong>
</p>

<p align="center">
  <a href="#fonctionnalités">Fonctionnalités</a> •
  <a href="#démarrage-rapide">Démarrage Rapide</a> •
  <a href="#déploiement">Déploiement</a> •
  <a href="#pour-les-agents-ia">Pour les Agents IA</a> •
  <a href="#contribuer">Contribuer</a>
</p>

<p align="center">
  🌍 <strong>Langues :</strong>
  <a href="../../README.md">English</a> •
  <a href="README.pt.md">Português</a> •
  <a href="README.sw.md">Kiswahili</a> •
  <a href="README.es.md">Español</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.hi.md">हिन्दी</a>
</p>

---

## Fonctionnalités

### 🐔 Gestion Multi-Espèces

- **Support modulaire des espèces** — Volaille (poulets de chair, pondeuses, dindes, canards), Aquaculture (poisson-chat, tilapia), avec une architecture extensible pour les Bovins, Caprins, Ovins et Abeilles.
- **Suivi du cycle de vie des lots** — De l'acquisition à la vente avec gestion des statuts (actif, épuisé, vendu).
- **Métriques spécifiques aux espèces** — Types d'aliments, normes de croissance et types de structures par espèce.
- **Support multi-fermes** — Gérez plusieurs fermes depuis un seul compte avec filtrage par ferme.

### 📊 Analyse Prédictive & Surveillance de la Santé

- **Prévisions de croissance** — Prévoyez les dates de récolte et les poids cibles en utilisant des courbes de croissance spécifiques.
- **Projections de revenus** — Estimez les bénéfices basés sur les échantillons de poids actuels et les prix du marché.
- **Échantillonnage de poids** — Suivez les poids moyens, min et max avec la taille des échantillons.
- **Alertes de mortalité** — Avertissements automatiques lorsque les lots dépassent les seuils de mortalité normaux.
- **Suivi de la mortalité** — Enregistrez les décès par cause (maladie, prédateur, météo, inconnu) avec analyse des taux.
- **Calendriers de vaccination** — Suivez les vaccinations avec rappels des dates d'échéance.
- **Qualité de l'eau** (Aquaculture) — Surveillez le pH, la température, l'oxygène dissous, les niveaux d'ammoniac.

### 💰 Gestion Financière

- **Suivi des ventes** — Enregistrez les ventes par quantité, poids ou unité avec lien client.
- **Gestion des dépenses** — Dépenses catégorisées (alimentation, médicaments, équipement, main-d'œuvre, services publics, etc.).
- **Facturation** — Générez des factures clients avec lignes détaillées et suivi du statut de paiement.
- **Rapports Profits/Pertes** — Analyse P&L par période avec ventilation des revenus et dépenses.
- **Plus de 20 préréglages de devises** — Support international (USD, EUR, GBP, NGN, KES, ZAR, INR, etc.).

### 📦 Inventaire & Alimentation

- **Inventaire d'aliments** — Suivez les niveaux de stock avec alertes de seuil bas.
- **Inventaire de médicaments** — Surveillez les quantités avec suivi des dates d'expiration.
- **Consommation d'aliments** — Enregistrez l'alimentation quotidienne par lot avec suivi des coûts.
- **Analyse de conversion alimentaire** — Calculez les ratios d'efficacité (FCR).

### 👥 CRM & Contacts

- **Gestion des clients** — Suivez les acheteurs avec informations de contact et historique des achats.
- **Gestion des fournisseurs** — Gérez les couvoirs, usines d'aliments, pharmacies, fournisseurs d'équipement.
- **Types de clients** — Classification : Particulier, restaurant, détaillant, grossiste.

### 📱 Progressive Web App (PWA)

- **Offline-first** — Fonctionnalité complète sans internet ; synchronisation lors de la reconnexion.
- **Installable** — Ajoutez à l'écran d'accueil sur mobile et bureau.
- **Mises à jour automatiques** — Le service worker gère les mises à jour de l'application de manière transparente.

### 🌍 Internationalisation

- **Devise configurable** — Symbole, décimales, position, séparateurs.
- **Formats de date** — MM/JJ/AAAA, JJ/MM/AAAA, AAAA-MM-JJ.
- **Unités** — Poids (kg/lbs), surface (m²/pi²), température (°C/°F).
- **Formats d'heure** — Horloge 12 heures ou 24 heures.

### 📋 Rapports & Audit

- **5 types de rapports** — Profits/Pertes, Inventaire, Ventes, Alimentation, Œufs.
- **Filtrage par plage de dates** — Analyse de période personnalisée.
- **Capacité d'exportation** — Téléchargez les rapports pour une utilisation externe.
- **Journaux d'audit** — Historique complet des activités avec suivi utilisateur, action, entité.

### 🔐 Sécurité & Auth

- **Better Auth** — Authentification sécurisée basée sur les sessions.
- **Accès basé sur les rôles** — Rôles administrateur et personnel.
- **Routes protégées** — Toutes les données de la ferme derrière l'authentification.

---

## Captures d'écran

<!-- TODO: Add screenshots -->

| Tableau de Bord                                                   | Gestion des Lots                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| ![Tableau de Bord](../../screenshots/dashboard.png)               | ![Lots](../../screenshots/batches.png)                    |
| _Vue d'ensemble de la ferme avec KPI, alertes et actions rapides_ | _Liste des lots avec statut, espèce et taux de mortalité_ |

| Détail du Lot                                                | Rapports Financiers                                    |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| ![Détail du Lot](../../screenshots/batch-detail.png)         | ![Rapports](../../screenshots/reports.png)             |
| _Graphique de croissance, projections et chronologie du lot_ | _Analyse Profits/Pertes avec ventilation des dépenses_ |

| Vue Mobile                                       | Mode Hors Ligne                              |
| ------------------------------------------------ | -------------------------------------------- |
| ![Mobile](../../screenshots/mobile.png)          | ![Hors Ligne](../../screenshots/offline.png) |
| _Design réactif pour utilisation sur le terrain_ | _Fonctionne sans connexion internet_         |

| Paramètres                                    | Factures                                      |
| --------------------------------------------- | --------------------------------------------- |
| ![Paramètres](../../screenshots/settings.png) | ![Factures](../../screenshots/invoices.png)   |
| _Préférences de devise, date et unités_       | _Facturation client avec suivi des paiements_ |

## Stack Technique

| Couche          | Technologie                                                          |
| --------------- | -------------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19, SSR)         |
| Base de données | PostgreSQL via [Neon](https://neon.tech) (serverless)                |
| ORM             | [Kysely](https://kysely.dev) (SQL typé)                              |
| Style           | [Tailwind CSS v4](https://tailwindcss.com)                           |
| État            | [TanStack Query](https://tanstack.com/query) + Persistance IndexedDB |
| Déploiement     | [Cloudflare Workers](https://workers.cloudflare.com)                 |

---

## Démarrage Rapide

### Prérequis

- **Node.js 22+** (ou Bun 1.0+)
- **Compte Neon** — Gratuit sur [neon.tech](https://neon.tech) (configuration de la base de données automatisée)

### 1. Cloner & Installer

```bash
git clone https://github.com/yourusername/open-livestock-manager.git
cd open-livestock-manager
bun install
```

### 2. Configuration Automatisée

```bash
kiro-cli
@quickstart  # Assistant de configuration interactif
```

L'assistant de démarrage rapide va :

- ✅ Vérifier votre environnement (Node, Bun)
- ✅ Créer votre base de données automatiquement via Neon MCP
- ✅ Configurer les variables d'environnement
- ✅ Exécuter les migrations et les données de démonstration
- ✅ Démarrer le serveur de développement

### 3. Commencer à Développer

```bash
bun dev  # Si non démarré automatiquement
```

Ouvrez [http://localhost:3001](http://localhost:3001)

### Identifiants de Connexion par Défaut

Après avoir exécuté le seeder, vous pouvez vous connecter avec ces comptes par défaut :

#### Seeder de Production (`bun run db:seed`)

| Rôle  | Email                       | Mot de passe  |
| ----- | --------------------------- | ------------- |
| Admin | `admin@openlivestock.local` | `password123` |

#### Seeder de Développement (`bun run db:seed:dev`)

| Rôle  | Email                       | Mot de passe  |
| ----- | --------------------------- | ------------- |
| Admin | `admin@openlivestock.local` | `password123` |
| Démo  | `demo@openlivestock.local`  | `demo123`     |

**⚠️ Note de Sécurité** : Changez ces mots de passe par défaut immédiatement dans les environnements de production. Vous pouvez définir des identifiants personnalisés via les variables d'environnement :

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Votre Nom
```

### Configuration Manuelle (Alternative)

Si vous préférez la configuration manuelle ou n'avez pas Kiro CLI :

<details>
<summary>Cliquez pour afficher les instructions de configuration manuelle</summary>

#### Configurer l'Environnement

```bash
cp .env.example .env
```

Modifiez `.env` avec vos valeurs :

```env
# Database - Get a free Neon database at https://neon.tech
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

# Auth - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3001
```

#### Initialiser la Base de Données

```bash
bun run db:migrate   # Exécuter les migrations
bun run db:seed      # Seeder les données de production (utilisateur admin + données de référence)
```

Pour le développement avec des données de démonstration :

```bash
bun run db:seed:dev  # Seeder les données de démonstration complètes
```

</details>

---

## Déploiement

### Cloudflare Workers (Recommandé)

1. Installez Wrangler CLI :

    ```bash
    bun add -g wrangler
    wrangler login
    ```

2. Définissez vos secrets :

    ```bash
    wrangler secret put DATABASE_URL
    wrangler secret put BETTER_AUTH_SECRET
    wrangler secret put BETTER_AUTH_URL
    ```

3. Déployez :
    ```bash
    bun run deploy
    ```

### Autres Plateformes

L'application peut être déployée sur n'importe quelle plateforme supportant Node.js :

- Vercel
- Railway
- Render
- Auto-hébergé avec Docker

---

## Documentation

Guides complets pour les utilisateurs, les développeurs et les agents IA :

| Document                                           | Description                        | Public        |
| -------------------------------------------------- | ---------------------------------- | ------------- |
| **[../docs/INDEX.md](../docs/INDEX.md)**           | **Hub de documentation**           | Tout le monde |
| [../AGENTS.md](../AGENTS.md)                       | Guide de développement d'agent IA  | Assistants IA |
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Architecture système               | Développeurs  |
| [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)     | Déploiement en production          | DevOps        |
| [../docs/TESTING.md](../docs/TESTING.md)           | Stratégies de test                 | Développeurs  |
| [../docs/DATABASE.md](../docs/DATABASE.md)         | Schéma de base de données & Kysely | Développeurs  |
| [../docs/INTEGRATIONS.md](../docs/INTEGRATIONS.md) | Fournisseurs SMS/Email             | Développeurs  |
| [../DEVLOG.md](../DEVLOG.md)                       | Chronologie de développement       | Tout le monde |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)           | Guide de contribution              | Contributeurs |

## Pour les Agents IA

Ce projet est conçu pour être compatible avec les agents IA. Voir ces ressources :

| Fichier                                  | Objectif                                       |
| ---------------------------------------- | ---------------------------------------------- |
| [../AGENTS.md](../AGENTS.md)             | Guide complet pour les assistants de codage IA |
| [../DEVLOG.md](../DEVLOG.md)             | Chronologie de développement et décisions      |
| [../.kiro/README.md](../.kiro/README.md) | Guide de configuration Kiro CLI                |

### Configuration Kiro CLI

Le projet inclut une configuration complète de Kiro CLI :

**Démarrage Rapide :**

```bash
kiro-cli
@quickstart  # Assistant de configuration interactif
```

**Agents Disponibles (7) :**

```bash
kiro-cli --agent livestock-specialist  # Expertise domaine
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, déploiement
kiro-cli --agent data-analyst          # Analytique, prévisions
kiro-cli --agent qa-engineer           # Tests
kiro-cli --agent security-engineer     # Auth, sécurité
```

Voir [../.kiro/README.md](../.kiro/README.md) pour la documentation complète.

---

## Structure du Projet

```
├── app/
│   ├── components/     # Composants UI réutilisables
│   ├── lib/            # Logique métier & utilitaires
│   │   ├── auth/       # Authentification (Better Auth)
│   │   ├── batches/    # Gestion des lots
│   │   ├── db/         # Base de données (Kysely + migrations)
│   │   ├── finance/    # Calculs financiers
│   │   └── ...         # Autres modules de domaine
│   └── routes/         # Pages TanStack Router
├── public/             # Assets statiques
├── .kiro/              # Configuration agent IA
│   ├── settings/       # Configs MCP
│   ├── steering/       # Directives de codage
│   └── specs/          # Spécifications des fonctionnalités
└── ...
```

---

## Scripts

| Commande              | Description                                     |
| --------------------- | ----------------------------------------------- |
| `bun dev`             | Démarrer le serveur de développement            |
| `bun build`           | Construire pour la production                   |
| `bun run test`        | Exécuter les tests                              |
| `bun run lint`        | Exécuter ESLint                                 |
| `bun run check`       | Formater + lint                                 |
| `bun run db:migrate`  | Exécuter les migrations de base de données      |
| `bun run db:seed`     | Seeder les données de production (admin + refs) |
| `bun run db:seed:dev` | Seeder les données de démonstration complètes   |
| `bun run db:rollback` | Annuler la dernière migration                   |
| `bun run deploy`      | Construire & déployer sur Cloudflare            |

---

## Contribuer

Nous accueillons les contributions ! Veuillez consulter [../CONTRIBUTING.md](../CONTRIBUTING.md) pour :

- Flux de travail de développement
- Conventions de commit
- Directives de pull request

---

## Licence

Licence MIT — voir [../LICENSE](../LICENSE) pour les détails.

---

<p align="center">
  Fait avec ❤️ pour les agriculteurs du monde entier
</p>
