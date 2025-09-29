# Guide de contribution

Merci de votre intérêt à contribuer au SDK IBEX ! Ce guide vous explique comment contribuer efficacement.

## Démarrage rapide

### 1. Fork et clone

```bash
# Fork le repository sur GitHub
# Puis clonez votre fork
git clone https://github.com/AbsconseOfficiel/ibex-sdk.git
cd ibex-sdk
```

### 2. Installation

```bash
# Installer les dépendances
npm install

# Installer les dépendances de l'exemple
cd example
npm install
cd ..
```

### 3. Développement

```bash
# Mode développement avec watch
npm run dev

# Build du SDK
npm run build

# Tests
npm run test

# Linting
npm run lint
```

## Processus de contribution

### 1. Créer une branche

```bash
# Créer une branche pour votre feature
git checkout -b feature/nom-de-votre-feature

# Ou pour un bugfix
git checkout -b fix/description-du-bug
```

### 2. Développer

- **Code propre** : Suivez les conventions de code
- **Tests** : Ajoutez des tests pour vos modifications
- **Documentation** : Mettez à jour la documentation si nécessaire
- **Types** : Ajoutez les types TypeScript appropriés

### 3. Tester

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Linting
npm run lint

# Build
npm run build
```

### 4. Commit

```bash
# Ajouter les fichiers modifiés
git add .

# Commit avec un message descriptif
git commit -m "feat: ajouter support pour les notifications push"

# Push vers votre fork
git push origin feature/nom-de-votre-feature
```

### 5. Pull Request

1. **Créer une PR** sur GitHub
2. **Décrire** vos modifications
3. **Référencer** les issues liées
4. **Attendre** la review

## Types de contributions

### Bug fixes

- **Identifier** le problème
- **Reproduire** le bug
- **Corriger** le code
- **Tester** la correction
- **Documenter** si nécessaire

### Nouvelles fonctionnalités

- **Discuter** la fonctionnalité dans une issue
- **Implémenter** la fonctionnalité
- **Ajouter** des tests
- **Mettre à jour** la documentation
- **Exemples** d'utilisation

### Documentation

- **Corriger** les erreurs
- **Améliorer** la clarté
- **Ajouter** des exemples
- **Traduire** si nécessaire

### Tests

- **Ajouter** des tests unitaires
- **Améliorer** la couverture
- **Tests** d'intégration
- **Tests** de performance

## Conventions de code

### TypeScript

```tsx
// Interfaces avec préfixe I (optionnel)
interface IUserData {
  id: string;
  email: string;
}

// Types avec suffixe Type
type AuthStateType = 'loading' | 'authenticated' | 'error';

// Fonctions avec noms descriptifs
function formatTransactionValue(value: string): string {
  // ...
}

// Hooks avec préfixe use
function useUserData(): UserDataReturn {
  // ...
}
```

### React

```tsx
// Composants fonctionnels
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // ...
}

// Props interface
interface MyComponentProps {
  prop1: string;
  prop2?: number;
}

// Hooks personnalisés
function useMyHook(options: MyHookOptions): MyHookReturn {
  // ...
}
```

### Nommage

```tsx
// Variables et fonctions : camelCase
const userName = 'john';
function getUserData() {}

// Types et interfaces : PascalCase
interface UserData {}
type AuthState = 'loading' | 'authenticated';

// Constantes : UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.ibex.com';

// Fichiers : kebab-case
// user-data.ts
// auth-context.tsx
```

## Documentation

### Ajouter une nouvelle fonctionnalité

1. **Documenter** dans le README principal
2. **Ajouter** un guide dans `docs/`
3. **Mettre à jour** l'API reference
4. **Ajouter** des exemples
5. **Mettre à jour** la FAQ si nécessaire

### Structure de documentation

```
docs/
├── getting-started.md    # Guide de démarrage
├── authentication.md     # Guide d'authentification
├── hooks.md             # Guide des hooks
├── types.md             # Guide des types
├── examples.md           # Exemples d'utilisation
├── api-reference.md      # Référence API
└── faq.md               # Questions fréquentes
```

### Exemples de documentation

````markdown
## Nouvelle fonctionnalité

### Description

Description de la fonctionnalité.

### Utilisation

```tsx
import { newFeature } from '@absconse/ibex-sdk';

function Component() {
  const result = newFeature();
  return <div>{result}</div>;
}
```
````

### Options

- `option1: string` - Description
- `option2?: number` - Description optionnelle

### Exemple

Exemple d'utilisation complet.

````

## Review process

### Checklist pour les PR

- [ ] **Code** : Code propre et lisible
- [ ] **Tests** : Tests ajoutés et passent
- [ ] **Documentation** : Documentation mise à jour
- [ ] **Types** : Types TypeScript corrects
- [ ] **Linting** : Pas d'erreurs de linting
- [ ] **Build** : Build réussi
- [ ] **Exemples** : Exemples fonctionnels

### Review guidelines

- **Constructif** : Feedback constructif et utile
- **Respectueux** : Ton respectueux et professionnel
- **Spécifique** : Commentaires spécifiques et actionables
- **Apprentissage** : Opportunité d'apprentissage mutuel

## Release process

### Versioning

Le SDK utilise le [Semantic Versioning](https://semver.org/) :

- **MAJOR** : Changements incompatibles
- **MINOR** : Nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs

### Changelog

```markdown
## [1.1.0] - 2025-09-28

### Added
- Support pour les notifications push
- Nouveau hook useNotifications

### Changed
- Amélioration des performances de useTransactions

### Fixed
- Correction du bug de formatage des dates
- Fix de l'erreur 401 sur les transferts

### Removed
- Suppression de l'API dépréciée getOldData
````

## Reporting des bugs

### Template d'issue

```markdown
## Description du bug

Description claire et concise du problème.

## Étapes pour reproduire

1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

## Comportement attendu

Description du comportement attendu.

## Comportement actuel

Description du comportement actuel.

## Captures d'écran

Si applicable, ajoutez des captures d'écran.

## Environnement

- OS: [ex: Windows 10]
- Navigateur: [ex: Chrome 88]
- Version SDK: [ex: 1.0.0]
- Version Node: [ex: 16.14.0]

## Logs
```

Logs d'erreur si disponibles

```

## Contexte supplémentaire
Ajoutez tout autre contexte sur le problème.
```

## Feature requests

### Template de feature request

```markdown
## Description de la fonctionnalité

Description claire et concise de la fonctionnalité souhaitée.

## Problème résolu

Quel problème cette fonctionnalité résoudrait-elle ?

## Solution proposée

Description de la solution que vous aimeriez voir.

## Alternatives considérées

Décrivez les alternatives que vous avez considérées.

## Contexte supplémentaire

Ajoutez tout autre contexte ou captures d'écran.
```

## Communication

### Channels

- **Issues GitHub** : Bugs et feature requests
- **Discussions GitHub** : Questions et discussions
- **Pull Requests** : Code review et collaboration

### Guidelines

- **Respectueux** : Ton respectueux et professionnel
- **Constructif** : Feedback constructif et utile
- **Spécifique** : Questions et réponses spécifiques
- **Patient** : Comprendre que les maintainers sont bénévoles

## Reconnaissance

### Contributeurs

Les contributeurs sont reconnus dans :

- **README** : Liste des contributeurs
- **CHANGELOG** : Mentions dans les releases
- **GitHub** : Profil des contributeurs

### Types de contributions

- **Code** : Développement de fonctionnalités
- **Tests** : Amélioration de la couverture
- **Documentation** : Amélioration de la docs
- **Review** : Code review et feedback
- **Community** : Aide aux autres utilisateurs

## 📄 Licence / License

Ce projet est sous licence [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

En contribuant, vous acceptez que vos contributions soient publiées sous la même licence que le projet (Apache 2.0), sauf mention explicite contraire.

This project is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).

By contributing, you agree that your contributions will be released under the same license (Apache 2.0), unless explicitly stated otherwise.

---

**Merci de contribuer au SDK IBEX !**

Pour toute question, n'hésitez pas à ouvrir une [discussion](https://github.com/AbsconseOfficiel/ibex-sdk/discussions) ou une [issue](https://github.com/AbsconseOfficiel/ibex-sdk/issues).
