<div align="center">

# IBEX SDK

### SDK React/TypeScript pour l'intégration des services IBEX

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

L'IBEX SDK v2.0 est une bibliothèque React/TypeScript qui fournit une interface pour intégrer les services financiers IBEX dans vos applications React.

<table>
<tr>
<td width="50%">

**Architecture Modulaire**

Organisation par features avec namespace pour une structure claire.

```typescript
await sdk.auth.signIn({ includeBalance: true });
await sdk.users.getWalletAddresses();
await sdk.safe.transferToken({ tokenAddress, to, amount });
await sdk.safe.aaveSupply({ amount, assetTicker: 'EURe' });
await sdk.blockchain.getPools(100);
await sdk.safe.prepareBatch({ operations: [...] });
```

</td>
<td width="50%">

**API Complète**

Implémentation de tous les endpoints OpenAPI avec types TypeScript.

- ✅ Auth & WebAuthn (v1.1 avec options)
- ✅ Users & Wallets
- ✅ Safe Operations (transferToken, AAVE, swap, batch)
- ✅ Blockchain (BCReader v1.1, pools, swap quotes)
- ✅ KYC & Recovery (v1.1 avec pending/executed)
- ✅ Privacy & Health

</td>
</tr>
</table>

---

## Changements v2.0

### Architecture Modulaire

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

### Fonctionnalités Principales

- **Architecture modulaire** - 8 features isolées (auth, users, safe, blockchain, kyc, recovery, privacy, health)
- **Cache multi-niveaux** - Memory + SessionStorage + LocalStorage avec LRU eviction
- **WebSocket** - Reconnexion automatique, heartbeat, file d'attente
- **Tree-shaking** - Import seulement ce dont vous avez besoin
- **Types stricts** - Générés depuis OpenAPI spec
- **JSDoc complet** - Documentation inline avec exemples
- **Conforme OpenAPI v1.1** - Toutes les fonctionnalités disponibles

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

  // Transfer Token (ERC20 générique)
  const transferToken = async () => {
    if (!wallet) return

    await sdk.transferToken({
      safeAddress: wallet.address,
      chainId: wallet.chainId,
      tokenAddress: '0x...', // Adresse token ERC20
      to: '0x...',
      amount: '100',
    })
  }

  // AAVE Operations
  const supplyToAave = async () => {
    if (!wallet) return

    await sdk.aaveSupply({
      safeAddress: wallet.address,
      chainId: wallet.chainId,
      amount: '1000',
      assetTicker: 'EURe',
    })
  }

  // Swap Operations
  const executeSwap = async () => {
    if (!wallet) return

    // 1. Obtenir quote
    const quote = await sdk.getSwapQuote({
      fromToken: '0x...',
      toToken: '0x...',
      amount: '100',
      blockchainId: wallet.chainId,
    })

    // 2. Exécuter swap
    await sdk.swapFromQuote({
      safeAddress: wallet.address,
      chainId: wallet.chainId,
      quoteId: quote.quoteId,
    })
  }

  // Batch Operations
  const executeBatch = async () => {
    if (!wallet) return

    const batch = await sdk.prepareBatch({
      safeAddress: wallet.address,
      chainId: wallet.chainId,
      operations: [
        { type: 'TRANSFER_TOKEN', tokenAddress: '0x...', to: '0x...', amount: '100' },
        { type: 'AAVE_SUPPLY', amount: '500', assetTicker: 'EURe' },
      ],
    })

    await sdk.executeBatch(batch)
  }

  // Pools (AAVE)
  const checkPools = async () => {
    const pools = await sdk.getPools(100) // Gnosis Chain
    const poolBalances = await sdk.getPoolBalances({
      address: wallet?.address || '',
      blockchainId: 100,
    })
    console.log('Pools:', pools)
    console.log('Pool balances:', poolBalances)
  }

  // Recovery status (v1.1)
  const checkRecovery = async () => {
    if (!wallet) return

    const status = await sdk.getRecoveryStatus(wallet.address)
    console.log('Recovery enabled:', status.recoveryEnabled)
    console.log('Pending operations:', status.pending)
    console.log('Executed operations:', status.executed)
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

| Feature        | Description                | Endpoints                                                                 |
| -------------- | -------------------------- | ------------------------------------------------------------------------- |
| **auth**       | Authentification WebAuthn  | signUp, signIn (v1.1 avec options), refresh, createKycRedirectUrl         |
| **users**      | Informations utilisateur   | getUserDetails, getUserOperations (v1.1), getWalletAddresses, getChainIds |
| **safe**       | Opérations Safe            | transferToken, withdraw, aaveSupply, aaveWithdraw, swapFromQuote, batch   |
| **blockchain** | BCReader v1.1              | getBalances, getTransactions, getPools, getPoolBalances, getSwapQuote     |
| **recovery**   | Récupération wallet (v1.1) | getRecoveryStatus (avec pending/executed)                                 |
| **privacy**    | Données privées            | getUserData, saveUserData, validateEmail, confirmEmail                    |
| **kyc**        | Vérification identité      | startKyc, createKycRedirectUrl                                            |
| **health**     | Health check               | getHealth                                                                 |

### Exemples par Feature

#### Auth

```typescript
await sdk.auth.signUp('My iPhone')
await sdk.auth.signIn()
await sdk.auth.logout()
const iframe = await sdk.auth.createIframe('fr')
```

#### Users

```typescript
const details = await sdk.getUserDetails()
const operations = await sdk.getUserOperations() // v1.1 - groupé par Safe
const addresses = await sdk.getWalletAddresses()
const chainIds = await sdk.getSupportedChainIds()
```

#### Safe Operations

```typescript
// Transfert ERC20 générique
await sdk.transferToken({ safeAddress, chainId, tokenAddress, to, amount })

// AAVE
await sdk.aaveSupply({ safeAddress, chainId, amount, assetTicker: 'EURe' })
await sdk.aaveWithdraw({ safeAddress, chainId, amount, assetTicker: 'EURe' })

// Swap
const quote = await sdk.getSwapQuote({ fromToken, toToken, amount, blockchainId })
await sdk.swapFromQuote({ safeAddress, chainId, quoteId })

// Batch
const batch = await sdk.prepareBatch({ safeAddress, chainId, operations: [...] })
await sdk.executeBatch(batch)

// Autres opérations
await sdk.withdraw({ safeAddress, iban, amount, recipientInfo })
await sdk.createIban(safeAddress)
await sdk.signMessage({ safeAddress, message })
await sdk.enableRecovery({ safeAddress, firstName, lastName, birthDate, birthCity, birthCountry })
```

#### Blockchain (BCReader v1.1)

```typescript
const balances = await sdk.getBalances({ address, blockchainId })
const transactions = await sdk.getTransactions({ address, blockchainId })
const pools = await sdk.getPools(blockchainId)
const poolBalances = await sdk.getPoolBalances({ address, blockchainId })
const swapQuote = await sdk.getSwapQuote({ fromToken, toToken, amount, blockchainId })
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

### Cache Multi-Niveaux

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

---

## WebSocket Temps Réel

Mises à jour automatiques pour :

- Balances
- Transactions
- Opérations
- Données utilisateur
- Statut KYC
- Statut IBAN

```typescript
const { isConnected } = useIbex()
// isConnected indique l'état de la connexion WebSocket
```

---

## Migration v1 → v2

### Changements majeurs

1. **Architecture modulaire** : Features namespaced
2. **Hook simplifié** : Accès au SDK via `sdk`
3. **Types organisés** : Imports depuis `types`
4. **Cache multi-niveaux** : Memory + SessionStorage + LocalStorage
5. **WebSocket** : Reconnexion automatique + heartbeat
6. **OpenAPI v1.1** : Nouvelles fonctionnalités (transferToken, AAVE, swap, batch, pools)

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
await sdk.transferToken({ ... });
await sdk.aaveSupply({ ... });
await sdk.swapFromQuote({ ... });
await sdk.prepareBatch({ ... });
await sdk.getPools(100);
```

---

## Documentation

| Guide                                                                                                | Description                          |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [Guide de démarrage](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/getting-started.md) | Installation et première utilisation |
| [Hook useIbex](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/hooks.md)                 | Documentation détaillée du hook      |
| [Types TypeScript](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/types.md)             | Référence complète des types         |
| [Authentification](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/authentication.md)    | Guide WebAuthn et passkeys           |
| [Configuration](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/configuration.md)        | Options de configuration             |
| [Exemples](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/examples.md)                  | Exemples pratiques                   |
| [FAQ](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/faq.md)                            | Questions fréquentes                 |
| [API Reference](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/api-reference.md)        | Documentation technique complète     |

## Exemples d'Utilisation

Consultez notre [documentation complète](https://github.com/AbsconseOfficiel/ibex-sdk/tree/main/docs) avec des exemples détaillés pour chaque fonctionnalité :

- [Authentification](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/authentication.md) - WebAuthn et gestion des sessions
- [Configuration](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/configuration.md) - Setup et configuration du SDK
- [API Reference](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/api-reference.md) - Documentation technique complète
- [FAQ](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/faq.md) - Questions fréquentes et dépannage

---

## Support

| Canal             | Lien                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| **Documentation** | [docs/](https://github.com/AbsconseOfficiel/ibex-sdk/tree/main/docs)           |
| **Issues GitHub** | [Signaler un bug](https://github.com/AbsconseOfficiel/ibex-sdk/issues)         |
| **Discussions**   | [Poser une question](https://github.com/AbsconseOfficiel/ibex-sdk/discussions) |

---

## Changelog

Voir [CHANGELOG.md](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/CHANGELOG.md) pour l'historique des versions.

---

<div align="center">

**Prêt à commencer ?**

Suivez notre [guide de démarrage](https://github.com/AbsconseOfficiel/ibex-sdk/blob/main/docs/getting-started.md) pour intégrer l'IBEX SDK dans votre application en quelques minutes !

---

> Propulsé par [Dylan Enjolvin](https://github.com/AbsconseOfficiel)  
> Sous licence [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)

</div>
