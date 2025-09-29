<div align="center">

# Guide du hook useIbex

### Le cœur de l'IBEX SDK - Interface unifiée pour toutes les fonctionnalités

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/ibex/sdk)

[Vue d'ensemble](#vue-densemble) • [Interface complète](#interface-complète) • [Exemples d'utilisation](#exemples-dutilisation) • [Bonnes pratiques](#bonnes-pratiques)

</div>

---

## Vue d'ensemble

### Qu'est-ce que useIbex ?

Le hook `useIbex()` est un hook React personnalisé qui :

<table>
<tr>
<td width="50%">

### Fonctionnalités principales

- Centralise toutes les données IBEX (utilisateur, transactions, soldes)
- Fournit des actions simples pour les opérations financières
- Gère automatiquement l'état de l'application (chargement, erreurs)
- Simplifie l'authentification et la gestion des sessions

</td>
<td width="50%">

### Révolution de l'API

Traditionnellement, les SDKs financiers nécessitent plusieurs hooks :

- `useAuth()` pour l'authentification
- `useWallet()` pour le portefeuille
- `useTransactions()` pour les transactions
- `useBalance()` pour les soldes

L'IBEX SDK révolutionne cette approche avec **un seul hook** qui remplace tout.

</td>
</tr>
</table>

---

## Import et utilisation de base

### Import

```typescript
import { useIbex } from '@absconse/ibex-sdk';
```

### Utilisation minimale

```typescript
function MonComposant() {
  const ibex = useIbex(config); // Configuration requise

  return (
    <div>
      <p>Utilisateur: {ibex.user?.email}</p>
      <p>Solde: {ibex.balance}</p>
    </div>
  );
}
```

### Destructuration recommandée

```typescript
function MonComposant() {
  const {
    user, // Données utilisateur
    balance, // Solde actuel
    transactions, // Liste des transactions
    isLoading, // État de chargement
    error, // Erreurs
    signIn, // Action de connexion
    send, // Action d'envoi
  } = useIbex(config); // Configuration requise

  // Votre logique ici...
}
```

---

## Interface complète

### Structure des données retournées

```typescript
interface IbexData {
  // === DONNÉES UTILISATEUR ===
  user: User | null; // Profil utilisateur complet
  wallet: Wallet | null; // Informations du portefeuille

  // === DONNÉES FINANCIÈRES ===
  balance: number; // Solde actuel (toujours un nombre)
  transactions: Transaction[]; // Historique des transactions
  operations: Operation[]; // Opérations utilisateur

  // === ÉTAT DE L'APPLICATION ===
  isLoading: boolean; // État de chargement global
  error: string | null; // Erreur actuelle

  // === ACTIONS D'AUTHENTIFICATION ===
  signIn: () => Promise<void>; // Connexion
  signUp: (name?: string) => Promise<void>; // Inscription
  logout: () => Promise<void>; // Déconnexion

  // === ACTIONS FINANCIÈRES ===
  send: (amount: number, to: string) => Promise<void>; // Envoyer
  receive: () => Promise<string>; // Recevoir
  withdraw: (amount: number, iban: string) => Promise<void>; // Retirer

  // === ACTIONS KYC ===
  startKyc: (language?: string) => Promise<string>; // Démarrer KYC

  // === ACTIONS IBEX SAFE ===
  getUserPrivateData: (externalUserId: string) => Promise<Record<string, any>>;
  saveUserPrivateData: (
    externalUserId: string,
    data: Record<string, any>
  ) => Promise<{ success: boolean }>;
  validateEmail: (email: string, externalUserId: string) => Promise<any>;
  confirmEmail: (
    email: string,
    code: string,
    externalUserId: string,
    options?: any
  ) => Promise<any>;

  // === UTILITAIRES ===
  refresh: () => Promise<void>; // Actualiser les données
  clearError: () => void; // Effacer les erreurs
  getKycStatusLabel: (level: number) => string; // Libellé statut KYC
}
```

---

## Exemples d'utilisation

### Authentification complète

```tsx
function AuthComponent() {
  const { user, isLoading, error, signIn, signUp, logout, clearError } = useIbex(config);

  // Gestion des erreurs
  if (error) {
    return (
      <div className="error">
        <h3>Erreur d'authentification</h3>
        <p>{error}</p>
        <button onClick={clearError}>Réessayer</button>
      </div>
    );
  }

  // État de chargement
  if (isLoading) {
    return <div>Vérification de l'authentification...</div>;
  }

  // Utilisateur non connecté
  if (!user) {
    return (
      <div className="auth-buttons">
        <h2>Bienvenue sur IBEX</h2>
        <p>Connectez-vous pour accéder à votre portefeuille</p>

        <button onClick={signIn} className="btn-primary">
          Se connecter
        </button>
        <button onClick={() => signUp('Mon Passkey')} className="btn-secondary">
          Créer un compte
        </button>
      </div>
    );
  }

  // Utilisateur connecté
  return (
    <div className="user-info">
      <h2>Bonjour {user.email} !</h2>
      <p>Statut KYC: {user.kyc.status}</p>
      <p>Portefeuille: {user.wallet?.address}</p>

      <button onClick={logout} className="btn-danger">
        Se déconnecter
      </button>
    </div>
  );
}
```

**Points clés :**

- ✅ Gestion complète des états (chargement, erreurs, utilisateur)
- ✅ Interface utilisateur intuitive
- ✅ Actions d'authentification simplifiées

---

### Dashboard financier

```tsx
function Dashboard() {
  const {
    user,
    balance,
    transactions,
    operations,
    isLoading,
    error,
    send,
    receive,
    withdraw,
    refresh,
    clearError,
  } = useIbex(config);

  // Formatage des montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Gestion des états
  if (error) {
    return (
      <div className="error">
        <p>Erreur: {error}</p>
        <button onClick={clearError}>Réessayer</button>
      </div>
    );
  }

  if (isLoading) {
    return <div>Chargement des données...</div>;
  }

  if (!user) {
    return <div>Veuillez vous connecter</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard IBEX</h1>
        <div className="user-info">
          <p>Bonjour {user.email}</p>
          <p>KYC: {user.kyc.status}</p>
        </div>
      </header>

      <section className="balance-section">
        <h2>Votre solde</h2>
        <div className="balance-display">
          <span className="balance-amount">{formatAmount(balance)}</span>
          <span className="balance-currency">EURe</span>
        </div>
      </section>

      <section className="actions-section">
        <h2>Actions rapides</h2>
        <div className="action-buttons">
          <button
            onClick={() => send(100, '0x742d35Cc6634C0532925a3b8D0C0E1c4C5F2A6f')}
            className="btn-primary"
          >
            Envoyer 100€
          </button>

          <button onClick={receive} className="btn-secondary">
            Recevoir des fonds
          </button>

          <button
            onClick={() => withdraw(50, 'FR7612345678901234567890123')}
            className="btn-tertiary"
          >
            Retirer vers IBAN
          </button>

          <button onClick={refresh} className="btn-outline">
            Actualiser
          </button>
        </div>
      </section>

      <section className="transactions-section">
        <h2>Transactions récentes</h2>
        <div className="transactions-list">
          {transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-header">
                <span className="transaction-type">{tx.type}</span>
                <span className="transaction-status">{tx.status}</span>
              </div>
              <div className="transaction-details">
                <span className="transaction-amount">{formatAmount(tx.amount)}</span>
                <span className="transaction-date">
                  {new Date(tx.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="operations-section">
        <h2>Opérations récentes</h2>
        <div className="operations-list">
          {operations.slice(0, 3).map(op => (
            <div key={op.id} className="operation-item">
              <div className="operation-header">
                <span className="operation-type">{op.type}</span>
                <span className="operation-status">{op.status}</span>
              </div>
              <div className="operation-date">
                {new Date(op.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Points clés :**

- ✅ Dashboard complet avec toutes les fonctionnalités
- ✅ Formatage intelligent des données
- ✅ Actions financières intégrées
- ✅ Interface utilisateur moderne

---

### Composant de transfert

```tsx
function TransferComponent() {
  const { send, error, clearError } = useIbex(config);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTransfer = async () => {
    if (!to || !amount) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setLoading(true);
    setSuccess(false);
    clearError();

    try {
      await send(numAmount, to);
      setSuccess(true);
      setTo('');
      setAmount('');
    } catch (err: any) {
      console.error('Erreur de transfert:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-component">
      <h2>Envoyer des fonds</h2>

      {success && <div className="success-message">Transfert envoyé avec succès !</div>}

      <div className="form">
        <div className="form-group">
          <label htmlFor="to">Adresse de destination</label>
          <input
            id="to"
            type="text"
            placeholder="0x..."
            value={to}
            onChange={e => setTo(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Montant (EURe)</label>
          <input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={loading}
            step="0.01"
            min="0"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={handleTransfer}
          disabled={loading || !to || !amount}
          className="btn-primary"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
```

**Points clés :**

- ✅ Validation complète des champs
- ✅ Gestion des erreurs détaillée
- ✅ Interface utilisateur intuitive
- ✅ Actions avec gestion d'état

---

## Gestion de l'état

### État de chargement

Le hook `useIbex()` gère automatiquement l'état de chargement :

```typescript
const { isLoading } = useIbex(config);

if (isLoading) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  );
}
```

### Gestion des erreurs

```typescript
const { error, clearError } = useIbex(config);

if (error) {
  return (
    <div className="error">
      <h3>Une erreur s'est produite</h3>
      <p>{error}</p>
      <button onClick={clearError}>Réessayer</button>
    </div>
  );
}
```

### Actualisation des données

```typescript
const { refresh } = useIbex(config);

// Actualiser toutes les données
const handleRefresh = async () => {
  try {
    await refresh();
    console.log('Données actualisées');
  } catch (error) {
    console.error("Erreur lors de l'actualisation:", error);
  }
};
```

---

## Bonnes pratiques

### 1. Destructuration sélective

Ne récupérez que les propriétés dont vous avez besoin :

<table>
<tr>
<td width="50%">

### ✅ Bon - Destructuration sélective

```typescript
function BalanceDisplay() {
  const { balance, isLoading } = useIbex(config);

  if (isLoading) return <div>Chargement...</div>;

  return <div>Solde: {balance}</div>;
}
```

</td>
<td width="50%">

### ❌ Éviter - Destructuration complète inutile

```typescript
function BalanceDisplay() {
  const {
    balance,
    isLoading,
    user,
    transactions,
    operations,
    send,
    receive,
    withdraw,
    signIn,
    signUp,
    logout,
    refresh,
    clearError,
    startKyc,
    getUserPrivateData,
    saveUserPrivateData,
    validateEmail,
    confirmEmail,
    getKycStatusLabel,
  } = useIbex();

  // Utilise seulement balance et isLoading...
}
```

</td>
</tr>
</table>

### 2. Gestion des états

Toujours gérer les états de chargement et d'erreur :

```typescript
function MonComposant() {
  const { user, balance, isLoading, error, clearError } = useIbex(config);

  // Gestion des erreurs en premier
  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={clearError}>Réessayer</button>
      </div>
    );
  }

  // Gestion du chargement
  if (isLoading) {
    return <div>Chargement...</div>;
  }

  // Interface normale
  return (
    <div>
      <p>Utilisateur: {user?.email}</p>
      <p>Solde: {balance}</p>
    </div>
  );
}
```

### 3. Actions avec gestion d'erreur

```typescript
function MonComposant() {
  const { send, error, clearError } = useIbex(config);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSend = async (amount: number, to: string) => {
    try {
      setLocalError(null);
      clearError(); // Effacer les erreurs précédentes

      await send(amount, to);

      // Succès
      alert('Transfert réussi !');
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <div>
      {(error || localError) && <div className="error">{error || localError}</div>}

      <button onClick={() => handleSend(100, '0x...')}>Envoyer 100€</button>
    </div>
  );
}
```

### 4. Utilisation des types

Tirez parti des types TypeScript :

```typescript
import { useIbex } from '@absconse/ibex-sdk';

function MonComposant() {
  const {
    user, // User | null
    balance, // number
    transactions, // Transaction[]
    send, // (amount: number, to: string) => Promise<void>
  } = useIbex();

  // TypeScript vous aide avec l'autocomplétion et la validation
  if (user) {
    console.log(user.email); // ✅ Autocomplétion
    console.log(user.kyc.status); // ✅ Types stricts
  }

  const handleSend = (amount: number, to: string) => {
    send(amount, to); // ✅ Validation des types
  };

  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.id}>
          {tx.type}: {tx.amount}€
        </div>
      ))}
    </div>
  );
}
```
