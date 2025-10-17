<div align="center">

# IBEX SDK

### SDK React/TypeScript moderne pour l'intégration des services IBEX

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)

[![npm version](https://img.shields.io/npm/v/@absconse/ibex-sdk?color=blue&label=npm)](https://www.npmjs.com/package/@absconse/ibex-sdk)
![npm downloads](https://img.shields.io/npm/dm/@absconse/ibex-sdk)

[![GitHub Stars](https://img.shields.io/github/stars/AbsconseOfficiel/ibex-sdk?style=social)](https://github.com/AbsconseOfficiel/ibex-sdk)

[Documentation](#documentation) • [Démarrage rapide](#démarrage-rapide) • [Exemples](#exemples) • [Support](#support)

</div>

---

## Qu'est-ce que l'IBEX SDK ?

L'IBEX SDK v2.0 est une bibliothèque React/TypeScript **complètement refactorisée** offrant :

<table>
<tr>
<td width="50%">

**Architecture Modulaire**

Features namespaced pour une organisation claire et une DX exceptionnelle.

```typescript
await sdk.auth.signIn();
await sdk.wallet.getAddresses();
await sdk.safe.transfer({ to, amount });
await sdk.kyc.start();
await sdk.privacy.saveUserData({ ... });
```

</td>
<td width="50%">

**API Complète**

100% des endpoints OpenAPI implémentés avec types stricts TypeScript.

- ✅ Auth & WebAuthn
- ✅ Wallets & Addresses
- ✅ Transactions & Balances
- ✅ Safe Operations
- ✅ KYC & Recovery
- ✅ Privacy & Blockchain

</td>
</tr>
</table>

---

## Nouveautés v2.0 🚀

### Architecture Révolutionnaire

**Avant (v1.x)** :

```typescript
// Monolithique, complexe
const { signIn, send, withdraw } = useIbex()
```

**Maintenant (v2.0)** :

```typescript
// Modulaire, clair, extensible
const { signIn, send, sdk } = useIbex();

// Usage simple
await signIn();
await send(100, '0x...');

// Usage avancé via SDK
await sdk.safe.enableRecovery({ ... });
await sdk.privacy.saveUserData({ ... });
await sdk.blockchain.getTransactions({ startDate, endDate });
```

### Features Principales

- 🏗️ **Architecture modulaire** - 8 features isolées (auth, wallet, safe, transactions, kyc, recovery, privacy, blockchain)
- ⚡ **Cache multi-niveaux** - Memory + SessionStorage + LocalStorage avec LRU eviction
- 🔄 **WebSocket optimisé** - Reconnexion intelligente, heartbeat, file d'attente
- 📦 **Tree-shaking parfait** - Import seulement ce dont vous avez besoin
- 🎯 **Types stricts** - Générés depuis OpenAPI spec
- 📖 **JSDoc complet** - Documentation inline avec exemples
- 🚀 **Performance maximale** - Réduction 90% des requêtes via cache intelligent

---

## Installation

```bash
npm install @absconse/ibex-sdk
# ou
yarn add @absconse/ibex-sdk
# ou
pnpm add @absconse/ibex-sdk
```

---

## Démarrage rapide

### 1. Configuration

```typescript
import { IbexProvider } from '@absconse/ibex-sdk'

const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-domaine.com',
}

function App() {
  return (
    <IbexProvider config={config}>
      <Dashboard />
    </IbexProvider>
  )
}
```

### 2. Utilisation du hook

```typescript
import { useIbex } from '@absconse/ibex-sdk'

function Dashboard() {
  const {
    user,
    wallet,
    balance,
    transactions,
    operations,
    isLoading,
    error,
    isConnected,
    signIn,
    signUp,
    send,
    receive,
    startKyc,
    sdk, // SDK complet pour usage avancé
  } = useIbex()

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>
  if (!user) return <button onClick={signIn}>Se connecter</button>

  return (
    <div>
      <h1>Bonjour {user.email || 'Utilisateur'}</h1>
      <p>Solde: {balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
      <p>WebSocket: {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}</p>

      {/* Actions rapides */}
      <button onClick={() => send(100, '0x...')}>Envoyer 100€</button>
      <button
        onClick={async () => {
          const address = await receive()
          console.log('Mon adresse:', address)
        }}
      >
        Recevoir
      </button>

      {/* KYC */}
      {user.kyc.status !== 'verified' && (
        <button
          onClick={async () => {
            const kycUrl = await startKyc('fr')
            window.location.href = kycUrl
          }}
        >
          Vérifier mon identité
        </button>
      )}
    </div>
  )
}
```

### 3. Usage avancé avec SDK

```typescript
function AdvancedFeatures() {
  const { sdk, wallet } = useIbex()

  // Safe Operations
  const enableRecovery = async () => {
    if (!wallet) return

    await sdk.safe.enableRecovery({
      safeAddress: wallet.address,
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '1990-01-01',
      birthCity: 'Paris',
      birthCountry: 'FR',
    })
  }

  // Withdrawal to IBAN
  const withdrawToBank = async () => {
    if (!wallet) return

    await sdk.safe.withdraw({
      safeAddress: wallet.address,
      iban: 'FR7612345678901234567890123',
      amount: 50,
      recipientInfo: {
        firstName: 'John',
        lastName: 'Doe',
        country: 'FR',
      },
    })
  }

  // Privacy - Save user data
  const savePreferences = async () => {
    const { user } = await sdk.wallet.getUserDetails()

    await sdk.privacy.saveUserData(user.id, {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      language: 'fr',
      'optin.newsletter': true,
      'optin.walletAlerts': true,
      'private.apiKey': 'secret', // Préfixe 'private.' non retourné en GET
    })
  }

  // Blockchain - Get detailed transactions
  const getHistory = async () => {
    const transactions = await sdk.blockchain.getTransactions({
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      limit: 100,
      page: 1,
    })

    console.log(transactions)
  }

  // Recovery status
  const checkRecovery = async () => {
    if (!wallet) return

    const status = await sdk.recovery.getStatus(wallet.address)
    console.log('Recovery enabled:', status.recoveryEnabled)
    console.log('Can execute:', status.canExecute)
  }

  return (
    <div>
      <button onClick={enableRecovery}>Activer récupération</button>
      <button onClick={withdrawToBank}>Retrait IBAN</button>
      <button onClick={savePreferences}>Sauvegarder préférences</button>
      <button onClick={getHistory}>Historique détaillé</button>
      <button onClick={checkRecovery}>Statut récupération</button>
    </div>
  )
}
```

---

## API Complète

### Features Disponibles

| Feature          | Description               | Endpoints                                                                   |
| ---------------- | ------------------------- | --------------------------------------------------------------------------- |
| **auth**         | Authentification WebAuthn | signUp, signIn, refresh, createIframe                                       |
| **wallet**       | Gestion wallets           | getAddresses, getChainIds, getUserDetails, getReceiveAddress                |
| **transactions** | Historique & envois       | getHistory, getBalances                                                     |
| **safe**         | Opérations Safe           | transfer, withdraw, createIban, signMessage, enableRecovery, cancelRecovery |
| **kyc**          | Vérification identité     | start, getStatus                                                            |
| **recovery**     | Récupération wallet       | getStatus                                                                   |
| **privacy**      | Données privées           | getUserData, saveUserData, validateEmail, confirmEmail                      |
| **blockchain**   | Lecture blockchain        | getBalances, getTransactions                                                |

### Exemples par Feature

#### Auth

```typescript
await sdk.auth.signUp('My iPhone')
await sdk.auth.signIn()
await sdk.auth.logout()
const iframe = await sdk.auth.createIframe('fr')
```

#### Wallet

```typescript
const addresses = await sdk.wallet.getAddresses()
const chainIds = await sdk.wallet.getChainIds()
const receiveAddr = await sdk.wallet.getReceiveAddress()
```

#### Safe

```typescript
await sdk.safe.transfer({ safeAddress, to, amount })
await sdk.safe.withdraw({ safeAddress, iban, amount, recipientInfo })
await sdk.safe.createIban(safeAddress)
await sdk.safe.signMessage({ safeAddress, message })
await sdk.safe.enableRecovery({
  safeAddress,
  firstName,
  lastName,
  birthDate,
  birthCity,
  birthCountry,
})
```

#### Privacy

```typescript
const data = await sdk.privacy.getUserData(externalUserId)
await sdk.privacy.saveUserData(externalUserId, { email, firstName })
await sdk.privacy.validateEmail(email, externalUserId)
await sdk.privacy.confirmEmail({ email, code, externalUserId })
```

---

## Performance & Cache

### Cache Intelligent Multi-Niveaux

- **L1 (Memory)** : Le plus rapide, volatile
- **L2 (SessionStorage)** : Persistant pendant la session
- **L3 (LocalStorage)** : Persistant entre sessions

### Stratégies par Type

```typescript
{
  user: { ttl: 60000, level: 'session' },        // 1 min
  balance: { ttl: 10000, level: 'memory' },      // 10 sec
  transactions: { ttl: 30000, level: 'memory' }, // 30 sec
  operations: { ttl: 30000, level: 'memory' },   // 30 sec
  chainIds: { ttl: 3600000, level: 'persistent' }, // 1h
  recovery: { ttl: 60000, level: 'session' },    // 1 min
  privateData: { ttl: 300000, level: 'session' }, // 5 min
  config: { ttl: 86400000, level: 'persistent' }, // 24h
}
```

### Métriques

```typescript
const metrics = sdk.getMetrics()
console.log({
  http: metrics.http, // requestCount, successCount, cacheHitRate
  cache: metrics.cache, // memorySize, hits, misses, hitRate
  storage: metrics.storage, // memoryEntries, sessionEntries, persistentEntries
})
```

---

## WebSocket Temps Réel

Mises à jour automatiques pour :

- 💰 Balances
- 📤 Transactions
- 📋 Opérations
- 👤 Données utilisateur
- ✅ Statut KYC
- 🏦 Statut IBAN

```typescript
const { isConnected } = useIbex()
// isConnected indique l'état de la connexion WebSocket
```

---

## Migration v1 → v2

### Changements majeurs

1. **Architecture modulaire** : Features namespaced
2. **Hook simplifié** : Accès au SDK via `sdk`
3. **Types organisés** : Imports depuis `shared/types`
4. **Cache optimisé** : Multi-niveaux automatique
5. **WebSocket amélioré** : Reconnexion + heartbeat

### Guide de migration

**Avant** :

```typescript
const { signIn, send } = useIbex()
```

**Après** :

```typescript
const { signIn, send, sdk } = useIbex();

// Fonctions simples inchangées
await signIn();
await send(100, '0x...');

// Nouvelles fonctionnalités via SDK
await sdk.safe.enableRecovery({ ... });
await sdk.privacy.saveUserData({ ... });
```

---

## Documentation

| Guide                                           | Description                          |
| ----------------------------------------------- | ------------------------------------ |
| [Guide de démarrage](./docs/getting-started.md) | Installation et première utilisation |
| [Hook useIbex](./docs/hooks.md)                 | Documentation détaillée du hook      |
| [Types TypeScript](./docs/types.md)             | Référence complète des types         |
| [Authentification](./docs/authentication.md)    | Guide WebAuthn et passkeys           |
| [Configuration](./docs/configuration.md)        | Options de configuration             |
| [Exemples](./docs/examples.md)                  | Exemples pratiques                   |
| [FAQ](./docs/faq.md)                            | Questions fréquentes                 |
| [API Reference](./docs/api-reference.md)        | Documentation technique complète     |

## 📚 Exemples d'Utilisation

Consultez notre [documentation complète](./docs/) avec des exemples détaillés pour chaque fonctionnalité :

- 🔐 [Authentification](./docs/authentication.md) - WebAuthn et gestion des sessions
- 💰 [Configuration](./docs/configuration.md) - Setup et configuration du SDK
- 🛠️ [API Reference](./docs/api-reference.md) - Documentation technique complète
- ❓ [FAQ](./docs/faq.md) - Questions fréquentes et dépannage

---

## Support

| Canal             | Lien                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| **Documentation** | [docs/](./docs/)                                                               |
| **Issues GitHub** | [Signaler un bug](https://github.com/AbsconseOfficiel/ibex-sdk/issues)         |
| **Discussions**   | [Poser une question](https://github.com/AbsconseOfficiel/ibex-sdk/discussions) |

---

## Changelog

Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique des versions.

---

<div align="center">

**Prêt à commencer ?**

Suivez notre [guide de démarrage](./docs/getting-started.md) pour intégrer l'IBEX SDK dans votre application en quelques minutes !

---

> 🔗 Propulsé par [Dylan Enjolvin](https://github.com/AbsconseOfficiel)  
> 📄 Sous licence [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)

</div>
