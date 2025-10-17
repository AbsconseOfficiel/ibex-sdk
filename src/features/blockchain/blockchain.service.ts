// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de lecture blockchain (BCReader)
 *
 * @module features/blockchain
 */

import type { HttpClient } from '../../core/http'
import type { BalancesResponse, TransactionsResponse, TransactionsParams } from './blockchain.types'

/**
 * Service de lecture de la blockchain
 */
export class BlockchainService {
  constructor(private http: HttpClient) {}

  /**
   * Récupère les balances d'une adresse
   *
   * @param address - Adresse du wallet (optionnel, déduit de l'utilisateur si omis)
   * @returns Balances détaillées
   */
  async getBalances(address?: string): Promise<BalancesResponse> {
    const queryParams = address ? { address } : {}

    return this.http.request<BalancesResponse>('/v1/bcreader/balances', {
      method: 'GET',
      queryParams,
      cache: true,
      cacheTTL: 10000, // 10 secondes
    })
  }

  /**
   * Récupère l'historique des transactions
   *
   * @param params - Paramètres de filtrage
   * @returns Historique des transactions
   */
  async getTransactions(params: TransactionsParams = {}): Promise<TransactionsResponse> {
    const { address, startDate, endDate, limit = 50, page = 1 } = params

    const queryParams: Record<string, unknown> = {
      limit: Math.min(limit, 100),
      page: Math.max(page, 1),
    }

    if (address) queryParams.address = address
    if (startDate) queryParams.startDate = startDate
    if (endDate) queryParams.endDate = endDate

    return this.http.request<TransactionsResponse>('/v1/bcreader/transactions', {
      method: 'GET',
      queryParams,
      cache: true,
      cacheTTL: 30000, // 30 secondes
    })
  }
}
