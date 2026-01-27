// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module Safe - OpenAPI v1.1
 *
 * @module features/safe/types
 */

// ============================================================================
// OPERATION TYPES
// ============================================================================

/**
 * Types d'opérations Safe supportés
 */
export type SafeOperationType =
  | 'TRANSFER_EURe' // @deprecated v2.1 - Sera supprimé en v3.0. Utiliser TRANSFER_TOKEN avec l'adresse EURe
  | 'TRANSFER_TOKEN' // Transfert générique ERC20
  | 'MONERIUM_CREATE_IBAN'
  | 'MONERIUM_WITHDRAW_EURe'
  | 'SIGN_MESSAGE'
  | 'ENABLE_RECOVERY'
  | 'CANCEL_RECOVERY'
  | 'AAVE_SUPPLY' // Dépôt dans pool AAVE
  | 'AAVE_WITHDRAW' // Retrait de pool AAVE
  | 'SWAP_FROM_QUOTE' // Exécution de swap depuis quote

/**
 * Informations du destinataire pour retrait
 */
export interface RecipientInfo {
  firstName: string
  lastName: string
  country: string
}

/**
 * Input d'opération Safe - Union discriminée par type
 */
export type SafeOperationInput =
  | TransferEureOperation
  | TransferTokenOperation
  | MoneriumCreateIbanOperation
  | MoneriumWithdrawOperation
  | SignMessageOperation
  | EnableRecoveryOperation
  | CancelRecoveryOperation
  | AaveSupplyOperation
  | AaveWithdrawOperation
  | SwapFromQuoteOperation

/**
 * @deprecated Déprécié depuis v2.1, sera supprimé en v3.0
 * 
 * Utiliser TransferTokenOperation avec l'adresse EURe à la place.
 * 
 * Migration:
 * ```typescript
 * // Avant (deprecated)
 * { type: 'TRANSFER_EURe', to: '0x...', amount: '10' }
 * 
 * // Après
 * { type: 'TRANSFER_TOKEN', tokenAddress: '<EURe_ADDRESS>', to: '0x...', amount: '10' }
 * ```
 */
export interface TransferEureOperation {
  type: 'TRANSFER_EURe'
  to: string
  amount: string
}

/**
 * Transfert générique de token ERC20
 */
export interface TransferTokenOperation {
  type: 'TRANSFER_TOKEN'
  tokenAddress: string
  to: string
  amount: string
}

/**
 * Création d'IBAN Monerium
 */
export interface MoneriumCreateIbanOperation {
  type: 'MONERIUM_CREATE_IBAN'
}

/**
 * Retrait vers IBAN via Monerium
 */
export interface MoneriumWithdrawOperation {
  type: 'MONERIUM_WITHDRAW_EURe'
  to: string
  amount: string
  label: string
  recipientInfo: RecipientInfo
}

/**
 * Signature de message
 */
export interface SignMessageOperation {
  type: 'SIGN_MESSAGE'
  message: string
}

/**
 * Activation de la récupération
 */
export interface EnableRecoveryOperation {
  type: 'ENABLE_RECOVERY'
  firstName: string
  lastName: string
  birthDate: string
  birthCity: string
  birthCountry: string
}

/**
 * Annulation de la récupération
 */
export interface CancelRecoveryOperation {
  type: 'CANCEL_RECOVERY'
}

/**
 * Dépôt dans pool AAVE
 */
export interface AaveSupplyOperation {
  type: 'AAVE_SUPPLY'
  amount: string
  assetTicker?: string
  tokenAddress?: string
  decimals?: number
  referralCode?: number
  poolAddress?: string
}

/**
 * Retrait de pool AAVE
 */
export interface AaveWithdrawOperation {
  type: 'AAVE_WITHDRAW'
  amount: string
  assetTicker?: string
  tokenAddress?: string
  decimals?: number
  poolAddress?: string
}

/**
 * Exécution de swap depuis quote
 */
export interface SwapFromQuoteOperation {
  type: 'SWAP_FROM_QUOTE'
  quoteId: string
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Requête d'opération Safe
 */
export interface SafeOperationRequest {
  safeAddress: string
  chainId?: number
  signerId?: string
  operations: SafeOperationInput[]
}

/**
 * Réponse de préparation d'opération Safe
 */
export interface SafeOperationResponse {
  batchId?: string
  expiresAt?: string
  credentialRequestOptions: {
    rpId: string
    challenge: string
    timeout: number
    allowCredentials: Array<{
      id: string
      type: 'public-key'
    }>
    userVerification: 'preferred' | 'required' | 'discouraged'
    extensions?: Record<string, unknown>
    data?: {
      userOpHash: string
    }
  }
}

/**
 * Réponse d'exécution d'opération
 */
export interface SafeOperationExecuteResponse {
  userOpHash: string
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Options pour les opérations batch
 */
export interface BatchOptions {
  atomic?: boolean
  autoApprove?: boolean
  ttlSec?: number
  reorder?: boolean
}

/**
 * Requête de préparation de batch
 */
export interface BatchIntentRequest {
  safeAddress: string
  chainId?: number
  idempotencyKey?: string
  options?: BatchOptions
  operations: SafeOperationInput[]
}

/**
 * Réponse de préparation de batch
 */
export interface BatchIntentResponse {
  batchId: string
  expiresAt: string
  credentialRequestOptions: SafeOperationResponse['credentialRequestOptions']
}

/**
 * Requête d'exécution de batch
 */
export interface BatchExecuteRequest {
  batchId: string
  credential: unknown
}

/**
 * Statut d'une opération dans un batch
 */
export type BatchOperationStatus =
  | 'PENDING'
  | 'SIGNED'
  | 'EXECUTED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED'

/**
 * Information sur une opération dans un batch
 */
export interface BatchOperationInfo {
  index: number
  type: SafeOperationType | string
}

/**
 * Réponse du statut d'un batch
 */
export interface BatchStatusResponse {
  batchId: string
  safeAddress: string | null
  chainId: number | null
  status: BatchOperationStatus
  userOpHash?: string
  expiresAt: string | null
  operations: BatchOperationInfo[]
}

// ============================================================================
// OPERATION STATUS
// ============================================================================

/**
 * Statut d'une opération individuelle
 */
export type OperationStatus = 'CREATED' | 'SIGNED' | 'EXECUTED' | 'CONFIRMED' | 'FAILED'

/**
 * Réponse du statut d'une opération par userOpHash
 */
export interface OperationStatusResponse {
  userOpHash: string
  safeAddress: string
  chainId: number
  status: OperationStatus
  transactionHash: string | null
  createdAt: string
  updatedAt: string
  operations: BatchOperationInfo[]
  error?: Record<string, unknown> | null
}

// ============================================================================
// PARAMETER TYPES
// ============================================================================

/**
 * @deprecated Déprécié depuis v2.1, sera supprimé en v3.0
 * 
 * Utiliser TransferTokenParams à la place.
 * 
 * Migration:
 * ```typescript
 * // Avant (deprecated)
 * await sdk.transfer({ safeAddress, to, amount })
 * 
 * // Après
 * await sdk.transferToken({ safeAddress, tokenAddress: '<EURe_ADDRESS>', to, amount })
 * ```
 */
export interface TransferParams {
  safeAddress: string
  chainId?: number
  to: string
  amount: number | string
}

/**
 * Paramètres pour transfert de token
 */
export interface TransferTokenParams {
  safeAddress: string
  chainId?: number
  tokenAddress: string
  to: string
  amount: string
}

/**
 * Paramètres pour retrait vers IBAN
 */
export interface WithdrawParams {
  safeAddress: string
  chainId?: number
  iban: string
  amount: number | string
  label?: string
  recipientInfo: RecipientInfo
}

/**
 * Paramètres pour signature de message
 */
export interface SignMessageParams {
  safeAddress: string
  chainId?: number
  message: string
}

/**
 * Paramètres pour activation de récupération
 */
export interface EnableRecoveryParams {
  safeAddress: string
  chainId?: number
  firstName: string
  lastName: string
  birthDate: string
  birthCity: string
  birthCountry: string
}

/**
 * Paramètres pour dépôt AAVE
 */
export interface AaveSupplyParams {
  safeAddress: string
  chainId?: number
  amount: string
  assetTicker?: string
  tokenAddress?: string
  decimals?: number
  referralCode?: number
  poolAddress?: string
}

/**
 * Paramètres pour retrait AAVE
 */
export interface AaveWithdrawParams {
  safeAddress: string
  chainId?: number
  amount: string
  assetTicker?: string
  tokenAddress?: string
  decimals?: number
  poolAddress?: string
}

/**
 * Paramètres pour swap depuis quote
 */
export interface SwapFromQuoteParams {
  safeAddress: string
  chainId?: number
  quoteId: string
}
