// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Types TypeScript unifiés pour le SDK IBEX - OpenAPI v1.1
 * Conformes au Swagger IBEX
 */

// ============================================================================
// RE-EXPORTS FROM FEATURE MODULES
// ============================================================================

// Auth types
export type {
  AuthResponse,
  IframeResponse,
  SignInOptions,
  SignUpOptions,
  RegistrationCredentialOptions,
  AuthenticationCredentialOptions,
  SignUpChallengeResponse,
  SignInChallengeResponse,
} from '../features/auth'

// Safe types
export type {
  SafeOperationType,
  SafeOperationInput,
  TransferEureOperation,
  TransferTokenOperation,
  MoneriumCreateIbanOperation,
  MoneriumWithdrawOperation,
  SignMessageOperation,
  EnableRecoveryOperation,
  CancelRecoveryOperation,
  AaveSupplyOperation,
  AaveWithdrawOperation,
  SwapFromQuoteOperation,
  RecipientInfo,
  SafeOperationRequest,
  SafeOperationResponse,
  SafeOperationExecuteResponse,
  BatchOptions,
  BatchIntentRequest,
  BatchIntentResponse,
  BatchExecuteRequest,
  BatchOperationStatus,
  BatchOperationInfo,
  BatchStatusResponse,
  OperationStatus,
  OperationStatusResponse,
  TransferParams,
  TransferTokenParams,
  WithdrawParams,
  SignMessageParams,
  EnableRecoveryParams,
  AaveSupplyParams,
  AaveWithdrawParams,
  SwapFromQuoteParams,
} from '../features/safe'

// User types
export type {
  SafeIbanInfo,
  SafeInfo,
  SignerInfo,
  UserDetailsResponse,
  ChainIdsResponse,
  WalletInfo,
  WalletAddressesResponse,
  SafeOperationDetails,
  UserOperation,
  UserOperationsResponse,
} from '../features/users'

// Recovery types
export type {
  RecoveryOperation,
  RecoveryStatusResponse,
  RecoveryResponse,
} from '../features/recovery'

// Blockchain types
export type {
  TokenInfo,
  TokenBalance,
  BalancesResponse,
  BalancesParams,
  BCReaderTransaction,
  TransactionsResponse,
  TransactionsParams,
  PoolMetadata,
  WatchedPool,
  PoolsResponse,
  PoolBalance,
  PoolBalancesResponse,
  PoolBalancesParams,
  SwapProvider,
  SwapQuoteParams,
  SwapQuoteResponse,
} from '../features/blockchain'

// Privacy types
export type {
  UserPrivateData,
  SaveUserDataResponse,
  ValidateEmailResponse,
  ConfirmEmailParams,
} from '../features/privacy'

// Bitcoin types
export type {
  BitcoinNetwork,
  BitcoinFeeProfile,
  BitcoinNetworkInfo,
  BitcoinFeeRates,
  BitcoinUTXO,
  BitcoinUtxosResponse,
  BitcoinPsbtInput,
  BitcoinPsbtOutput,
  BitcoinBuildPsbtParams,
  BitcoinBuildPsbtResponse,
  BitcoinBroadcastParams,
  BitcoinBroadcastResponse,
  BitcoinSendPrepareParams,
  SelectedUTXO,
  BitcoinSendPrepareResponse,
} from '../features/bitcoin'

// ============================================================================
// TYPES DE BASE SIMPLIFIÉS
// ============================================================================

/**
 * Utilisateur IBEX avec données essentielles
 */
export interface User {
  id: string
  email: string | null
  kyc: {
    status:
      | 'not_started'
      | 'in_progress'
      | 'dossier_sent'
      | 'missing_document'
      | 'rejected'
      | 'verified'
    level: number
    updatedAt?: string
  }
  iban?: {
    status: 'pending' | 'verified' | 'rejected'
    iban?: string
    bic?: string
    updatedAt?: string
  }
}

/**
 * Portefeuille utilisateur
 */
export interface Wallet {
  address: string
  isConnected: boolean
  chainId: number
}

/**
 * Transaction simplifiée
 */
export interface Transaction {
  id: string
  amount: number
  type: 'IN' | 'OUT'
  status: 'confirmed' | 'pending' | 'failed'
  date: string
  hash: string
  from: string
  to: string
}

/**
 * Opération simplifiée
 */
export interface Operation {
  id: string
  type:
    | 'TRANSFER'
    | 'TRANSFER_TOKEN'
    | 'WITHDRAW'
    | 'KYC'
    | 'IBAN_CREATE'
    | 'SIGN_MESSAGE'
    | 'ENABLE_RECOVERY'
    | 'CANCEL_RECOVERY'
    | 'AAVE_SUPPLY'
    | 'AAVE_WITHDRAW'
    | 'SWAP'
  status: 'pending' | 'completed' | 'failed' | 'executed' | 'confirmed'
  amount?: number
  createdAt: string
  safeOperation?: {
    userOpHash?: string
    status?: string
  }
}

/**
 * Balance simplifiée
 */
export interface Balance {
  amount: number
  symbol: string
  usdValue?: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration IBEX
 */
export interface IbexConfig {
  baseURL: string
  domain: string
  rpId?: string
  defaultChainId?: number
  timeout?: number
  retries?: number
}

/**
 * Configuration du cache
 */
export interface CacheConfig {
  enableMemoryCache?: boolean
  enableSessionStorage?: boolean
  enablePersistentStorage?: boolean
  defaultTTL?: number
  maxSize?: number
}

/**
 * Configuration WebSocket
 */
export interface WebSocketConfig {
  url?: string
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
}

// ============================================================================
// WEBAUTHN
// ============================================================================

/**
 * Options WebAuthn
 */
export interface WebAuthnOptions {
  challenge: ArrayBuffer
  rpId: string
  allowCredentials?: Array<{
    type: 'public-key'
    id: ArrayBuffer
    transports?: string[]
  }>
  userVerification?: 'required' | 'preferred' | 'discouraged'
  timeout?: number
  hints?: string[]
  attestation?: 'none' | 'indirect' | 'direct'
  extensions?: unknown
  rp?: {
    id: string
    name: string
  }
  user?: {
    id: ArrayBuffer
    name: string
    displayName: string
  }
  pubKeyCredParams?: Array<{
    type: string
    alg: number
  }>
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform'
    userVerification?: 'required' | 'preferred' | 'discouraged'
    residentKey?: 'discouraged' | 'preferred' | 'required'
  }
}

// ============================================================================
// KYC
// ============================================================================

/**
 * Statut KYC
 */
export type KycStatus =
  | 'not_started'
  | 'in_progress'
  | 'dossier_sent'
  | 'missing_document'
  | 'rejected'
  | 'verified'

/**
 * Informations du statut KYC
 */
export interface KycStatusInfo {
  status: KycStatus
  label: string
  description?: string
  requiredActions?: string[]
  updatedAt?: string
}

// ============================================================================
// ERREURS
// ============================================================================

/**
 * Erreur API structurée
 */
export interface ApiError {
  code: string
  message: string
  details?: unknown
  timestamp?: string
}

/**
 * Réponse API générique
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

// ============================================================================
// OPTIONS ET UTILITAIRES
// ============================================================================

/**
 * Options pour les requêtes de transactions (simplifié)
 */
export interface TransactionOptions {
  address?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
  type?: string
  status?: string
}

/**
 * Options pour les requêtes de balances (simplifié)
 */
export interface BalanceOptions {
  address?: string
  tokens?: string[]
}

/**
 * Réponse historique des transactions (simplifié)
 */
export interface TransactionsHistoryResponse {
  data: Transaction[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

/**
 * Réponse des balances de transactions
 */
export interface TransactionsBalancesResponse {
  balances: Balance[]
  total: number
}

/**
 * Options pour les transactions
 */
export interface TransactionsOptions {
  address?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
}
