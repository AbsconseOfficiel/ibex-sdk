// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de lecture blockchain (BCReader) - OpenAPI v1.1
 *
 * @module features/blockchain
 */

import type { HttpClient } from '../../core/http'
import type {
  BalancesResponse,
  BalancesParams,
  TransactionsResponse,
  TransactionsParams,
  PoolsResponse,
  PoolBalancesResponse,
  PoolBalancesParams,
  WatchedPool,
  SwapQuoteParams,
  SwapQuoteResponse,
} from './blockchain.types'

/**
 * Service de lecture de la blockchain
 */
export class BlockchainService {
  constructor(private http: HttpClient) {}

  // ============================================================================
  // BALANCES
  // ============================================================================

  /**
   * Récupère les balances d'une adresse
   *
   * @param params - Paramètres (address optionnel, blockchainId optionnel)
   * @returns Balances détaillées
   *
   * @example
   * ```typescript
   * // Balance de l'utilisateur courant
   * const balances = await blockchainService.getBalances();
   *
   * // Balance d'une adresse spécifique
   * const balances = await blockchainService.getBalances({
   *   address: '0x...',
   *   blockchainId: 100
   * });
   * ```
   */
  async getBalances(params: BalancesParams = {}): Promise<BalancesResponse> {
    const { address, blockchainId } = params
    const queryParams: Record<string, unknown> = {}
    const headers: Record<string, string> = {}

    if (address) queryParams.address = address
    if (blockchainId) headers['X-Blockchain-Id'] = blockchainId.toString()

    return this.http.request<BalancesResponse>('/v1/bcreader/balances', {
      method: 'GET',
      queryParams,
      headers,
      cache: true,
      cacheTTL: 10000, // 10 secondes
    })
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Récupère l'historique des transactions
   *
   * @param params - Paramètres de filtrage
   * @returns Historique des transactions paginé
   *
   * @example
   * ```typescript
   * const transactions = await blockchainService.getTransactions({
   *   address: '0x...',
   *   startDate: '2025-01-01',
   *   endDate: '2025-12-31',
   *   limit: 50,
   *   page: 1
   * });
   * ```
   */
  async getTransactions(params: TransactionsParams = {}): Promise<TransactionsResponse> {
    const { address, blockchainId, startDate, endDate, limit = 50, page = 1, offset } = params

    const queryParams: Record<string, unknown> = {
      limit: Math.min(limit, 100),
    }

    // Support both page and offset pagination
    if (offset !== undefined) {
      queryParams.offset = offset
    } else {
      queryParams.page = Math.max(page, 1)
    }

    if (address) queryParams.address = address
    if (startDate) queryParams.startDate = startDate
    if (endDate) queryParams.endDate = endDate

    const headers: Record<string, string> = {}
    if (blockchainId) headers['X-Blockchain-Id'] = blockchainId.toString()

    return this.http.request<TransactionsResponse>('/v1/bcreader/transactions', {
      method: 'GET',
      queryParams,
      headers,
      cache: true,
      cacheTTL: 30000, // 30 secondes
    })
  }

  // ============================================================================
  // POOLS (AAVE)
  // ============================================================================

  /**
   * Récupère la liste des pools actifs pour une blockchain
   *
   * **Note**: Cet endpoint utilise `/v1.1/bcreader/pools` qui n'est pas documenté dans l'OpenAPI.
   * L'OpenAPI documente uniquement `/v1/bcreader/{verb}`. Si l'API backend utilise `/v1/bcreader/pools`,
   * l'OpenAPI devrait être mis à jour. À vérifier avec l'équipe backend.
   *
   * @param blockchainId - ID de la blockchain
   * @returns Liste des pools actifs
   *
   * @example
   * ```typescript
   * const pools = await blockchainService.getPools(100); // Gnosis
   * pools.pools.forEach(pool => {
   *   console.log(`${pool.provider}: ${pool.supplyToken.symbol}`);
   * });
   * ```
   */
  async getPools(blockchainId: number): Promise<PoolsResponse> {
    const headers: Record<string, string> = {
      'X-Blockchain-Id': blockchainId.toString(),
    }

    const pools = await this.http.request<WatchedPool[]>('/v1.1/bcreader/pools', {
      method: 'GET',
      headers,
      cache: true,
      cacheTTL: 300000, // 5 minutes
    })

    return { pools }
  }

  /**
   * Récupère les balances de pools pour une adresse
   *
   * **Note**: Cet endpoint utilise `/v1.1/bcreader/pools/{address}` qui n'est pas documenté dans l'OpenAPI.
   * L'OpenAPI documente uniquement `/v1/bcreader/{verb}`. À vérifier avec l'équipe backend.
   *
   * @param params - Paramètres (address, blockchainId, includeZero)
   * @returns Balances des pools avec yields et APR/APY
   *
   * @example
   * ```typescript
   * const poolBalances = await blockchainService.getPoolBalances({
   *   address: '0x...',
   *   blockchainId: 100,
   *   includeZero: false
   * });
   * poolBalances.pools.forEach(pool => {
   *   console.log(`${pool.symbol}: ${pool.currentBalance} (APY: ${pool.apy}%)`);
   * });
   * ```
   */
  async getPoolBalances(params: PoolBalancesParams): Promise<PoolBalancesResponse> {
    const { address, blockchainId, includeZero } = params

    const queryParams: Record<string, unknown> = {}
    if (includeZero !== undefined) queryParams.includeZero = includeZero

    const headers: Record<string, string> = {}
    if (blockchainId) headers['X-Blockchain-Id'] = blockchainId.toString()

    return this.http.request<PoolBalancesResponse>(`/v1.1/bcreader/pools/${address}`, {
      method: 'GET',
      queryParams,
      headers,
      cache: true,
      cacheTTL: 60000, // 1 minute
    })
  }

  // ============================================================================
  // SWAP
  // ============================================================================

  /**
   * Obtient une quote de swap depuis COWSWAP, 1INCH ou les deux
   *
   * @param params - Paramètres de la quote
   * @returns Quote(s) de swap
   *
   * @example
   * ```typescript
   * const quote = await blockchainService.getSwapQuote({
   *   sellTokenAddress: '0xEURe...',
   *   buyTokenAddress: '0xUSDC...',
   *   amount: '100.00',
   *   provider: 'BOTH'
   * });
   * console.log(`Rate: 1 ${quote.sellToken.symbol} = ${quote.exchangeRate} ${quote.buyToken.symbol}`);
   * ```
   */
  async getSwapQuote(params: SwapQuoteParams): Promise<SwapQuoteResponse> {
    const { sellTokenAddress, buyTokenAddress, amount, chainId, safeAddress, provider } = params

    const queryParams: Record<string, unknown> = {
      sellTokenAddress,
      buyTokenAddress,
      amount,
    }

    if (chainId) queryParams.chainId = chainId
    if (safeAddress) queryParams.safeAddress = safeAddress
    if (provider) queryParams.provider = provider

    return this.http.request<SwapQuoteResponse>('/v1/safes/swap/quote', {
      method: 'GET',
      queryParams,
      cache: true,
      cacheTTL: 30000, // 30 secondes (quotes expirent)
    })
  }

  // ============================================================================
  // GENERIC BCReader PROXY
  // ============================================================================

  /**
   * Appel générique au proxy BCReader (GET)
   *
   * @param verb - Verbe BCReader (ex: 'balances', 'transactions', 'pools')
   * @param params - Paramètres de requête
   * @param blockchainId - ID de la blockchain (optionnel)
   * @returns Réponse brute du BCReader
   */
  async bcReaderGet<T = unknown>(
    verb: string,
    params: Record<string, unknown> = {},
    blockchainId?: number
  ): Promise<T> {
    const headers: Record<string, string> = {}
    if (blockchainId) headers['X-Blockchain-Id'] = blockchainId.toString()

    return this.http.request<T>(`/v1/bcreader/${verb}`, {
      method: 'GET',
      queryParams: params,
      headers,
    })
  }

  /**
   * Appel générique au proxy BCReader (POST)
   *
   * @param verb - Verbe BCReader
   * @param body - Corps de la requête
   * @param blockchainId - ID de la blockchain (optionnel)
   * @returns Réponse brute du BCReader
   */
  async bcReaderPost<T = unknown>(
    verb: string,
    body: Record<string, unknown> = {},
    blockchainId?: number
  ): Promise<T> {
    const headers: Record<string, string> = {}
    if (blockchainId) headers['X-Blockchain-Id'] = blockchainId.toString()

    return this.http.request<T>(`/v1/bcreader/${verb}`, {
      method: 'POST',
      body,
      headers,
    })
  }
}
