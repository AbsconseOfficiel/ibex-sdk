<div align="center">

# Référence API IBEX

### Documentation du SDK React/TypeScript

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)

[Installation](#installation) • [Hook principal `useIbex()`](#hook-principal-useibex) • [Types](#types) • [Exemples pratiques](#exemples-pratiques)

</div>

---

## Installation

```bash
npm install @absconse/ibex-sdk
```

---

## Vue d'ensemble

<table>
<tr>
<td width="50%">

### Fonctionnalités du SDK

- **Authentification** : WebAuthn/Passkeys avec WebSocket temps réel
- **Portefeuille** : Gestion des wallets Safe avec mises à jour automatiques
- **Transactions** : Envoi, réception, historique temps réel
- **KYC** : Vérification d'identité avec notifications
- **Données** : Solde, opérations, utilisateur synchronisés
- **Architecture** : API REST (initial) + WebSocket (temps réel)

</td>
<td width="50%">

### Démarrage rapide

```tsx
import { IbexProvider, useIbex } from '@absconse/ibex-sdk'

const config = {
  baseURL: 'https://api.ibexwallet.org',
  domain: 'votre-app.com',
}

;<IbexProvider config={config}>
  <App />
</IbexProvider>
```

</td>
</tr>
</table>

---

## Configuration

### Interface `IbexConfig`

| Propriété | Type      | Requis | Description                                |
| --------- | --------- | ------ | ------------------------------------------ |
| `baseURL` | `string`  | ✅     | URL de base de l'API IBEX                  |
| `domain`  | `string`  | ✅     | Domaine de votre application               |
| `rpId`    | `string`  | ❌     | Identifiant Relying Party (WebAuthn)       |
| `timeout` | `number`  | ❌     | Timeout des requêtes en ms (défaut: 30000) |
| `retries` | `number`  | ❌     | Nombre de tentatives (défaut: 3)           |
| `cache`   | `boolean` | ❌     | Activer le cache (défaut: true)            |

<details>
<summary><b>Exemple de configuration complète</b></summary>

```typescript
const config: IbexConfig = {
  baseURL: 'https://api-testnet.ibexwallet.org',
  domain: 'your-app.com',
  rpId: 'your-app.com',
  timeout: 30000,
  retries: 3,
  cache: true,
}
```

</details>

---

## Hook principal `useIbex()`

Le hook unique pour toutes les fonctionnalités IBEX.

### Retour du hook

```typescript
const {
  // État
  isLoading, // Chargement en cours
  error, // Message d'erreur (null si OK)

  // Utilisateur
  user, // Données utilisateur (null si non connecté)
  wallet, // Informations du portefeuille

  // Finance
  balance, // Solde actuel (number)
  transactions, // Historique des transactions
  operations, // Opérations IBEX

  // Auth
  signIn, // Connexion WebAuthn
  signUp, // Inscription WebAuthn
  logout, // Déconnexion

  // Actions
  send, // Envoyer des fonds
  receive, // Recevoir des fonds
  withdraw, // Retrait vers IBAN

  // KYC
  startKyc, // Démarrer la vérification
  getKycStatusLabel, // Obtenir le libellé du statut

  // Actions IBEX Safe
  getUserPrivateData, // Récupérer les données privées
  saveUserPrivateData, // Sauvegarder les données privées
  validateEmail, // Valider un email
  confirmEmail, // Confirmer un email

  // Utilitaires
  refresh, // Rafraîchir les données
  clearError, // Effacer l'erreur
  getOperationTypeLabel, // Libellé du type d'opération
  getOperationStatusLabel, // Libellé du statut d'opération
} = useIbex()
```

### Exemple d'utilisation simple

```tsx
function Dashboard() {
  const { user, balance, send, isLoading, error } = useIbex()

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage>{error}</ErrorMessage>
  if (!user) return <LoginButton />

  return (
    <div>
      <h1>Bonjour {user.email}</h1>
      <p>Solde: {balance} EURe</p>
      <button onClick={() => send(100, '0x123...')}>Envoyer 100€</button>
    </div>
  )
}
```

---

## Types

### Utilisateur

<details>
<summary><b>Interface <code>User</code></b></summary>

```typescript
interface User {
  id: string // Identifiant unique
  email: string | null // Email (null si KYC non fait)
  kyc: {
    status: 'pending' | 'verified' | 'rejected' // Statut KYC
    level: number // Niveau KYC (0-5)
    updatedAt?: string // Timestamp de mise à jour
  }
  iban?: {
    status: 'pending' | 'verified' | 'rejected' // Statut IBAN
    iban?: string // Numéro IBAN
    bic?: string // Code BIC
    updatedAt?: string // Timestamp de mise à jour
  }
}
```

</details>

<details>
<summary><b>Interface <code>KycStatusInfo</code></b></summary>

```typescript
interface KycStatusInfo {
  status: 'pending' | 'verified' | 'rejected'
  level: number // 1-5
  label: string // "Accepté", "En cours", etc.
  description: string // Description détaillée
}
```

**Niveaux KYC :**

| Niveau | Libellé         | Signification        |
| ------ | --------------- | -------------------- |
| `1`    | En cours        | Processus initié     |
| `2`    | Dossier envoyé  | Documents soumis     |
| `3`    | Manque de pièce | Documents incomplets |
| `4`    | Refusé          | KYC rejeté           |
| `5`    | Accepté         | KYC validé           |

</details>

### Finance

<details>
<summary><b>Interface <code>Balance</code></b></summary>

```typescript
interface Balance {
  amount: number // Montant principal
  symbol: string // Devise (ex: "EURe")
  usdValue?: number // Valeur en USD (optionnel)
}
```

**Exemple :**

```typescript
{ amount: 1234.56, symbol: "EURe", usdValue: 1350.20 }
```

**Note :** Le hook `useIbex()` retourne directement `balance` comme un `number` (le montant), pas comme un objet `Balance`.

</details>

<details>
<summary><b>Interface <code>Transaction</code></b></summary>

```typescript
interface Transaction {
  id: string // ID unique
  amount: number // Montant
  type: 'IN' | 'OUT' // Type de transaction (entrant/sortant)
  status: 'confirmed' | 'pending' | 'failed' // Statut
  date: string // Date (ISO)
  hash: string // Hash blockchain
  from: string // Adresse expéditeur
  to: string // Adresse destinataire
}
```

</details>

<details>
<summary><b>Interface <code>Operation</code></b></summary>

```typescript
interface Operation {
  id: string
  type: OperationType
  status: OperationStatus
  amount?: number
  createdAt: string
  safeOperation?: {
    userOpHash?: string
    status?: string
  }
}

// Types disponibles
type OperationType =
  | 'TRANSFER' // Transfert EURe
  | 'WITHDRAW' // Retrait IBAN
  | 'KYC' // Vérification d'identité
  | 'IBAN_CREATE' // Création IBAN
  | 'SIGN_MESSAGE' // Signature de message
  | 'ENABLE_RECOVERY' // Activation récupération
  | 'CANCEL_RECOVERY' // Annulation récupération

type OperationStatus =
  | 'pending' // En attente
  | 'completed' // Terminé
  | 'failed' // Échoué
  | 'executed' // Exécutée
```

</details>

### Wallet

<details>
<summary><b>Interface <code>Wallet</code></b></summary>

```typescript
interface Wallet {
  address: string // Adresse du wallet
  isConnected: boolean // État de connexion
  chainId: number // ID de la blockchain (ex: 421614 pour Arbitrum Sepolia)
}
```

</details>

---

## Authentification

### Connexion avec passkeys

```tsx
const { signIn, error } = useIbex()

const handleLogin = async () => {
  try {
    await signIn()
    // Utilisateur connecté
  } catch (err) {
    // Erreur gérée automatiquement dans `error`
  }
}

return (
  <>
    <button onClick={handleLogin}>Se connecter avec passkey</button>
    {error && <Alert variant="error">{error}</Alert>}
  </>
)
```

### Déconnexion

```tsx
const { logout } = useIbex()

const handleLogout = async () => {
  await logout()
  // Redirection automatique
}
```

### Gestion des erreurs

```tsx
const { error, clearError } = useIbex()

// Afficher l'erreur
{
  error && <Alert onClose={clearError}>{error}</Alert>
}
```

---

## Actions financières

### Envoyer des fonds

```tsx
const { send } = useIbex()

// Syntaxe simple
await send(100, '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

// Avec gestion d'erreur
const handleSend = async (amount: number, recipient: string) => {
  try {
    await send(amount, recipient)
    toast.success('Transfert réussi !')
  } catch (err) {
    toast.error('Échec du transfert')
  }
}
```

| Paramètre | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| `amount`  | `number` | Montant à envoyer                      |
| `to`      | `string` | Adresse destinataire (format Ethereum) |

### Recevoir des fonds

```tsx
const { receive } = useIbex()

// Générer une adresse de réception
const handleReceive = async () => {
  await receive(100) // Montant attendu
  // Affiche l'adresse à l'utilisateur
}
```

### Retrait vers IBAN

```tsx
const { withdraw } = useIbex()

// Retrait simple
await withdraw(100, 'FR76 1234 5678 9012 3456 7890 123')

// Avec validation
const handleWithdraw = async (amount: number, iban: string) => {
  // Validation IBAN
  if (!validateIban(iban)) {
    toast.error('IBAN invalide')
    return
  }

  try {
    await withdraw(amount, iban)
    toast.success('Retrait en cours')
  } catch (err) {
    toast.error('Échec du retrait')
  }
}
```

---

## Vérification KYC

### Démarrer le processus KYC

```tsx
const { startKyc } = useIbex()

const handleKyc = async () => {
  try {
    const kycUrl = await startKyc('fr') // Langue: 'fr', 'en', etc.
    window.open(kycUrl, '_blank')
  } catch (err) {
    console.error('Erreur KYC:', err)
  }
}

return <button onClick={handleKyc}>Vérifier mon identité</button>
```

### Afficher le statut KYC

```tsx
const { user, getKycStatusLabel } = useIbex()

const KycBadge = () => {
  if (!user) return null

  const statusLabel = getKycStatusLabel(user.kyc.level)
  const isVerified = user.kyc.level === 5

  return <Badge variant={isVerified ? 'success' : 'warning'}>{statusLabel}</Badge>
}
```

---

## Rafraîchissement des données

```tsx
const { refresh, isLoading } = useIbex()

const handleRefresh = async () => {
  await refresh()
  // Toutes les données sont actualisées
}

return (
  <button onClick={handleRefresh} disabled={isLoading}>
    {isLoading ? 'Chargement...' : 'Rafraîchir'}
  </button>
)
```

---

## Exemples pratiques

### Afficher le solde formaté

```tsx
const { balance } = useIbex()

const FormattedBalance = () => (
  <p>
    {balance.amount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    })}
  </p>
)
```

### Liste des transactions

```tsx
const { transactions } = useIbex()

const TransactionList = () => (
  <div>
    {transactions.map(tx => (
      <TransactionCard key={tx.id}>
        <div>
          {tx.amount} {tx.symbol}
        </div>
        <div>{formatAddress(tx.to)}</div>
        <div>{formatDate(tx.date)}</div>
        <StatusBadge status={tx.status} />
      </TransactionCard>
    ))}
  </div>
)
```

### Composant complet de dashboard

```tsx
function Dashboard() {
  const { user, balance, transactions, send, withdraw, startKyc, isLoading, error } = useIbex()

  if (isLoading) return <Loader />
  if (!user) return <LoginPrompt />

  return (
    <div className="dashboard">
      {/* Header */}
      <header>
        <h1>Bonjour {user.email}</h1>
        <KycBadge level={user.kyc.level} />
      </header>

      {/* Erreurs */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Solde */}
      <Card>
        <h2>Votre solde</h2>
        <p className="balance">
          {balance.amount.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          })}
        </p>
      </Card>

      {/* Actions rapides */}
      <div className="actions">
        <button onClick={() => send(100, '0x...')}>Envoyer</button>
        <button onClick={() => withdraw(100, 'FR76...')}>Retirer</button>
        <button onClick={() => startKyc('fr')}>Vérifier identité</button>
      </div>

      {/* Transactions récentes */}
      <Card>
        <h3>Transactions récentes</h3>
        <TransactionList transactions={transactions.slice(0, 5)} />
      </Card>
    </div>
  )
}
```

---

## Utilitaires

### Formatage des montants

```typescript
const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)

// Usage: formatAmount(1234.56) → "1 234,56 €"
```

### Formatage des dates

```typescript
const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(date))

// Usage: formatDate(tx.date) → "28 septembre 2025 à 14:30"
```

### Raccourcir les adresses

```typescript
const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

// Usage: formatAddress('0x742d35...') → "0x742d...d8b6"
```

### Validation

```typescript
// Validation du montant
const validateAmount = (amount: number) => amount > 0 && amount <= 1_000_000

// Validation de l'adresse Ethereum
const validateAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)

// Validation IBAN
const validateIban = (iban: string) => {
  const clean = iban.replace(/\s/g, '')
  return clean.length >= 15 && clean.length <= 34
}
```

---

## Sécurité

### Bonnes pratiques

| Pratique                   | Description                           |
| -------------------------- | ------------------------------------- |
| **HTTPS obligatoire**      | Toujours utiliser HTTPS en production |
| **Validation des entrées** | Valider tous les montants et adresses |
| **Gestion des erreurs**    | Ne jamais exposer d'infos sensibles   |
| **Sessions sécurisées**    | Utiliser correctement WebAuthn        |

### Exemple de validation sécurisée

```typescript
const secureSend = async (amount: number, to: string) => {
  // Validation
  if (!validateAmount(amount)) {
    throw new Error('Montant invalide')
  }
  if (!validateAddress(to)) {
    throw new Error('Adresse invalide')
  }

  // Confirmation utilisateur
  const confirmed = await showConfirmDialog({
    message: `Envoyer ${amount}€ à ${formatAddress(to)} ?`,
  })

  if (!confirmed) return

  // Envoi sécurisé
  try {
    await send(amount, to)
  } catch (err) {
    // Ne pas exposer les détails de l'erreur
    throw new Error('Échec du transfert')
  }
}
```

---

## Gestionnaire de stockage (StorageManager)

### Configuration

```typescript
import { StorageManager } from '@ibex/sdk'

const storage = new StorageManager({
  enableMemoryCache: true, // Cache mémoire (instantané)
  enableSessionStorage: true, // SessionStorage (sécurisé)
  enablePersistentStorage: true, // LocalStorage (persistant)
  defaultTTL: 60000, // TTL par défaut (1 minute)
  maxMemorySize: 100, // Limite mémoire (100 entrées)
})
```

### Méthodes principales

| Méthode                   | Description            | Type de stockage           |
| ------------------------- | ---------------------- | -------------------------- |
| `set(key, data, options)` | Stocker des données    | Mémoire/Session/Persistant |
| `get(key)`                | Récupérer des données  | Auto-détection             |
| `delete(key)`             | Supprimer des données  | Tous les stockages         |
| `clear()`                 | Vider tout le stockage | Tous les stockages         |
| `invalidate(pattern)`     | Invalider par pattern  | Tous les stockages         |

### Types de stockage

```typescript
// Mémoire (instantané, perdu au rechargement)
storage.set('temp_data', data, { type: 'memory', ttl: 30000 })

// SessionStorage (sécurisé, perdu à la fermeture)
storage.set('tokens', tokens, { type: 'session', ttl: 0 })

// LocalStorage (persistant, survit aux rechargements)
storage.set('user_prefs', prefs, { type: 'persistent', ttl: 0 })

// Cache API (mémoire + session pour persistance)
storage.setCacheData('balance', balance, 30000)
```

### Méthodes spécialisées

```typescript
// Tokens d'authentification
storage.setTokens(accessToken, refreshToken)
const { accessToken, refreshToken } = storage.getTokens()
storage.clearTokens()

// Données utilisateur
storage.setUserData(userData)
const userData = storage.getUserData<UserData>()

// Cache de données
storage.setCacheData('balance', balance, 30000)
const balance = storage.getCacheData<Balance>('balance')
```

### Sécurité

- **URLs d'API masquées** : Les clés de cache sont automatiquement hashées
- **Tokens sécurisés** : Stockage en sessionStorage (supprimés à la fermeture)
- **Anonymisation** : Paramètres dynamiques remplacés par des placeholders
- **Gestion mémoire** : Éviction automatique des anciennes entrées

---

## Configuration par environnement

```typescript
// config/environments.ts
const envConfig = {
  development: {
    baseURL: 'https://api-testnet.ibexwallet.org',
    domain: 'localhost:3000',
  },
  production: {
    baseURL: 'https://api.ibexwallet.org',
    domain: 'yourapp.com',
  },
}

export const config = envConfig[import.meta.env.MODE as keyof typeof envConfig]
```
