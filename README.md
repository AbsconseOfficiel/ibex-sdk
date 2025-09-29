<div align="center">

# IBEX SDK

### SDK React/TypeScript simplifié pour l'intégration des services IBEX

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)

[![GitHub Stars](https://img.shields.io/github/stars/AbsconseOfficiel/ibex-sdk?style=social)](https://github.com/AbsconseOfficiel/ibex-sdk)

[Documentation](#-documentation-complète) • [Démarrage rapide](#-démarrage-rapide) • [Exemples](#-exemples-dutilisation) • [Support](#-support)

</div>

---

## Qu'est-ce que l'IBEX SDK ?

L'IBEX SDK est une bibliothèque JavaScript conçue pour intégrer facilement les fonctionnalités IBEX dans vos applications React. Il simplifie l'authentification, la gestion des portefeuilles, les transactions et toutes les interactions avec l'écosystème IBEX.

### Pourquoi utiliser l'IBEX SDK ?

<table>
<tr>
<td width="50%">

**Simplicité avant tout**

Un seul hook `useIbex()` pour accéder à toutes les fonctionnalités, au lieu de gérer des dizaines d'APIs différentes.

</td>
<td width="50%">

**Zero Configuration**

Détection automatique de l'environnement et configuration intelligente des paramètres nécessaires.

</td>
</tr>
<tr>
<td width="50%">

**Sécurité maximale**

WebAuthn (passkeys) pour une authentification sans mot de passe, plus sécurisée que les méthodes traditionnelles.

</td>
<td width="50%">

**TypeScript natif**

Types stricts pour une meilleure expérience de développement et moins d'erreurs en production.

</td>
</tr>
</table>

---

## Fonctionnalités principales

### Authentification moderne

![WebAuthn](https://img.shields.io/badge/WebAuthn-Enabled-success?logo=webauthn)
![Passkeys](https://img.shields.io/badge/Passkeys-Supported-blue)
![No Password](https://img.shields.io/badge/Password-Free-green)

- **Passkeys** : Connexion par PIN, biométrie ou clés de sécurité
- **Sessions persistantes** : Restauration automatique de la session
- **Sécurité maximale** : Pas de mots de passe, pas de risques de phishing

### Gestion financière

![EURe](https://img.shields.io/badge/Stablecoin-EURe-blue)
![IBAN](https://img.shields.io/badge/Withdrawal-IBAN-green)
![Crypto](https://img.shields.io/badge/Wallet-Digital-orange)

- **Portefeuilles numériques** : Création et gestion automatique
- **Transactions EURe** : Envoi et réception de stablecoins européens
- **Retraits IBAN** : Conversion crypto vers compte bancaire traditionnel
- **Historique complet** : Toutes vos transactions et opérations

### Interface développeur

![DX](https://img.shields.io/badge/DX-Excellent-success)
![IntelliSense](https://img.shields.io/badge/IntelliSense-Full-blue)
![Type Safe](https://img.shields.io/badge/Type-Safe-brightgreen)

- **Hook unique** : `useIbex()` pour tout faire
- **Données prêtes** : Plus besoin de formatage manuel
- **Gestion d'erreurs** : Système d'erreurs unifié et clair
- **Types stricts** : IntelliSense complet et validation

---

## Installation

```bash
# Avec npm
npm install @absconse/ibex-sdk

# Avec yarn
yarn add @absconse/ibex-sdk

# Avec pnpm
pnpm add @absconse/ibex-sdk
```

---

## Démarrage rapide

### Configuration minimale

```tsx
import { IbexProvider, useIbex } from '@absconse/ibex-sdk';

const config = {
  baseURL: 'https://api.ibex.com',
  domain: 'votre-domaine.com',
};

function App() {
  return (
    <IbexProvider config={config}>
      <Dashboard />
    </IbexProvider>
  );
}
```

### Utilisation du hook

```tsx
function Dashboard() {
  const {
    user, // Données utilisateur
    balance, // Solde (nombre simple)
    transactions, // Liste des transactions
    signIn, // Connexion
    send, // Envoyer de l'argent
    isLoading, // État de chargement
    error, // Erreurs
  } = useIbex();

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!user) return <button onClick={signIn}>Se connecter</button>;

  return (
    <div>
      <h1>Bonjour {user.email}</h1>
      <p>
        Solde:{' '}
        {balance.toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        })}
      </p>
      <button onClick={() => send(100, '0x...')}>Envoyer 100€</button>
    </div>
  );
}
```

---

## Configuration

### Configuration de base

```tsx
const config = {
  baseURL: 'https://api.ibex.com', // URL de l'API IBEX
  domain: 'votre-domaine.com', // Votre domaine
};
```

### Configuration avancée

```tsx
const config = {
  baseURL: 'https://api.ibex.com',
  domain: 'votre-domaine.com',
  timeout: 30000, // Timeout des requêtes (ms)
  retries: 3, // Nombre de tentatives
  debug: true, // Mode debug
};
```

---

## Exemples d'utilisation

### Authentification

```tsx
const { signIn, signUp, logout, user } = useIbex();

// Connexion
await signIn();

// Inscription (première fois)
await signUp();

// Déconnexion
await logout();
```

### Transactions

```tsx
const { send, receive, withdraw } = useIbex();

// Envoyer de l'argent
await send(100, '0x742d35Cc6634C0532925a3b8D0C0E1c4C5F2A6f');

// Obtenir l'adresse de réception
const address = await receive();

// Retirer vers IBAN
await withdraw(50, 'FR7612345678901234567890123');
```

### Affichage des données

```tsx
const { balance, transactions, user } = useIbex();

// Solde formaté
const formattedBalance = balance.toLocaleString('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

// Transactions récentes
const recentTransactions = transactions.slice(0, 5);

// Informations utilisateur
console.log(user.email, user.kyc.status);
```

---

## Sécurité

### WebAuthn et Passkeys

![FIDO2](https://img.shields.io/badge/FIDO2-Certified-green)
![W3C](https://img.shields.io/badge/W3C-Standard-blue)

L'IBEX SDK utilise **WebAuthn**, le standard W3C pour l'authentification sans mot de passe :

- **Authentificateurs intégrés** : PIN, Touch ID, Face ID, Windows Hello
- **Clés de sécurité** : Support des clés physiques (YubiKey, etc.)
- **Protection anti-phishing** : Impossible d'usurper l'identité
- **Chiffrement local** : Les clés restent sur l'appareil

### Bonnes pratiques

1. **Toujours utiliser HTTPS** en production
2. **Valider les entrées utilisateur** avant les transactions
3. **Gérer les erreurs** avec le système d'erreurs du SDK
4. **Tester sur différents appareils** pour l'authentification

---

## Support des plateformes

### Navigateurs supportés

![Chrome](https://img.shields.io/badge/Chrome-88+-green?logo=googlechrome)
![Firefox](https://img.shields.io/badge/Firefox-60+-orange?logo=firefox)
![Safari](https://img.shields.io/badge/Safari-14+-blue?logo=safari)
![Edge](https://img.shields.io/badge/Edge-88+-0078D7?logo=microsoftedge)

### Appareils mobiles

![iOS](https://img.shields.io/badge/iOS-14+-black?logo=apple)
![Android](https://img.shields.io/badge/Android-8+-green?logo=android)

- **iOS** : 14+ avec Safari (Touch ID, Face ID)
- **Android** : 8+ avec Chrome (empreinte digitale, PIN)

---

## Performance

### Optimisations automatiques

![Performance](https://img.shields.io/badge/Performance-Optimized-success)
![Cache](https://img.shields.io/badge/Cache-Smart-blue)
![Bundle](https://img.shields.io/badge/Bundle-Lightweight-green)

- **Cache intelligent** : Évite les requêtes inutiles
- **Lazy loading** : Chargement des données à la demande
- **Debouncing** : Protection contre les appels API excessifs
- **Compression** : Données optimisées pour le réseau

### Monitoring

```tsx
const { error, isLoading } = useIbex();

// Surveillance des erreurs
useEffect(() => {
  if (error) {
    console.error('Erreur IBEX:', error);
    // Envoyer à votre service de monitoring
  }
}, [error]);
```

---

## Documentation complète

| Guide                                           | Description                             |
| ----------------------------------------------- | --------------------------------------- |
| [Guide de démarrage](./docs/getting-started.md) | Installation et première utilisation    |
| [Guide des hooks](./docs/hooks.md)              | Documentation détaillée du hook useIbex |
| [Types TypeScript](./docs/types.md)             | Référence complète des types            |
| [Authentification](./docs/authentication.md)    | Guide WebAuthn et passkeys              |
| [Configuration](./docs/configuration.md)        | Options de configuration                |
| [Exemples](./docs/examples.md)                  | Exemples pratiques et cas d'usage       |
| [FAQ](./docs/faq.md)                            | Questions fréquentes et dépannage       |
| [API Reference](./docs/api-reference.md)        | Documentation technique complète        |

---

## Contribution

![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

Nous accueillons les contributions ! Consultez notre [guide de contribution](./CONTRIBUTING.md) pour commencer.

### Développement local

```bash
git clone https://github.com/AbsconseOfficiel/ibex-sdk.git
cd ibex-sdk
npm install
npm run dev
```

---

## Licence

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Apache License 2.0 - voir [LICENSE](./LICENSE) pour plus de détails.

---

## Support

| Canal             | Lien                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| **Documentation** | [docs/](./docs/)                                                               |
| **Issues GitHub** | [Signaler un bug](https://github.com/AbsconseOfficiel/ibex-sdk/issues)         |
| **Discussions**   | [Poser une question](https://github.com/AbsconseOfficiel/ibex-sdk/discussions) |
| **Email**         | dev@ibex.com                                                                   |

---

## Changelog

Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique des versions.

---

### Si ce projet vous aide, n'hésitez pas à lui donner une étoile !

**Prêt à commencer ?**

Suivez notre [guide de démarrage](./docs/getting-started.md) pour intégrer l'IBEX SDK dans votre application en quelques minutes !

---

> 🔗 Propulsé par [Dylan Enjolvin](https://github.com/AbsconseOfficiel)  
> 📄 Sous licence [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)

Made with ❤️ by the Absconse - Dylan ENJOLVIN
