<div align="center">

# Guide de démarrage rapide IBEX SDK

### Intégrez les services IBEX dans votre application React en quelques minutes

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/ibex/sdk)

[Prérequis](#-prérequis) • [Installation](#-installation) • [Configuration](#-configuration) • [Premier test](#-premier-test)

</div>

---

## Ce que vous allez apprendre

À la fin de ce guide, vous saurez :

<table>
<tr>
<td width="50%">

### Objectifs d'apprentissage

- ✅ Installer et configurer l'IBEX SDK
- ✅ Créer votre première application avec authentification
- ✅ Gérer les transactions et les soldes
- ✅ Comprendre les concepts fondamentaux

</td>
<td width="50%">

### Temps estimé

- **Installation** : 5 minutes
- **Configuration** : 10 minutes
- **Premier test** : 15 minutes
- **Total** : 30 minutes

</td>
</tr>
</table>

---

## Prérequis

### Outils nécessaires

<table>
<tr>
<td width="50%">

### Outils de développement

- **Node.js** 16+ installé sur votre machine
- **npm** ou **yarn** pour gérer les packages
- **Connaissances de base** en React et TypeScript
- **Un projet React** existant ou la capacité d'en créer un

</td>
<td width="50%">

### Comptes requis

- **IBEX** : Compte développeur pour l'API
- **Domaine** : Domaine personnalisé (recommandé)
- **HTTPS** : Obligatoire pour WebAuthn en production

</td>
</tr>
</table>

---

## Installation

### Créer un nouveau projet React

Si vous n'avez pas encore de projet React, créez-en un :

```bash
npx create-react-app mon-app-ibex --template typescript
cd mon-app-ibex
```

### Installer l'IBEX SDK

```bash
npm install @absconse/ibex-sdk
```

Ou avec yarn :

```bash
yarn add @absconse/ibex-sdk
```

**Résultat attendu :**

- ✅ Package installé avec succès
- ✅ Dépendances résolues
- ✅ Prêt pour la configuration

---

## Configuration de base

### Comprendre la configuration

L'IBEX SDK nécessite deux paramètres essentiels :

<table>
<tr>
<td width="50%">

### Paramètres requis

- **baseURL** : L'URL de l'API IBEX que vous utilisez
- **domain** : Votre domaine pour l'authentification WebAuthn

</td>
<td width="50%">

### Configuration minimale

```typescript
export const IBEX_CONFIG = {
  baseURL: 'https://api.ibex.com', // URL de l'API IBEX
  domain: 'votre-domaine.com', // Votre domaine
};
```

</td>
</tr>
</table>

### Configuration pour différents environnements

```typescript
// src/config/ibex.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const IBEX_CONFIG = {
  baseURL: isDevelopment
    ? 'https://api-testnet.ibex.com' // Environnement de test
    : 'https://api.ibex.com', // Production
  domain: window.location.hostname, // Domaine automatique
};
```

---

## Configuration du Provider

### Wrapper votre application

L'IBEX SDK utilise un système de Provider React pour partager le contexte entre tous vos composants.

Modifiez votre `src/App.tsx` :

```typescript
import React from 'react';
import { IbexProvider } from '@absconse/ibex-sdk';
import { IBEX_CONFIG } from './config/ibex';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <IbexProvider config={IBEX_CONFIG}>
      <Dashboard />
    </IbexProvider>
  );
}

export default App;
```

### Comprendre le Provider

Le `IbexProvider` :

<table>
<tr>
<td width="50%">

### Fonctionnalités

- Initialise le SDK avec votre configuration
- Gère l'état global de l'application
- Fournit le contexte à tous les composants enfants
- Gère automatiquement l'authentification et les sessions

</td>
<td width="50%">

### Flux de données

```typescript
<IbexProvider config={config}>
  <YourApp /> // Accès au contexte IBEX
</IbexProvider>
```

</td>
</tr>
</table>

---

## Créer votre premier composant

### Créer le composant Dashboard

Créez `src/components/Dashboard.tsx` :

```tsx
import React from 'react';
import { useIbex } from '@absconse/ibex-sdk';

function Dashboard() {
  const {
    // Données de l'utilisateur
    user,

    // État de l'application
    isLoading,
    error,

    // Actions d'authentification
    signIn,
    signUp,
    logout,
  } = useIbex(config);

  // Gestion des états de chargement
  if (isLoading) {
    return <div>Vérification de l'authentification...</div>;
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div>
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div>
        <h1>Bienvenue sur IBEX</h1>
        <p>Connectez-vous pour accéder à votre portefeuille</p>

        <div>
          <button onClick={signIn}>Se connecter</button>
          <button onClick={signUp}>S'inscrire</button>
        </div>
      </div>
    );
  }

  // Interface utilisateur connecté
  return (
    <div>
      <h1>Bonjour {user.email} !</h1>
      <p>Vous êtes connecté avec succès</p>

      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
}

export default Dashboard;
```

### Comprendre le hook useIbex

Le hook `useIbex()` est votre point d'entrée principal :

<table>
<tr>
<td width="50%">

### Données disponibles

- **user** : Profil utilisateur complet
- **balance** : Solde actuel
- **transactions** : Historique des transactions
- **operations** : Opérations utilisateur

</td>
<td width="50%">

### Actions disponibles

- **signIn** : Connexion
- **signUp** : Inscription
- **send** : Envoyer des fonds
- **receive** : Recevoir des fonds
- **withdraw** : Retirer vers IBAN

</td>
</tr>
</table>

---

## Ajouter la gestion des finances

### Étendre le Dashboard

Modifiez votre `Dashboard.tsx` pour inclure les fonctionnalités financières :

```tsx
import React from 'react';
import { useIbex } from '@absconse/ibex-sdk';

function Dashboard() {
  const {
    // Données utilisateur et financières
    user,
    balance,
    transactions,

    // Actions financières
    send,
    receive,
    withdraw,

    // État et actions
    isLoading,
    error,
    signIn,
    signUp,
    logout,
    refresh,
  } = useIbex(config);

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Gestion des états (identique à l'étape précédente)
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!user) {
    return (
      <div>
        <button onClick={signIn}>Se connecter</button>
        <button onClick={signUp}>S'inscrire</button>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1>Dashboard IBEX</h1>
        <p>Bonjour {user.email}</p>
        <button onClick={logout}>Déconnexion</button>
      </header>

      <section>
        <h2>Votre solde</h2>
        <p className="balance">{formatAmount(balance)} EURe</p>
      </section>

      <section>
        <h2>Actions rapides</h2>
        <button onClick={() => send(100, '0x...')}>Envoyer 100€</button>
        <button onClick={receive}>Recevoir des fonds</button>
        <button onClick={() => withdraw(50, 'FR76...')}>Retirer vers IBAN</button>
      </section>

      <section>
        <h2>Transactions récentes</h2>
        {transactions.slice(0, 5).map(tx => (
          <div key={tx.id} className="transaction">
            <p>
              {tx.type}: {formatAmount(tx.amount)}
            </p>
            <p>Date: {new Date(tx.date).toLocaleDateString('fr-FR')}</p>
          </div>
        ))}
      </section>

      <button onClick={refresh}>Actualiser les données</button>
    </div>
  );
}

export default Dashboard;
```

**Points clés :**

- ✅ Dashboard complet avec toutes les fonctionnalités
- ✅ Formatage intelligent des données
- ✅ Actions financières intégrées
- ✅ Interface utilisateur moderne

---

## Comprendre l'authentification

### WebAuthn et Passkeys

L'IBEX SDK utilise WebAuthn, une technologie moderne qui remplace les mots de passe :

<table>
<tr>
<td width="50%">

### Comment ça marche

1. L'utilisateur clique sur "Se connecter"
2. Le navigateur demande l'authentification (PIN, biométrie)
3. Une signature cryptographique est créée
4. L'utilisateur est connecté automatiquement

</td>
<td width="50%">

### Avantages

- Plus sécurisé que les mots de passe
- Impossible de voler les identifiants
- Expérience utilisateur fluide
- Support natif sur mobile et desktop

</td>
</tr>
</table>

### Première connexion

La première fois qu'un utilisateur se connecte :

```typescript
const handleSignUp = async () => {
  try {
    await signUp('Mon nom de passkey'); // Optionnel
    console.log('Compte créé avec succès !');
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
  }
};
```

### Connexions suivantes

```typescript
const handleSignIn = async () => {
  try {
    await signIn();
    console.log('Connexion réussie !');
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
};
```

---

## Gestion des erreurs

### Types d'erreurs courantes

L'IBEX SDK peut retourner différents types d'erreurs :

```typescript
const { error, clearError } = useIbex();

const getErrorMessage = (error: string) => {
  switch (error) {
    case 'NotSupportedError':
      return "Votre navigateur ne supporte pas l'authentification moderne";
    case 'NotAllowedError':
      return "Authentification refusée par l'utilisateur";
    case 'SecurityError':
      return 'Erreur de sécurité, vérifiez que vous utilisez HTTPS';
    case 'Unauthorized':
      return 'Session expirée, veuillez vous reconnecter';
    case 'NetworkError':
      return 'Erreur de connexion, vérifiez votre réseau';
    default:
      return error;
  }
};

if (error) {
  return (
    <div className="error">
      <h3>Erreur</h3>
      <p>{getErrorMessage(error)}</p>
      <button onClick={clearError}>Réessayer</button>
    </div>
  );
}
```

---

## Premier test

### Lancer votre application

```bash
npm start
```

Votre application devrait s'ouvrir sur `http://your-domain:3000`.

### Tester l'authentification

<table>
<tr>
<td width="50%">

### Étapes de test

1. Cliquez sur "S'inscrire"
2. Suivez les instructions de votre navigateur pour créer une passkey
3. Vous devriez voir votre dashboard s'afficher

</td>
<td width="50%">

### ✅ Vérifications

- Vérifiez que votre solde s'affiche
- Testez les boutons d'action (ils peuvent ne pas fonctionner en mode test)
- Vérifiez que la déconnexion fonctionne

</td>
</tr>
</table>

---

## ✅ Vérification finale

### Checklist de validation

<table>
<tr>
<td width="50%">

### ✅ Fonctionnalités de base

- [ ] L'application se lance sans erreur
- [ ] L'authentification fonctionne (inscription et connexion)
- [ ] Le dashboard s'affiche correctement
- [ ] Les données utilisateur sont visibles
- [ ] La déconnexion fonctionne

</td>
</tr>
</table>

### Prochaines étapes

Maintenant que vous avez une base fonctionnelle, vous pouvez :

<table>
<tr>
<td width="50%">

### Améliorations possibles

1. **Personnaliser l'interface** selon vos besoins
2. **Ajouter plus de fonctionnalités** (voir [Guide des hooks](./hooks.md))
3. **Implémenter des transactions** (voir [Exemples](./examples.md))
4. **Configurer pour la production** (voir [Configuration](./configuration.md))

</td>
<td width="50%">

### Ressources utiles

- [Guide des hooks](./hooks.md) - Détails du hook useIbex
- [Exemples](./examples.md) - Cas d'usage concrets
- [Configuration](./configuration.md) - Configuration avancée
- [FAQ](./faq.md) - Questions fréquentes

</td>
</tr>
</table>

---

## Dépannage

### Problèmes courants

<table>
<tr>
<td width="50%">

### Authentification

**L'authentification ne fonctionne pas :**

- Vérifiez que vous utilisez HTTPS en production
- Assurez-vous que votre navigateur supporte WebAuthn
- Vérifiez la configuration du domaine

</td>
<td width="50%">

### Données

**Les données ne se chargent pas :**

- Vérifiez votre connexion internet
- Vérifiez la configuration de l'API
- Regardez les erreurs dans la console du navigateur

</td>
</tr>
</table>

### Obtenir de l'aide

<table>
<tr>
<td width="50%">

### Ressources

- **Documentation** : [docs/](./docs/)
- **Issues GitHub** : [Signaler un bug](https://github.com/ibex/sdk/issues)
- **Discussions** : [Poser une question](https://github.com/ibex/sdk/discussions)

</td>
<td width="50%">

### Support

- **FAQ** : [Questions fréquentes](./faq.md)
- **Exemples** : [Cas d'usage](./examples.md)
- **Configuration** : [Guide de configuration](./configuration.md)

</td>
</tr>
</table>
