// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module blockchain - OpenAPI v1.1
 *
 * @module features/blockchain/types
 */

// ============================================================================
// TOKEN TYPES
// ============================================================================

/**
 * Information d'un token
 */
export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
}

/**
 * Balance d'un token
 */
export interface TokenBalance {
  address: string
  balance: string
}

// ============================================================================
// BALANCES
// ============================================================================

/**
 * Réponse des balances depuis BCReader /v1/bcreader/balances
 */
export interface BalancesResponse {
  timestamp: string
  balances: Record<string, TokenBalance>
}

/**
 * Paramètres pour récupérer les balances
 */
export interface BalancesParams {
  address?: string
  blockchainId?: number
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * Transaction BCReader
 */
export interface BCReaderTransaction {
  transactionHash: string
  from: string
  to: string
  watchedAddress: string
  direction: 'IN' | 'OUT'
  tokenAddress: string
  tokenType: string
  tokenSymbol: string
  tokenName: string
  tokenDecimals: number
  valueFormatted: string
  timestamp: string
}

/**
 * Réponse des transactions depuis BCReader /v1/bcreader/transactions
 */
export interface TransactionsResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  data: BCReaderTransaction[]
}

/**
 * Paramètres pour récupérer les transactions
 */
export interface TransactionsParams {
  address?: string
  blockchainId?: number
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
  offset?: number
}

// ============================================================================
// POOLS (AAVE)
// ============================================================================

/**
 * Métadonnées d'un pool
 */
export interface PoolMetadata {
  network: string
  version: string
}

/**
 * Pool surveillé (WatchedPool) depuis BCReader /v1.1/bcreader/pools
 */
export interface WatchedPool {
  id: number
  blockchainId: string
  provider: 'AAVE' | string
  poolAddress: string
  addressesProvider: string
  metadata: PoolMetadata
  active: boolean
  supplyToken: TokenInfo
  borrowToken: TokenInfo
  poolToken: TokenInfo
}

/**
 * Réponse de la liste des pools
 */
export interface PoolsResponse {
  pools: WatchedPool[]
}

/**
 * Balance d'un pool pour un utilisateur
 */
export interface PoolBalance {
  tokenAddress: string
  symbol: string
  decimals: number
  baseBalance: string
  currentBalance: string
  gain: string
  gainPct: string
  method: string
  apr: string
  apy: string
}

/**
 * Réponse des balances de pools depuis BCReader /v1.1/bcreader/pools/:address
 */
export interface PoolBalancesResponse {
  timestamp: string
  blockchainId: string
  address: string
  pools: PoolBalance[]
}

/**
 * Paramètres pour récupérer les balances de pools
 */
export interface PoolBalancesParams {
  address: string
  blockchainId?: number
  includeZero?: boolean
}

// ============================================================================
// SWAP
// ============================================================================

/**
 * Fournisseur de swap
 */
export type SwapProvider = 'COWSWAP' | '1INCH' | 'BOTH'

/**
 * Paramètres pour obtenir une quote de swap
 */
export interface SwapQuoteParams {
  sellTokenAddress: string
  buyTokenAddress: string
  amount: string
  chainId?: number
  safeAddress?: string
  provider?: SwapProvider
}

/**
 * Réponse de quote de swap
 */
export interface SwapQuoteResponse {
  quoteId: string
  provider: SwapProvider
  sellToken: TokenInfo
  buyToken: TokenInfo
  sellAmount: string
  buyAmount: string
  exchangeRate: string
  estimatedGas?: string
  expiresAt: string
}

// ============================================================================
// LEGACY TYPES (pour compatibilité)
// ============================================================================

/**
 * @deprecated Déprécié depuis v2.0, sera supprimé en v3.0
 * 
 * Utiliser BalancesResponse à la place.
 * Le format de réponse a changé pour correspondre à l'API BCReader v1.1.
 */
export interface LegacyBalancesResponse {
  balance: string
  tokens?: unknown[]
  totalValueUsd?: number
  lastUpdated?: string
}

/**
 * @deprecated Déprécié depuis v2.0, sera supprimé en v3.0
 * 
 * Utiliser TransactionsResponse à la place.
 * Le format de réponse a changé pour correspondre à l'API BCReader v1.1.
 */
export interface LegacyTransactionsResponse {
  data: unknown[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}
