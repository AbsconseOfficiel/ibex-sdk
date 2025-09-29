<div align="center">

# Guide des types TypeScript IBEX SDK

### Documentation complète de tous les types et interfaces disponibles

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Stable-green)](https://github.com/ibex/sdk)

[Types d'authentification](#types-dauthentification) • [Types de données](#types-de-données) • [Types d'actions](#types-dactions) • [Types d'erreurs](#types-derreurs)

</div>

---

## Vue d'ensemble

### Pourquoi des types stricts ?

L'IBEX SDK est entièrement écrit en TypeScript pour offrir une expérience de développement optimale :

<table>
<tr>
<td width="50%">

### Avantages des types

- **Autocomplétion** : IntelliSense complet dans votre IDE
- **Détection d'erreurs** : Erreurs détectées à la compilation
- **Documentation** : Types auto-documentés
- **Refactoring** : Modifications sûres du code

</td>
<td width="50%">

### Utilisation

```typescript
import { useIbex } from '@absconse/ibex-sdk';

function MyComponent() {
  const { user, balance, send } = useIbex();

  // TypeScript connaît tous les types
  if (user) {
    console.log(user.email); // ✅ Autocomplétion
    console.log(user.kyc.status); // ✅ Types stricts
  }

  // Validation des paramètres
  send(100, '0x...'); // ✅ Validation des types
}
```

</td>
</tr>
</table>

---

## Types d'authentification

### Interface User

```typescript
interface User {
  id: string;
  email: string | null; // null si KYC non fait
  kyc: {
    status: 'pending' | 'verified' | 'rejected';
    level: number;
    updatedAt?: string;
  };
  iban?: {
    status: 'pending' | 'verified' | 'rejected';
    iban?: string;
    bic?: string;
    updatedAt?: string;
  };
}
```

**Propriétés :**

- `id` : Identifiant unique de l'utilisateur
- `email` : Adresse email de l'utilisateur (null si KYC non fait)
- `kyc` : Statut de vérification d'identité avec timestamp
- `iban` : Informations IBAN (optionnel) avec statut et timestamp
- `wallet` : Informations du portefeuille (optionnel)

### Interface Wallet

```typescript
interface Wallet {
  address: string;
  isConnected: boolean;
  chainId: number;
}
```

**Propriétés :**

- `address` : Adresse du portefeuille
- `isConnected` : État de connexion du portefeuille
- `chainId` : Identifiant de la chaîne blockchain

### Types de statut KYC

```typescript
type KycStatus = 'pending' | 'verified' | 'rejected';

interface KycInfo {
  status: KycStatus;
  level: number;
  label: string;
}
```

**Valeurs possibles :**

- `pending` : En attente de vérification
- `verified` : Vérifié et approuvé
- `rejected` : Rejeté ou en échec

---

## Types de données

### Interface Transaction

```typescript
interface Transaction {
  id: string;
  amount: number;
  type: 'IN' | 'OUT';
  status: 'confirmed' | 'pending' | 'failed';
  date: string;
  hash: string;
  from: string;
  to: string;
}
```

**Propriétés :**

- `id` : Identifiant unique de la transaction
- `hash` : Hash de la transaction sur la blockchain
- `amount` : Montant de la transaction
- `from` : Adresse de l'expéditeur
- `to` : Adresse du destinataire
- `date` : Date de la transaction
- `type` : Type de transaction ('IN' pour entrant, 'OUT' pour sortant)
- `status` : Statut de la transaction

### Interface Operation

```typescript
interface Operation {
  id: string;
  type:
    | 'TRANSFER'
    | 'WITHDRAW'
    | 'KYC'
    | 'IBAN_CREATE'
    | 'SIGN_MESSAGE'
    | 'ENABLE_RECOVERY'
    | 'CANCEL_RECOVERY';
  status: 'pending' | 'completed' | 'failed' | 'executed';
  amount?: number;
  createdAt: string;
  safeOperation?: {
    userOpHash?: string;
    status?: string;
  };
}
```

**Propriétés :**

- `id` : Identifiant unique de l'opération
- `type` : Type d'opération
- `status` : Statut de l'opération
- `createdAt` : Date de création
- `amount` : Montant (optionnel)
- `safeOperation` : Informations sur l'opération Safe (optionnel)

### Types de statut

```typescript
type TransactionStatus = 'confirmed' | 'pending' | 'failed';
type OperationStatus = 'pending' | 'completed' | 'failed' | 'executed';
type OperationType =
  | 'TRANSFER'
  | 'WITHDRAW'
  | 'KYC'
  | 'IBAN_CREATE'
  | 'SIGN_MESSAGE'
  | 'ENABLE_RECOVERY'
  | 'CANCEL_RECOVERY';
```

---

## Types d'actions

### Interface IbexData

```typescript
interface IbexData {
  // === DONNÉES UTILISATEUR ===
  user: User | null;
  wallet: Wallet | null;

  // === DONNÉES FINANCIÈRES ===
  balance: number;
  transactions: Transaction[];
  operations: Operation[];

  // === ÉTAT DE L'APPLICATION ===
  isLoading: boolean;
  error: string | null;

  // === ACTIONS D'AUTHENTIFICATION ===
  signIn: () => Promise<void>;
  signUp: (passkeyName?: string) => Promise<void>;
  logout: () => Promise<void>;

  // === ACTIONS FINANCIÈRES ===
  send: (amount: number, to: string) => Promise<void>;
  receive: () => Promise<string>;
  withdraw: (amount: number, iban: string) => Promise<void>;

  // === ACTIONS KYC ===
  startKyc: (language?: string) => Promise<string>;

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
  refresh: () => Promise<void>;
  clearError: () => void;
  getKycStatusLabel: (level: number) => string;
  getOperationTypeLabel: (type: string) => string;
  getOperationStatusLabel: (status: string) => string;
}
```

### Types de fonctions

```typescript
// Actions d'authentification
type SignInFunction = () => Promise<void>;
type SignUpFunction = (passkeyName?: string) => Promise<void>;
type LogoutFunction = () => Promise<void>;

// Actions financières
type SendFunction = (amount: number, to: string) => Promise<void>;
type ReceiveFunction = () => Promise<string>;
type WithdrawFunction = (amount: number, iban: string) => Promise<void>;

// Actions KYC
type StartKycFunction = (language?: string) => Promise<string>;

// Actions IBEX Safe
type GetUserPrivateDataFunction = (externalUserId: string) => Promise<Record<string, any>>;
type SaveUserPrivateDataFunction = (
  externalUserId: string,
  data: Record<string, any>
) => Promise<{ success: boolean }>;
type ValidateEmailFunction = (email: string, externalUserId: string) => Promise<any>;
type ConfirmEmailFunction = (
  email: string,
  code: string,
  externalUserId: string,
  options?: any
) => Promise<any>;

// Utilitaires
type RefreshFunction = () => Promise<void>;
type ClearErrorFunction = () => void;
type GetKycStatusLabelFunction = (level: number) => string;
```

---

## Types d'erreurs

### Interface Error

```typescript
interface IbexError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
```

**Propriétés :**

- `code` : Code d'erreur unique
- `message` : Message d'erreur lisible
- `details` : Détails supplémentaires (optionnel)
- `timestamp` : Horodatage de l'erreur

### Types d'erreurs courantes

```typescript
type ErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

type WebAuthnError =
  | 'NotSupportedError'
  | 'NotAllowedError'
  | 'SecurityError'
  | 'InvalidStateError'
  | 'ConstraintError'
  | 'UnknownError';
```

### Gestion des erreurs

```typescript
function handleError(error: string | IbexError) {
  if (typeof error === 'string') {
    // Erreur simple
    console.error('Erreur:', error);
  } else {
    // Erreur détaillée
    console.error('Erreur:', error.code, error.message);
    if (error.details) {
      console.error('Détails:', error.details);
    }
  }
}
```

---

## Types de configuration

### Interface IbexConfig

```typescript
interface IbexConfig {
  baseURL: string;
  domain: string;
  rpId?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  debug?: boolean;
  defaultChainId?: number;
}
```

**Propriétés :**

- `baseURL` : URL de l'API IBEX (requis)
- `domain` : Domaine pour WebAuthn (requis)
- `rpId` : Relier Party ID (optionnel, auto-déduit)
- `timeout` : Timeout des requêtes en ms (optionnel)
- `retries` : Nombre de tentatives (optionnel)
- `retryDelay` : Délai entre tentatives en ms (optionnel)
- `debug` : Mode debug (optionnel)
- `defaultChainId` : ID de chaîne par défaut (optionnel)

### Types de configuration

```typescript
type ConfigEnvironment = 'development' | 'staging' | 'production';
type ConfigMode = 'debug' | 'production';

interface EnvironmentConfig {
  environment: ConfigEnvironment;
  mode: ConfigMode;
  baseURL: string;
  domain: string;
  debug: boolean;
}
```

---

## Types d'interface utilisateur

### Interface ComponentProps

```typescript
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}
```

### Interface FormProps

```typescript
interface FormProps extends ComponentProps {
  onSubmit: (data: FormData) => void;
  onReset?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface FormData {
  [key: string]: any;
}
```

### Interface ModalProps

```typescript
interface ModalProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}
```

---

## Types de tests

### Interface MockData

```typescript
interface MockData {
  user: User;
  transactions: Transaction[];
  operations: Operation[];
  balance: number;
  error: string | null;
  isLoading: boolean;
}
```

### Interface TestConfig

```typescript
interface TestConfig extends IbexConfig {
  mockData: MockData;
  delay?: number;
  shouldFail?: boolean;
}
```

### Types de tests

```typescript
type TestScenario = 'success' | 'error' | 'loading' | 'empty';
type TestEnvironment = 'unit' | 'integration' | 'e2e';

interface TestCase {
  name: string;
  scenario: TestScenario;
  environment: TestEnvironment;
  setup: () => void;
  teardown: () => void;
}
```

---

## Types de migration

### Interface MigrationConfig

```typescript
interface MigrationConfig {
  fromVersion: string;
  toVersion: string;
  steps: MigrationStep[];
  rollback?: () => void;
}

interface MigrationStep {
  name: string;
  description: string;
  execute: () => Promise<void>;
  validate: () => Promise<boolean>;
}
```

### Types de migration

```typescript
type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed';
type MigrationType = 'breaking' | 'feature' | 'bugfix';

interface MigrationResult {
  status: MigrationStatus;
  errors: string[];
  warnings: string[];
  duration: number;
}
```

---

## Types WebSocket

### Interface IbanUpdate

```typescript
interface IbanUpdate {
  previousIban: string;
  newIban: string;
  updatedAt: string;
}
```

### Interface KycUpdate

```typescript
interface KycUpdate {
  previousKyc: string;
  newKyc: string;
  updatedAt: string;
}
```

### Types d'événements WebSocket

```typescript
type WebSocketEventType =
  | 'user.iban.updated'
  | 'user.kyc.updated'
  | 'auth_error'
  | 'balance_update'
  | 'new_transaction'
  | 'user_data';

interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}
```

---

## Bonnes pratiques

### Utilisation des types

<table>
<tr>
<td width="50%">

### ✅ Bon - Types explicites

```typescript
function processTransaction(transaction: Transaction): Promise<TransactionResult> {
  // Logique de traitement
  return Promise.resolve({
    success: true,
    transactionId: transaction.id,
  });
}

interface TransactionResult {
  success: boolean;
  transactionId: string;
  error?: string;
}
```

</td>
<td width="50%">

### ❌ Éviter - Types implicites

```typescript
function processTransaction(transaction) {
  // Pas de types, pas de sécurité
  return Promise.resolve({
    success: true,
    transactionId: transaction.id,
  });
}
```

</td>
</tr>
</table>

### Gestion des erreurs

<table>
<tr>
<td width="50%">

### ✅ Bon - Gestion typée

```typescript
function handleApiError(error: IbexError): string {
  switch (error.code) {
    case 'AUTHENTICATION_FAILED':
      return 'Authentification échouée';
    case 'NETWORK_ERROR':
      return 'Erreur de réseau';
    default:
      return 'Erreur inconnue';
  }
}
```

</td>
<td width="50%">

### ❌ Éviter - Gestion non typée

```typescript
function handleApiError(error) {
  // Pas de types, pas de sécurité
  return 'Erreur inconnue';
}
```

</td>
</tr>
</table>

### Validation des données

<table>
<tr>
<td width="50%">

### ✅ Bon - Validation typée

```typescript
function validateUser(user: unknown): user is User {
  return (
    typeof user === 'object' && user !== null && 'id' in user && 'email' in user && 'kyc' in user
  );
}
```

</td>
<td width="50%">

### ❌ Éviter - Validation non typée

```typescript
function validateUser(user) {
  // Pas de types, pas de sécurité
  return user && user.id && user.email;
}
```

</td>
</tr>
</table>

---

## Exemples d'utilisation

### Utilisation avec useIbex

```typescript
import { useIbex } from '@absconse/ibex-sdk';

function MyComponent() {
  const {
    user, // User | null
    balance, // number
    transactions, // Transaction[]
    send, // (amount: number, to: string) => Promise<void>
    error, // string | null
    isLoading, // boolean
  } = useIbex();

  // TypeScript connaît tous les types
  if (user) {
    console.log(user.email); // ✅ Autocomplétion
    console.log(user.kyc.status); // ✅ Types stricts
  }

  const handleSend = async (amount: number, to: string) => {
    try {
      await send(amount, to); // ✅ Validation des types
      console.log('Transaction envoyée');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      {isLoading && <div>Chargement...</div>}
      {error && <div>Erreur: {error}</div>}
      {user && (
        <div>
          <h1>Bonjour {user.email} !</h1>
          <p>Solde: {balance}€</p>
          <button onClick={() => handleSend(100, '0x...')}>Envoyer 100€</button>
        </div>
      )}
    </div>
  );
}
```

### Utilisation avec des composants

```typescript
interface TransactionCardProps {
  transaction: Transaction;
  onViewDetails: (transaction: Transaction) => void;
  className?: string;
}

function TransactionCard({ transaction, onViewDetails, className }: TransactionCardProps) {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className={className}>
      <h3>{transaction.type}</h3>
      <p>Montant: {formatAmount(transaction.amount)}</p>
      <p>Date: {formatDate(transaction.date)}</p>
      <p>Statut: {transaction.status}</p>
      <button onClick={() => onViewDetails(transaction)}>Voir les détails</button>
    </div>
  );
}
```
