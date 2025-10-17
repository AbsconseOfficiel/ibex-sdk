// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Types TypeScript unifiés pour le SDK IBEX
 * Conformes au Swagger IBEX
 */

// Types WebAuthn - utilisation des types DOM existants

// ============================================================================
// TYPES DE BASE SIMPLIFIÉS
// ============================================================================

/**
 * Utilisateur IBEX avec données essentielles
 */
export interface User {
  id: string
  email: string | null // null si KYC non fait
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
 * Opération utilisateur
 */
export interface Operation {
  id: string
  type:
    | 'TRANSFER'
    | 'WITHDRAW'
    | 'KYC'
    | 'IBAN_CREATE'
    | 'SIGN_MESSAGE'
    | 'ENABLE_RECOVERY'
    | 'CANCEL_RECOVERY'
  status: 'pending' | 'completed' | 'failed' | 'executed'
  amount?: number
  createdAt: string
  safeOperation?: {
    userOpHash?: string
    status?: string
  }
}

/**
 * Balance utilisateur
 */
export interface Balance {
  amount: number
  symbol: string
  usdValue?: number
}

/**
 * Réponse des adresses de portefeuille
 */
export interface WalletAddressesResponse {
  addresses: string[]
  defaultAddress: string
}

/**
 * Réponse des chain IDs supportés
 */
export interface SupportedChainIdsResponse {
  chainIds: number[]
  defaultChainId: number
}

/**
 * Réponse des opérations utilisateur
 */
export interface UserOperationsResponse {
  operations: Operation[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

/**
 * Réponse des transactions
 */
export interface TransactionsResponse {
  transactions: Transaction[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

/**
 * Réponse des détails utilisateur
 */
export interface UserDetailsResponse {
  user: User
}

/**
 * Réponse des détails de transaction
 */
export interface TransactionDetailsResponse {
  transaction: Transaction
}

/**
 * Réponse des détails d'opération
 */
export interface OperationDetailsResponse {
  operation: Operation
  usdValue?: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration IBEX simplifiée
 */
export interface IbexConfig {
  baseURL: string
  domain: string
  rpId?: string // Auto-déduit du domain si non fourni
  defaultChainId?: number
  timeout?: number
  retries?: number
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  issuer?: string
  audience?: string
  subject?: string
  roles?: string[]
  keyName?: string
  keyDisplayName?: string
  userOpHash?: string
  transactionHash?: string
}

/**
 * Détails utilisateur depuis /v1/users/me
 * Conforme au schéma OpenAPI
 */
export interface UserDetails {
  id: string
  ky: string // Statut KYC (0-5)
  signers: Array<{
    id: string
    safes: Array<{
      address: string
      threshold: number
      iban?: {
        chainId: number
        iban?: string
        bic?: string
      }
    }>
  }>
}

/**
 * Réponse des balances
 */
export interface BalanceResponse {
  balance: string
  tokens?: unknown[]
  totalValueUsd?: number
  lastUpdated?: string
}

/**
 * Réponse des transactions
 */
export interface TransactionResponse {
  data: unknown[]
  pagination?: unknown
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
// SAFE OPERATIONS
// ============================================================================

/**
 * Requête d'opération Safe
 */
export interface SafeOperationRequest {
  safeAddress: string
  chainId: number
  operations: SafeOperationInput[]
}

/**
 * Réponse de préparation d'opération Safe
 */
export interface SafeOperationResponse {
  credentialRequestOptions: WebAuthnOptions
  operationId?: string
}

/**
 * Input d'opération Safe
 */
export interface SafeOperationInput {
  type:
    | 'TRANSFER_EURe'
    | 'MONERIUM_CREATE_IBAN'
    | 'MONERIUM_WITHDRAW_EURe'
    | 'SIGN_MESSAGE'
    | 'ENABLE_RECOVERY'
    | 'CANCEL_RECOVERY'
  to?: string
  amount?: string
  iban?: string
  label?: string
  recipientInfo?: RecipientInfo
  message?: string
  firstName?: string
  lastName?: string
  birthDate?: string
  birthCity?: string
  birthCountry?: string
}

/**
 * Informations du destinataire
 */
export interface RecipientInfo {
  firstName: string
  lastName: string
  country: string
}

// ============================================================================
// KYC
// ============================================================================

/**
 * Réponse KYC iframe
 */
export interface KycResponse {
  chatbotURL: string
  sessionId: string
}

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
// IBEX SAFE
// ============================================================================

/**
 * Données utilisateur privées
 */
export interface UserPrivateData {
  [key: string]: unknown
}

/**
 * Réponse de sauvegarde des données
 */
export interface SaveUserDataResponse {
  success: boolean
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
// OPTIONS ET CONFIGURATION
// ============================================================================

/**
 * Options pour les requêtes de transactions
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
 * Options pour les requêtes de balances
 */
export interface BalanceOptions {
  address?: string
  tokens?: string[]
}

// ============================================================================
// TYPES MANQUANTS POUR L'INDEX
// ============================================================================

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

/**
 * Réponse iframe KYC
 */
export interface IframeResponse {
  chatbotURL: string
  sessionId: string
}

/**
 * Réponse des chain IDs
 */
export interface ChainIdsResponse {
  defaultChainId: number
  supportedChainIds: number[]
}

/**
 * Informations de portefeuille
 */
export interface WalletInfo {
  address: string
  chainId: number
  isPrimary: boolean
}

/**
 * Réponse historique des transactions
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

/**
 * Paramètres de transfert
 */
export interface TransferParams {
  to: string
  amount: string
  safeAddress: string
  chainId: number
}

/**
 * Paramètres de retrait
 */
export interface WithdrawParams {
  to: string
  amount: string
  label: string
  recipientInfo: {
    firstName: string
    lastName: string
    country: string
  }
  safeAddress: string
  chainId: number
}

/**
 * Paramètres de signature de message
 */
export interface SignMessageParams {
  message: string
  safeAddress: string
  chainId: number
}

/**
 * Paramètres d'activation de récupération
 */
export interface EnableRecoveryParams {
  firstName: string
  lastName: string
  birthDate: string
  birthCity: string
  birthCountry: string
  safeAddress: string
  chainId: number
}

/**
 * Réponse du statut de récupération
 */
export interface RecoveryStatusResponse {
  recoveryEnabled: boolean
  safeAddress: string
  pendingRecovery: boolean
  canExecute: boolean
  recoveryAddress?: string
  delay?: number
  executeAfter?: string
}

/**
 * Réponse de validation d'email
 */
export interface ValidateEmailResponse {
  success: boolean
  message?: string
}

/**
 * Paramètres de confirmation d'email
 */
export interface ConfirmEmailParams {
  email: string
  code: string
  externalUserId: string
  userDataName?: string
  optinNews?: boolean
  optinNotifications?: boolean
}

/**
 * Réponse des balances
 */
export interface BalancesResponse {
  balances: Balance[]
  total: number
}

/**
 * Paramètres de transactions
 */
export interface TransactionsParams {
  address?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
}

// ============================================================================
// TYPES LEGACY (pour compatibilité)
// ============================================================================

/**
 * @deprecated Utilisez User à la place
 */
export interface UserDetailsLegacy extends User {}

/**
 * @deprecated Utilisez Transaction[] à la place
 */
export interface TransactionResponseLegacy {
  data: unknown[]
  pagination?: unknown
}

/**
 * @deprecated Utilisez Operation[] à la place
 */
export interface SafeOperation {
  id: string
  type: string
  status: string
  createdAt: string
  data?: unknown
}
