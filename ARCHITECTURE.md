# IBEX SDK - Architecture Complète

> **Version:** OpenAPI v1.1  
> **Date:** 2025  
> **Auteur:** Dylan Enjolvin

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Structure des Modules](#structure-des-modules)
4. [Flux de Données](#flux-de-données)
5. [Authentification (WebAuthn/Passkeys)](#authentification-webauthnpasskeys)
6. [Opérations Safe](#opérations-safe)
7. [Services Spécialisés](#services-spécialisés)
8. [Système de Cache](#système-de-cache)
9. [WebSocket & Temps Réel](#websocket--temps-réel)
10. [Types & Interfaces](#types--interfaces)
11. [Endpoints API](#endpoints-api)
12. [Exemples d'Utilisation](#exemples-dutilisation)

---

## 🎯 Vue d'Ensemble

Le SDK IBEX est une bibliothèque TypeScript/React modulaire pour interagir avec l'API IBEX.Fi. Il fournit une interface simple pour gérer l'authentification par passkeys (FIDO2 WebAuthn), les opérations sur les wallets Safe (ERC-4337), et les services blockchain.

### Technologies Clés

- **WebAuthn/FIDO2**: Authentification sans mot de passe via passkeys
- **Safe Global**: Wallets self-custody avec multi-signature
- **ERC-4337**: Account Abstraction pour transactions gasless
- **AAVE**: Intégration avec les pools de liquidité
- **COWSWAP/1INCH**: Swaps de tokens
- **Monerium**: IBAN pour EURe (stablecoin)

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATION                              │
│                    (React / Next.js / Vue)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOOK REACT (useIbex)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • État local (user, wallet, balance, transactions)      │  │
│  │  • Helpers simplifiés (signIn, send, withdraw)           │  │
│  │  • WebSocket intégré pour updates temps réel            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IBEX CLIENT (Core)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Point d'entrée principal                              │  │
│  │  • Délégation aux services spécialisés                   │  │
│  │  • Méthodes de convenance pour usage rapide             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   HTTP Client │   │ Storage Mgr   │   │ WebSocket Svc │
│               │   │               │   │               │
│ • Retry logic │   │ • Memory      │   │ • Auto-reconnect│
│ • Interceptors│   │ • Session     │   │ • Heartbeat    │
│ • Token mgmt  │   │ • Persistent  │   │ • Event queue │
│ • Cache       │   │ • TTL mgmt    │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service │   │ Safe Service  │   │ Blockchain Svc │
│               │   │               │   │               │
│ • signUp      │   │ • transfer    │   │ • getBalances │
│ • signIn      │   │ • withdraw    │   │ • getTxs      │
│ • logout      │   │ • aaveSupply  │   │ • getPools    │
│ • refresh     │   │ • swap        │   │ • getSwapQuote│
│               │   │ • batch ops   │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ User Service  │   │ Recovery Svc  │   │ Privacy Svc   │
│               │   │               │   │               │
│ • getDetails  │   │ • enable      │   │ • saveData    │
│ • getOps      │   │ • cancel      │   │ • getData     │
│ • getWallets  │   │ • getStatus   │   │ • validateEmail│
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   IBEX API      │
                    │  (OpenAPI v1.1) │
                    └─────────────────┘
```

---

## 📦 Structure des Modules

```
src/
├── core/                          # Cœur du SDK
│   ├── client.ts                  # IbexClient - Point d'entrée principal
│   ├── http.ts                    # HttpClient - Gestion HTTP avec retry/cache
│   ├── StorageManager.ts          # Gestion multi-niveaux (Memory/Session/Local)
│   └── websocket.ts               # WebSocketService - Updates temps réel
│
├── features/                      # Services spécialisés (modulaires)
│   ├── auth/                      # Authentification WebAuthn
│   │   ├── auth.service.ts        # signUp, signIn, logout, refresh
│   │   ├── auth.types.ts          # AuthResponse, SignInOptions, etc.
│   │   └── index.ts
│   │
│   ├── safe/                      # Opérations Safe (ERC-4337)
│   │   ├── safe.service.ts        # transfer, withdraw, aave, swap, batch
│   │   ├── safe.types.ts          # SafeOperationType, BatchRequest, etc.
│   │   └── index.ts
│   │
│   ├── blockchain/                # BCReader - Données blockchain
│   │   ├── blockchain.service.ts  # getBalances, getTransactions, getPools
│   │   ├── blockchain.types.ts    # BalancesResponse, PoolsResponse, etc.
│   │   └── index.ts
│   │
│   ├── users/                     # Informations utilisateur
│   │   ├── user.service.ts        # getUserDetails, getUserOperations
│   │   ├── user.types.ts          # UserDetailsResponse, UserOperationsResponse
│   │   └── index.ts
│   │
│   ├── recovery/                  # Récupération de wallet
│   │   ├── recovery.service.ts    # enableRecovery, getRecoveryStatus
│   │   ├── recovery.types.ts      # RecoveryStatusResponse
│   │   └── index.ts
│   │
│   ├── privacy/                   # IBEx Safe - Données privées
│   │   ├── privacy.service.ts     # saveUserData, getUserData
│   │   ├── privacy.types.ts       # UserPrivateData
│   │   └── index.ts
│   │
│   ├── kyc/                       # KYC/AML
│   │   ├── kyc.service.ts         # startKyc, createKycRedirectUrl
│   │   └── index.ts
│   │
│   └── health/                    # Health check
│       ├── health.service.ts      # getHealth
│       └── index.ts
│
├── hooks/                         # Hooks React
│   └── useIbex.ts                 # Hook principal avec état local
│
├── context/                        # Context React
│   └── IbexProvider.tsx           # Provider pour configuration
│
├── utils/                         # Utilitaires
│   ├── webauthn.ts                # Helpers WebAuthn
│   ├── validators.ts              # Validation de données
│   ├── formatters.ts              # Formatage (currency, dates, etc.)
│   └── logger.ts                  # Logging
│
├── types/                         # Types TypeScript globaux
│   └── index.ts                   # Ré-exports de tous les types
│
└── index.ts                       # Point d'entrée public du SDK
```

---

## 🔄 Flux de Données

### 1. Initialisation

```
Application
    │
    ├─► IbexProvider (config)
    │       │
    │       └─► useIbex()
    │               │
    │               ├─► new IbexClient(config)
    │               │       │
    │               │       ├─► new StorageManager()
    │               │       ├─► new HttpClient(config, storage)
    │               │       └─► new AuthService(httpClient)
    │               │           new SafeService(httpClient)
    │               │           new BlockchainService(httpClient)
    │               │           ... (autres services)
    │               │
    │               └─► État local React
    │                   • user: null
    │                   • wallet: null
    │                   • balance: { amount: 0 }
    │                   • transactions: []
    │                   • operations: []
```

### 2. Authentification (Sign Up)

```
User
    │
    ├─► signUp({ keyName, chainIds })
    │       │
    │       ▼
    │   AuthService.signUp()
    │       │
    │       ├─► POST /v1/auth/sign-up/challenge
    │       │       │
    │       │       └─► { challenge, rp, user, pubKeyCredParams }
    │       │
    │       ├─► WebAuthn API (navigator.credentials.create)
    │       │       │
    │       │       └─► PublicKeyCredential
    │       │
    │       └─► POST /v1/auth/sign-up
    │               │
    │               └─► AuthResponse {
    │                       access_token: JWT
    │                       refresh_token: string
    │                       safeAddress: { "100": "0x..." }
    │                       chainId: 100
    │                       balance?: {...}
    │                       transactions?: {...}
    │                       userdata?: {...}
    │                   }
    │
    └─► Hook met à jour l'état
            • user = { id, email, ... }
            • wallet = { address, chainId }
            • balance = { amount, symbol }
```

### 3. Opération Safe (Transfer Token)

```
User
    │
    ├─► sdk.transferToken({
    │       safeAddress: "0x...",
    │       chainId: 100,
    │       tokenAddress: "0x...",
    │       to: "0x...",
    │       amount: "100"
    │   })
    │       │
    │       ▼
    │   SafeService.transferToken()
    │       │
    │       ├─► POST /v1/safes/operations/intent
    │       │       │
    │       │       └─► {
    │       │             operation: {
    │       │               type: "TRANSFER_TOKEN",
    │       │               tokenAddress: "0x...",
    │       │               to: "0x...",
    │       │               amount: "100"
    │       │             }
    │       │           }
    │       │
    │       ├─► Response: { challenge, ... }
    │       │
    │       ├─► WebAuthn API (navigator.credentials.get)
    │       │       │
    │       │       └─► PublicKeyCredential (signature)
    │       │
    │       └─► POST /v1/safes/operations/execute
    │               │
    │               └─► {
    │                     userOpHash: "0x...",
    │                     transactionHash: "0x...",
    │                     status: "EXECUTED"
    │                   }
    │
    └─► WebSocket reçoit 'operation_update'
            • Hook met à jour operations[]
```

### 4. Batch Operations

```
User
    │
    ├─► sdk.prepareBatch({
    │       safeAddress: "0x...",
    │       chainId: 100,
    │       operations: [
    │         { type: "TRANSFER_TOKEN", ... },
    │         { type: "AAVE_SUPPLY", ... },
    │         { type: "SWAP_FROM_QUOTE", ... }
    │       ]
    │   })
    │       │
    │       ▼
    │   SafeService.prepareBatch()
    │       │
    │       ├─► POST /v1/safes/operations/batch-intent
    │       │       │
    │       │       └─► {
    │       │             batchId: "batch-123",
    │       │             challenge: {...},
    │       │             operations: [...]
    │       │           }
    │       │
    │       ├─► WebAuthn API (signature pour toutes les opérations)
    │       │
    │       └─► sdk.executeBatch({ batchId, ... })
    │               │
    │               └─► PUT /v1/safes/operations/batch-execute
    │                       │
    │                       └─► { userOpHash, transactionHash }
    │
    └─► Polling ou WebSocket pour statut
            • GET /v1/safes/operations/batch/{batchId}/status
```

---

## 🔐 Authentification (WebAuthn/Passkeys)

### Architecture WebAuthn

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ 1. signUp({ keyName })
       ▼
┌─────────────────────────────────────┐
│         IBEX SDK                    │
│  ┌───────────────────────────────┐  │
│  │ AuthService.signUp()          │  │
│  │                               │  │
│  │ POST /v1/auth/sign-up/        │  │
│  │      challenge                 │  │
│  └───────────────┬─────────────────┘  │
└──────────────────┼────────────────────┘
                   │
                   │ 2. Challenge Response
                   ▼
┌─────────────────────────────────────┐
│         IBEX API                     │
│  ┌───────────────────────────────┐  │
│  │ {                              │  │
│  │   challenge: ArrayBuffer,      │  │
│  │   rp: { id, name },            │  │
│  │   user: { id, name, display }, │  │
│  │   pubKeyCredParams: [...]      │  │
│  │ }                              │  │
│  └───────────────┬─────────────────┘  │
└──────────────────┼────────────────────┘
                   │
                   │ 3. navigator.credentials.create()
                   ▼
┌─────────────────────────────────────┐
│      WebAuthn API (Browser)          │
│  ┌───────────────────────────────┐  │
│  │ • Génère paire clé privée/    │  │
│  │   publique                    │  │
│  │ • Stocke clé privée dans      │  │
│  │   Secure Enclave (TPM/SE)     │  │
│  │ • Signe challenge avec clé     │  │
│  │   privée                       │  │
│  │ • Retourne PublicKeyCredential│  │
│  └───────────────┬─────────────────┘  │
└──────────────────┼────────────────────┘
                   │
                   │ 4. PublicKeyCredential
                   ▼
┌─────────────────────────────────────┐
│         IBEX SDK                    │
│  ┌───────────────────────────────┐  │
│  │ POST /v1/auth/sign-up          │  │
│  │ {                              │  │
│  │   credential: {                │  │
│  │     id: "credential-id",       │  │
│  │     rawId: ArrayBuffer,        │  │
│  │     response: {                │  │
│  │       clientDataJSON: {...},   │  │
│  │       attestationObject: {...} │  │
│  │     }                          │  │
│  │   }                            │  │
│  │ }                              │  │
│  └───────────────┬─────────────────┘  │
└──────────────────┼────────────────────┘
                   │
                   │ 5. Validation & Création
                   ▼
┌─────────────────────────────────────┐
│         IBEX API                     │
│  ┌───────────────────────────────┐  │
│  │ • Valide attestation          │  │
│  │ • Crée utilisateur            │  │
│  │ • Génère Safe wallet          │  │
│  │ • Retourne JWT + infos        │  │
│  └───────────────┬─────────────────┘  │
└──────────────────┼────────────────────┘
                   │
                   │ 6. AuthResponse
                   ▼
┌─────────────────────────────────────┐
│         IBEX SDK                    │
│  ┌───────────────────────────────┐  │
│  │ • Stocke JWT dans storage    │  │
│  │ • Met à jour état React      │  │
│  │ • Connecte WebSocket          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Flux Sign In

```
User
    │
    ├─► signIn({ includeBalance: true })
    │       │
    │       ▼
    │   AuthService.signIn()
    │       │
    │       ├─► POST /v1/auth/sign-in/challenge
    │       │       │
    │       │       └─► { challenge, allowCredentials }
    │       │
    │       ├─► WebAuthn API (navigator.credentials.get)
    │       │       │
    │       │       └─► PublicKeyCredential (signature)
    │       │
    │       └─► POST /v1/auth/sign-in
    │               ?includeBalance=true
    │               &includeTransactions=true
    │               &includeUserdata=true
    │               │
    │               └─► AuthResponse {
    │                     access_token: JWT,
    │                     safeAddress: { "100": "0x..." },
    │                     balance: { tokens: [...] },
    │                     transactions: { data: [...] },
    │                     userdata: { ... }
    │                   }
```

---

## 💼 Opérations Safe

### Types d'Opérations

```
SafeOperationType
│
├─► TRANSFER_EURe (deprecated)
│   └─► Utiliser TRANSFER_TOKEN avec adresse EURe
│
├─► TRANSFER_TOKEN
│   └─► Transfert générique ERC20
│       • tokenAddress: string
│       • to: string
│       • amount: string
│
├─► MONERIUM_CREATE_IBAN
│   └─► Création d'IBAN pour EURe
│
├─► MONERIUM_WITHDRAW_EURe
│   └─► Retrait EURe vers IBAN
│       • iban: string
│       • amount: string
│       • recipientInfo: {...}
│
├─► SIGN_MESSAGE
│   └─► Signature de message EIP-191
│       • message: string
│
├─► ENABLE_RECOVERY
│   └─► Activation récupération wallet
│       • firstName, lastName
│       • birthDate, birthCity, birthCountry
│       • recoveryAddress: string
│
├─► CANCEL_RECOVERY
│   └─► Annulation récupération
│
├─► AAVE_SUPPLY
│   └─► Dépôt dans pool AAVE
│       • amount: string
│       • assetTicker?: string
│       • tokenAddress?: string
│       • decimals?: number
│
├─► AAVE_WITHDRAW
│   └─► Retrait de pool AAVE
│       • amount: string
│       • assetTicker?: string
│       • tokenAddress?: string
│
└─► SWAP_FROM_QUOTE
    └─► Exécution swap depuis quote
        • quoteId: string
```

### Flux d'Exécution

```
User
    │
    ├─► sdk.safe.transferToken({ ... })
    │       │
    │       ▼
    │   SafeService.transferToken()
    │       │
    │       ├─► 1. INTENT
    │       │   POST /v1/safes/operations/intent
    │       │   {
    │       │     safeAddress: "0x...",
    │       │     chainId: 100,
    │       │     operation: {
    │       │       type: "TRANSFER_TOKEN",
    │       │       tokenAddress: "0x...",
    │       │       to: "0x...",
    │       │       amount: "100"
    │       │     }
    │       │   }
    │       │       │
    │       │       └─► Response: {
    │       │             challenge: ArrayBuffer,
    │       │             userOp: {...},
    │       │             paymaster: {...}
    │       │           }
    │       │
    │       ├─► 2. WEBAUTHN SIGNATURE
    │       │   navigator.credentials.get({
    │       │     publicKey: {
    │       │       challenge: challenge,
    │       │       allowCredentials: [...]
    │       │     }
    │       │   })
    │       │       │
    │       │       └─► PublicKeyCredential {
    │       │             id: "cred-id",
    │       │             response: {
    │       │               authenticatorData: ArrayBuffer,
    │       │               clientDataJSON: ArrayBuffer,
    │       │               signature: ArrayBuffer
    │       │             }
    │       │           }
    │       │
    │       └─► 3. EXECUTE
    │           POST /v1/safes/operations/execute
    │           {
    │             challenge: challenge,
    │             credential: PublicKeyCredential,
    │             userOp: {...}
    │           }
    │               │
    │               └─► Response: {
    │                     userOpHash: "0x...",
    │                     transactionHash: "0x...",
    │                     status: "EXECUTED"
    │                   }
    │
    └─► 4. POLLING / WEBSOCKET
        • GET /v1/safes/operations/{userOpHash}/status
        • WebSocket: 'operation_update'
        • Hook met à jour operations[]
```

### Batch Operations

```
User
    │
    ├─► sdk.prepareBatch({
    │       safeAddress: "0x...",
    │       chainId: 100,
    │       operations: [
    │         { type: "TRANSFER_TOKEN", ... },
    │         { type: "AAVE_SUPPLY", ... },
    │         { type: "SWAP_FROM_QUOTE", ... }
    │       ]
    │   })
    │       │
    │       ▼
    │   POST /v1/safes/operations/batch-intent
    │       │
    │       └─► {
    │             batchId: "batch-123",
    │             challenge: ArrayBuffer,
    │             operations: [
    │               { userOp: {...}, ... },
    │               { userOp: {...}, ... },
    │               { userOp: {...}, ... }
    │             ]
    │           }
    │
    ├─► WebAuthn (signature unique pour toutes les opérations)
    │
    └─► PUT /v1/safes/operations/batch-execute
            │
            └─► {
                  userOpHash: "0x...",
                  transactionHash: "0x...",
                  status: "EXECUTED"
                }
```

---

## 🛠️ Services Spécialisés

### AuthService

```typescript
class AuthService {
  // Inscription
  signUp(options?: SignUpOptions): Promise<AuthResponse>

  // Connexion
  signIn(options?: SignInOptions): Promise<AuthResponse>
  // Options: includeBalance, includeTransactions, includeUserdata

  // Déconnexion
  logout(): Promise<void>

  // Refresh token
  refresh(refreshToken: string): Promise<AuthResponse>

  // KYC
  createKycRedirectUrl(language?: string, returnUrl?: string): Promise<string>
}
```

**Endpoints:**

- `POST /v1/auth/sign-up/challenge`
- `POST /v1/auth/sign-up`
- `POST /v1/auth/sign-in/challenge`
- `POST /v1/auth/sign-in`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `GET /v1/auth/kyc/redirect-url`

### SafeService

```typescript
class SafeService {
  // Transfers
  transfer(params: TransferParams): Promise<SafeOperationExecuteResponse> // @deprecated
  transferToken(params: TransferTokenParams): Promise<SafeOperationExecuteResponse>
  withdraw(params: WithdrawParams): Promise<SafeOperationExecuteResponse>

  // Monerium
  createIban(safeAddress: string, chainId?: number): Promise<SafeOperationExecuteResponse>

  // Messages
  signMessage(params: SignMessageParams): Promise<SafeOperationExecuteResponse>

  // Recovery
  enableRecovery(params: EnableRecoveryParams): Promise<SafeOperationExecuteResponse>
  cancelRecovery(safeAddress: string, chainId?: number): Promise<SafeOperationExecuteResponse>

  // AAVE
  aaveSupply(params: AaveSupplyParams): Promise<SafeOperationExecuteResponse>
  aaveWithdraw(params: AaveWithdrawParams): Promise<SafeOperationExecuteResponse>

  // Swap
  swapFromQuote(params: SwapFromQuoteParams): Promise<SafeOperationExecuteResponse>
  getSwapQuote(params: SwapQuoteParams): Promise<SwapQuoteResponse>

  // Batch
  prepareBatch(request: BatchIntentRequest): Promise<BatchIntentResponse>
  executeBatchWithWebAuthn(request: BatchIntentRequest): Promise<SafeOperationExecuteResponse>
  getBatchStatus(batchId: string): Promise<BatchStatusResponse>

  // Status
  getOperationStatus(userOpHash: string): Promise<OperationStatusResponse>
  waitForOperation(userOpHash: string, options?: {...}): Promise<OperationStatusResponse>
}
```

**Endpoints:**

- `POST /v1/safes/operations/intent`
- `POST /v1/safes/operations/execute`
- `POST /v1/safes/operations/batch-intent`
- `PUT /v1/safes/operations/batch-execute`
- `GET /v1/safes/operations/batch/{batchId}/status`
- `GET /v1/safes/operations/{userOpHash}/status`

### BlockchainService (BCReader)

```typescript
class BlockchainService {
  // Balances
  getBalances(params?: BalancesParams): Promise<BalancesResponse>
  // Headers: X-Blockchain-Id

  // Transactions
  getTransactions(params?: TransactionsParams): Promise<TransactionsResponse>
  // Headers: X-Blockchain-Id

  // Pools (AAVE)
  getPools(blockchainId: number): Promise<PoolsResponse>
  getPoolBalances(params: PoolBalancesParams): Promise<PoolBalancesResponse>

  // Swap Quotes
  getSwapQuote(params: SwapQuoteParams): Promise<SwapQuoteResponse>
}
```

**Endpoints:**

- `GET /v1.1/bcreader/balances`
- `GET /v1.1/bcreader/transactions`
- `GET /v1.1/bcreader/pools`
- `GET /v1.1/bcreader/pools/balances`
- `GET /v1.1/bcreader/swap/quote`

### UserService

```typescript
class UserService {
  getUserDetails(): Promise<UserDetailsResponse>
  getUserOperations(): Promise<UserOperationsResponse> // v1.1 - groupé par Safe
  getSupportedChainIds(): Promise<ChainIdsResponse>
  getWalletAddresses(): Promise<WalletAddressesResponse>
  getUserById(externalUserId: string): Promise<UserDetailsResponse>
}
```

**Endpoints:**

- `GET /v1/users/me`
- `GET /v1.1/users/me/operations` (nouveau format groupé)
- `GET /v1/users/me/chain-ids`
- `GET /v1/users/me/wallets`
- `GET /v1/users/{externalUserId}`

### RecoveryService

```typescript
class RecoveryService {
  getRecoveryStatus(safeAddress: string): Promise<RecoveryStatusResponse>
  // v1.1 - inclut pending[] et executed[]
}
```

**Endpoints:**

- `GET /v1.1/recovery/status/{safeAddress}`

### PrivacyService (IBEx Safe)

```typescript
class PrivacyService {
  getUserData(externalUserId: string): Promise<UserPrivateData>
  saveUserData(externalUserId: string, data: Record<string, unknown>): Promise<SaveUserDataResponse>
  validateEmail(email: string, externalUserId: string): Promise<ValidateEmailResponse>
  confirmEmail(params: ConfirmEmailParams): Promise<void>
}
```

**Endpoints:**

- `GET /v1/privacy/users/{externalUserId}/data`
- `PUT /v1/privacy/users/{externalUserId}/data`
- `POST /v1/privacy/users/{externalUserId}/email/validate`
- `POST /v1/privacy/users/{externalUserId}/email/confirm`

---

## 💾 Système de Cache

### Architecture Multi-Niveaux

```
┌─────────────────────────────────────────────────────────┐
│              StorageManager                              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Memory     │  │   Session    │  │  Persistent  │  │
│  │   Cache      │  │   Storage    │  │   Storage    │  │
│  │              │  │              │  │              │  │
│  │ • TTL: 60s   │  │ • TTL: 5min  │  │ • TTL: 1h    │  │
│  │ • Max: 100   │  │ • Tab scope  │  │ • Browser    │  │
│  │ • Fast       │  │ • Medium     │  │ • Persistent │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   HttpClient     │
                    │                 │
                    │ • Cache GET     │
                    │ • Invalidate    │
                    │ • TTL auto      │
                    └─────────────────┘
```

### Stratégie de Cache

```typescript
// 1. Memory Cache (rapide, volatile)
storage.set('user', userData, { type: 'memory', ttl: 60000 })

// 2. Session Storage (moyen terme, par onglet)
storage.set('balance', balanceData, { type: 'session', ttl: 300000 })

// 3. Persistent Storage (long terme, navigateur)
storage.set('config', configData, { type: 'persistent', ttl: 3600000 })

// 4. HTTP Cache (automatique via HttpClient)
httpClient.request('/v1/users/me', { cache: true, cacheTTL: 60000 })
```

### Invalidation

```typescript
// Invalidation manuelle
storage.delete('user')
httpClient.clearCache()

// Invalidation automatique
// • Après signIn/signUp → clear user cache
// • Après opération Safe → clear balance cache
// • Après WebSocket update → update cache
```

---

## 🔌 WebSocket & Temps Réel

### Architecture WebSocket

```
┌─────────────────────────────────────────────────────────┐
│              WebSocketService                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Connection Management                           │  │
│  │  • Auto-reconnect (exponential backoff)          │  │
│  │  • Heartbeat (ping/pong)                         │  │
│  │  • Connection state tracking                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Message Queue                                  │  │
│  │  • Queue messages during disconnect              │  │
│  │  • Batch send on reconnect                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Event Handlers                                 │  │
│  │  • balance_update                                │  │
│  │  • new_transaction                               │  │
│  │  • operation_update                              │  │
│  │  • user.iban.updated                            │  │
│  │  • user.kyc.updated                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              IBEX API WebSocket                         │
│  wss://api.ibex.fi/ws                                   │
│                                                          │
│  Authentication: JWT token                              │
│  Protocol: JSON messages                                │
└─────────────────────────────────────────────────────────┘
```

### Événements WebSocket

```typescript
// Types d'événements
type WebSocketEventType =
  | 'auth_success'
  | 'auth_error'
  | 'balance_data'
  | 'balance_update'
  | 'transaction_data'
  | 'new_transaction'
  | 'user_data'
  | 'operation_data'
  | 'operation_update'
  | 'new_operation'
  | 'user.iban.updated'
  | 'user.kyc.updated'
  | 'chainid_data'
  | 'recovery_data'

// Exemple de message
{
  type: 'balance_update',
  data: {
    address: '0x...',
    balance: '100.5',
    updated_at: '2025-01-15T10:30:00Z'
  }
}
```

### Intégration dans useIbex

```typescript
// Dans useIbex.ts
const setupWebSocket = async (token: string) => {
  const wsService = new WebSocketService(
    { url: wsUrl, jwtToken: token },
    {
      onBalanceUpdate: data => {
        setData(prev => ({
          ...prev,
          balance: { amount: parseFloat(data.balance), symbol: 'EURe' },
        }))
      },
      onNewTransaction: data => {
        // Ajouter transaction à la liste
      },
      onOperationUpdate: data => {
        // Mettre à jour opération
      },
    }
  )

  wsRef.current = wsService
  wsService.connect()
}
```

---

## 📝 Types & Interfaces

### Types Principaux

```typescript
// Configuration
interface IbexConfig {
  baseURL: string
  domain: string
  retries?: number
  timeout?: number
  cache?: CacheConfig
  websocket?: WebSocketConfig
}

// Authentification
interface AuthResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  safeAddress?: Record<string, string> // chainId -> address
  chainId?: number
  balance?: object
  transactions?: object
  userdata?: Record<string, unknown>
  services?: Array<Record<string, boolean>>
}

interface SignInOptions {
  includeBalance?: boolean
  includeTransactions?: boolean
  includeUserdata?: boolean
}

// Safe Operations
type SafeOperationType =
  | 'TRANSFER_EURe' // @deprecated
  | 'TRANSFER_TOKEN'
  | 'MONERIUM_CREATE_IBAN'
  | 'MONERIUM_WITHDRAW_EURe'
  | 'SIGN_MESSAGE'
  | 'ENABLE_RECOVERY'
  | 'CANCEL_RECOVERY'
  | 'AAVE_SUPPLY'
  | 'AAVE_WITHDRAW'
  | 'SWAP_FROM_QUOTE'

interface SafeOperationExecuteResponse {
  userOpHash: string
  transactionHash?: string
  status: 'CREATED' | 'SIGNED' | 'EXECUTED' | 'CONFIRMED' | 'FAILED'
}

// Batch
interface BatchIntentRequest {
  safeAddress: string
  chainId?: number
  operations: SafeOperationInput[]
}

interface BatchStatusResponse {
  batchId: string
  status: 'PENDING' | 'EXECUTED' | 'FAILED'
  operations: BatchOperationInfo[]
}

// User Operations (v1.1)
interface UserOperationsResponse {
  data: Record<string, UserOperation[]> // Groupé par Safe address
}

// Recovery (v1.1)
interface RecoveryStatusResponse {
  safeAddress: string
  recoveryEnabled: boolean
  recoveryAddress: string | null
  delay: number | null
  pendingRecovery: boolean
  canExecute: boolean
  executeAfter: string | null
  dataRecovery: boolean
  pending: RecoveryOperation[]
  executed: RecoveryOperation[]
}

// Blockchain
interface BalancesResponse {
  address: string
  balances: TokenBalance[]
}

interface PoolsResponse {
  pools: WatchedPool[]
}

interface SwapQuoteResponse {
  quoteId: string
  fromToken: TokenInfo
  toToken: TokenInfo
  fromAmount: string
  toAmount: string
  provider: 'COWSWAP' | '1INCH'
  validUntil: string
}
```

---

## 🌐 Endpoints API

### Authentification

| Méthode | Endpoint                     | Description                 |
| ------- | ---------------------------- | --------------------------- |
| `POST`  | `/v1/auth/sign-up/challenge` | Challenge pour inscription  |
| `POST`  | `/v1/auth/sign-up`           | Inscription avec credential |
| `POST`  | `/v1/auth/sign-in/challenge` | Challenge pour connexion    |
| `POST`  | `/v1/auth/sign-in`           | Connexion avec credential   |
| `POST`  | `/v1/auth/refresh`           | Rafraîchir token            |
| `POST`  | `/v1/auth/logout`            | Déconnexion                 |
| `GET`   | `/v1/auth/kyc/redirect-url`  | URL redirection KYC         |

### Safe Operations

| Méthode | Endpoint                                      | Description        |
| ------- | --------------------------------------------- | ------------------ |
| `POST`  | `/v1/safes/operations/intent`                 | Préparer opération |
| `POST`  | `/v1/safes/operations/execute`                | Exécuter opération |
| `POST`  | `/v1/safes/operations/batch-intent`           | Préparer batch     |
| `PUT`   | `/v1/safes/operations/batch-execute`          | Exécuter batch     |
| `GET`   | `/v1/safes/operations/batch/{batchId}/status` | Statut batch       |
| `GET`   | `/v1/safes/operations/{userOpHash}/status`    | Statut opération   |

### Users

| Méthode | Endpoint                     | Description                    |
| ------- | ---------------------------- | ------------------------------ |
| `GET`   | `/v1/users/me`               | Détails utilisateur            |
| `GET`   | `/v1.1/users/me/operations`  | Opérations (groupées par Safe) |
| `GET`   | `/v1/users/me/chain-ids`     | Chain IDs supportés            |
| `GET`   | `/v1/users/me/wallets`       | Adresses wallets               |
| `GET`   | `/v1/users/{externalUserId}` | Utilisateur par ID             |

### Blockchain (BCReader)

| Méthode | Endpoint                        | Description                              |
| ------- | ------------------------------- | ---------------------------------------- |
| `GET`   | `/v1.1/bcreader/balances`       | Balances (header: `X-Blockchain-Id`)     |
| `GET`   | `/v1.1/bcreader/transactions`   | Transactions (header: `X-Blockchain-Id`) |
| `GET`   | `/v1.1/bcreader/pools`          | Pools actifs                             |
| `GET`   | `/v1.1/bcreader/pools/balances` | Balances pools                           |
| `GET`   | `/v1.1/bcreader/swap/quote`     | Quote de swap                            |

### Recovery

| Méthode | Endpoint                              | Description                |
| ------- | ------------------------------------- | -------------------------- |
| `GET`   | `/v1.1/recovery/status/{safeAddress}` | Statut récupération (v1.1) |

### Privacy

| Méthode | Endpoint                                            | Description         |
| ------- | --------------------------------------------------- | ------------------- |
| `GET`   | `/v1/privacy/users/{externalUserId}/data`           | Données privées     |
| `PUT`   | `/v1/privacy/users/{externalUserId}/data`           | Sauvegarder données |
| `POST`  | `/v1/privacy/users/{externalUserId}/email/validate` | Valider email       |
| `POST`  | `/v1/privacy/users/{externalUserId}/email/confirm`  | Confirmer email     |

---

## 💡 Exemples d'Utilisation

### 1. Initialisation

```typescript
import { IbexProvider, useIbex } from '@absconse/ibex-sdk'

function App() {
  return (
    <IbexProvider
      config={{
        baseURL: 'https://api.ibex.fi',
        domain: 'myapp.com',
      }}
    >
      <Dashboard />
    </IbexProvider>
  )
}
```

### 2. Authentification

```typescript
function Dashboard() {
  const { signIn, signUp, user, wallet, sdk } = useIbex()

  // Inscription
  const handleSignUp = async () => {
    await signUp({
      keyName: 'My Passkey',
      keyDisplayName: 'My Device',
      chainIds: [100], // Gnosis Chain
    })
  }

  // Connexion avec options
  const handleSignIn = async () => {
    await signIn({
      includeBalance: true,
      includeTransactions: true,
      includeUserdata: true,
    })
  }

  return (
    <div>
      {user ? <p>Connecté: {user.email}</p> : <button onClick={handleSignUp}>S'inscrire</button>}
    </div>
  )
}
```

### 3. Transfer Token

```typescript
const { sdk } = useIbex()

// Transfert ERC20
await sdk.transferToken({
  safeAddress: '0x...',
  chainId: 100,
  tokenAddress: '0x...', // Adresse token ERC20
  to: '0x...',
  amount: '100',
})

// Attendre confirmation
const status = await sdk.waitForOperation(userOpHash, {
  pollInterval: 2000,
  timeout: 60000,
})
```

### 4. AAVE Operations

```typescript
// Dépôt dans pool AAVE
await sdk.aaveSupply({
  safeAddress: '0x...',
  chainId: 100,
  amount: '1000',
  assetTicker: 'EURe', // ou tokenAddress + decimals
})

// Retrait de pool AAVE
await sdk.aaveWithdraw({
  safeAddress: '0x...',
  chainId: 100,
  amount: '500',
  assetTicker: 'EURe',
})
```

### 5. Swap

```typescript
// 1. Obtenir quote
const quote = await sdk.getSwapQuote({
  fromToken: '0x...',
  toToken: '0x...',
  amount: '100',
  blockchainId: 100,
})

// 2. Exécuter swap
await sdk.swapFromQuote({
  safeAddress: '0x...',
  chainId: 100,
  quoteId: quote.quoteId,
})
```

### 6. Batch Operations

```typescript
// Préparer batch
const batch = await sdk.prepareBatch({
  safeAddress: '0x...',
  chainId: 100,
  operations: [
    {
      type: 'TRANSFER_TOKEN',
      tokenAddress: '0x...',
      to: '0x...',
      amount: '100'
    },
    {
      type: 'AAVE_SUPPLY',
      amount: '500',
      assetTicker: 'EURe'
    },
    {
      type: 'SWAP_FROM_QUOTE',
      quoteId: 'quote-123'
    }
  ]
})

// Exécuter batch (une seule signature WebAuthn)
await sdk.executeBatch({
  batchId: batch.batchId,
  challenge: batch.challenge,
  credential: await navigator.credentials.get({...})
})

// Suivre le statut
const status = await sdk.getBatchStatus(batch.batchId)
```

### 7. Pools & Balances

```typescript
// Lister pools actifs
const pools = await sdk.getPools(100) // Gnosis Chain

// Balances dans pools
const poolBalances = await sdk.getPoolBalances({
  address: '0x...',
  blockchainId: 100,
  includeZero: false,
})

// Balances ERC20
const balances = await sdk.getBalances({
  address: '0x...',
  blockchainId: 100,
})
```

### 8. Recovery

```typescript
// Activer récupération
await sdk.enableRecovery({
  safeAddress: '0x...',
  chainId: 100,
  firstName: 'John',
  lastName: 'Doe',
  birthDate: '1990-01-01',
  birthCity: 'Paris',
  birthCountry: 'FR',
  recoveryAddress: '0x...',
})

// Statut récupération (v1.1)
const status = await sdk.getRecoveryStatus('0x...')
console.log(status.pending) // Opérations en attente
console.log(status.executed) // Opérations exécutées
```

### 9. WebSocket (Temps Réel)

```typescript
const { balance, transactions, operations, isConnected } = useIbex()

// Le hook gère automatiquement WebSocket
// Les données sont mises à jour en temps réel via:
// - balance_update
// - new_transaction
// - operation_update
```

---

## 🔄 Flux Complet d'une Application

```
1. INITIALISATION
   └─► IbexProvider → useIbex() → IbexClient

2. AUTHENTIFICATION
   └─► signUp() → WebAuthn → JWT → État React

3. CHARGEMENT DONNÉES
   └─► getUserDetails() → getUserOperations() → getBalances()

4. WEBSOCKET
   └─► Connexion automatique → Updates temps réel

5. OPÉRATIONS
   └─► transferToken() → Intent → WebAuthn → Execute → Polling

6. MISE À JOUR
   └─► WebSocket events → État React mis à jour
```

---

## 📊 Diagramme de Séquence (Transfer Token)

```
User          useIbex        SafeService    HttpClient    IBEX API
 │               │                │              │            │
 │─transferToken─►                │              │            │
 │               │                │              │            │
 │               ├─transferToken─►              │            │
 │               │                │              │            │
 │               │                ├─POST /intent─►            │
 │               │                │              │            │
 │               │                │              ├─POST──────►
 │               │                │              │            │
 │               │                │              ◄─Response───┤
 │               │                │              │            │
 │               │                ◄─challenge────┤            │
 │               │                │              │            │
 │               │                │              │            │
 │               ├─WebAuthn───────►              │            │
 │               │                │              │            │
 │               │                │              │            │
 │               ◄─credential─────┤              │            │
 │               │                │              │            │
 │               ├─execute────────►              │            │
 │               │                │              │            │
 │               │                ├─POST /execute─►           │
 │               │                │              │            │
 │               │                │              ├─POST──────►
 │               │                │              │            │
 │               │                │              ◄─Response───┤
 │               │                │              │            │
 │               │                ◄─userOpHash───┤            │
 │               │                │              │            │
 │               ◄─userOpHash─────┤              │            │
 │               │                │              │            │
 │               │                │              │            │
 │               ├─waitForOperation──────────────►           │
 │               │                │              │            │
 │               │                ├─GET /status─►            │
 │               │                │              │            │
 │               │                │              ├─GET───────►
 │               │                │              │            │
 │               │                │              ◄─status─────┤
 │               │                │              │            │
 │               │                ◄─CONFIRMED───┤            │
 │               │                │              │            │
 │               ◄─CONFIRMED──────┤              │            │
 │               │                │              │            │
```

---

## 🎨 Points Clés de l'Architecture

### ✅ Avantages

1. **Modularité**: Services séparés par domaine fonctionnel
2. **Type Safety**: TypeScript strict avec types complets
3. **Cache Intelligent**: Multi-niveaux avec TTL automatique
4. **Temps Réel**: WebSocket intégré pour updates automatiques
5. **Retry Logic**: Exponential backoff pour résilience
6. **WebAuthn**: Authentification moderne sans mot de passe
7. **Batch Operations**: Exécution groupée optimisée
8. **OpenAPI v1.1**: Conforme à la dernière spécification

### 🔧 Extensibilité

- **Nouveaux Services**: Ajouter dans `src/features/`
- **Nouveaux Types**: Définir dans `*.types.ts`
- **Interceptors**: Personnaliser via `HttpClient`
- **Cache Strategy**: Configurable par type de données

---

## 📚 Ressources

- **OpenAPI Spec**: `openapi.json`
- **Documentation API**: https://docs.ibex.fi
- **Safe Global**: https://safe.global
- **ERC-4337**: https://eips.ethereum.org/EIPS/eip-4337
- **WebAuthn**: https://webauthn.guide

---

**Dernière mise à jour:** 2025-01-15  
**Version SDK:** OpenAPI v1.1
