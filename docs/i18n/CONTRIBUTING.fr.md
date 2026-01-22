# Contribuer à OpenLivestock Manager

Merci pour votre intérêt à contribuer ! Nous aimons les pull requests de tout le monde. En participant à ce projet, vous acceptez de respecter notre Code de Conduite et de suivre nos directives de collaboration.

## 1. Flux de Développement

1.  **Fork** le dépôt sur GitHub.
2.  **Cloner** votre fork localement :
    ```bash
    git clone https://github.com/votre-nom-utilisateur/open-livestock-manager.git
    ```
3.  **Créer une Branche** pour votre travail. Nous utilisons le format `type/courte-description` :
    - `feat/add-batch-analysis`
    - `fix/login-error-toast`
    - `docs/update-readme`

## 2. Conventions de Commit

Nous suivons la spécification **[Conventional Commits](https://www.conventionalcommits.org/)**. Cela nous aide à générer automatiquement les journaux des modifications (changelogs) et les numéros de version.

**Format** : `<type>(<portée>): <description>`

### Types Autorisés :

- `feat` : Une nouvelle fonctionnalité pour l'utilisateur (ex : "ajouter graphique de prévision").
- `fix` : Une correction de bug (ex : "corriger inventaire négatif à la suppression").
- `docs` : Modifications de documentation uniquement.
- `style` : Formatage, points-virgules manquants, etc. (pas de changement de code de production).
- `refactor` : Un changement de code qui ne corrige ni bug ni n'ajoute de fonctionnalité.
- `perf` : Un changement de code qui améliore les performances.
- `test` : Ajout de tests manquants ou correction de tests existants.
- `chore` : Changements dans le processus de build ou les outils auxiliaires (ex : "mettre à jour dépendances").

### Exemples :

- `feat(auth): implement google oauth login`
- `fix(db): add missing index on batch_id`
- `docs: update installation steps in readme`

## 3. Directives de Pull Request

- **Une Fonctionnalité par PR** : Gardez vos changements ciblés.
- **Auto-Revue** : Révisez votre propre code avant de soumettre.
- **Tests** : Assurez-vous que tous les tests passent. Si vous ajoutez une fonctionnalité, ajoutez un test correspondant.
- **Linting** : Exécutez le linter localement pour assurer qu'il n'y a pas de régressions de style.

## 4. Raccourcis de Développement Local

Nous utilisons `bun` pour la gestion des paquets et les scripts.

- **Installer les Dépendances** : `bun install`
- **Lancer le Serveur Dev** : `bun dev`
- **Lint & Format** : `bun check` (Exécute Prettier & ESLint)
- **Lancer les Tests** : `bun run test`
- **Base de Données** :
  - Migrer : `bun run db:migrate`
  - Seeder (production) : `bun run db:seed` - Utilisateur Admin + données de référence
  - Seeder (développement) : `bun run db:seed:dev` - Données de démonstration complètes avec fermes, lots, transactions

## Licence

En contribuant, vous acceptez que vos contributions soient sous licence MIT License.
