// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Service de gestion des transactions IBEX
 * Conforme au Swagger IBEX pour les données blockchain
 */

import type { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../core/CacheManager';

/**
 * Service de gestion des transactions conforme au Swagger IBEX
 */
export class TransactionService {
  constructor(private apiClient: ApiClient, private cacheManager: CacheManager) {}

  // ========================================================================
  // BALANCES
  // ========================================================================

  /**
   * Récupérer les balances
   * GET /v1/bcreader/balances
   */
  async getBalances(address?: string): Promise<any> {
    const cacheKey = `balances_${address || 'default'}`;
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const balances = await this.apiClient.request('/v1/bcreader/balances', {
      queryParams: address ? { address } : {},
      cache: true,
      cacheTTL: 30000, // Cache 30 secondes
    });

    this.cacheManager.set(cacheKey, balances, 30000, [CacheManager.TAGS.BALANCE]);
    return balances;
  }

  // ========================================================================
  // TRANSACTIONS
  // ========================================================================

  /**
   * Récupérer les transactions
   * GET /v1/bcreader/transactions
   */
  async getTransactions(
    options: {
      address?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<any> {
    const { address, startDate, endDate, limit = 50, page = 1 } = options;

    // Construire les paramètres de requête
    const queryParams: Record<string, any> = {
      limit: Math.min(limit, 100), // Limite maximale de 100
      page: Math.max(page, 1), // Page minimale de 1
    };

    if (address) queryParams.address = address;

    // Dates obligatoires pour l'API IBEX
    if (startDate) {
      queryParams.startDate = startDate;
    } else {
      // Fournir une date par défaut (30 jours en arrière)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryParams.startDate = thirtyDaysAgo.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    if (endDate) {
      queryParams.endDate = endDate;
    } else {
      // Fournir une date de fin par défaut (aujourd'hui)
      const today = new Date();
      queryParams.endDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    const cacheKey = `transactions_${JSON.stringify(queryParams)}`;
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const transactions = await this.apiClient.request('/v1/bcreader/transactions', {
      queryParams,
      cache: true,
      cacheTTL: 60000, // Cache 1 minute
    });

    this.cacheManager.set(cacheKey, transactions, 60000, [CacheManager.TAGS.TRANSACTIONS]);
    return transactions;
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Invalider le cache des balances
   */
  invalidateBalanceCache(address?: string): void {
    if (address) {
      this.cacheManager.invalidateByPattern(`balances_${address}`);
    } else {
      this.cacheManager.invalidateByTag(CacheManager.TAGS.BALANCE);
    }
  }

  /**
   * Invalider le cache des transactions
   */
  invalidateTransactionCache(address?: string): void {
    if (address) {
      this.cacheManager.invalidateByPattern(`transactions_`);
    } else {
      this.cacheManager.invalidateByTag(CacheManager.TAGS.TRANSACTIONS);
    }
  }

  /**
   * Rafraîchir les données d'une adresse
   */
  async refreshAddressData(address: string): Promise<{
    balances: any;
    transactions: any;
  }> {
    // Invalider les caches
    this.invalidateBalanceCache(address);
    this.invalidateTransactionCache(address);

    // Recharger les données
    const [balances, transactions] = await Promise.all([
      this.getBalances(address),
      this.getTransactions({ address, limit: 20 }),
    ]);

    return { balances, transactions };
  }
}
