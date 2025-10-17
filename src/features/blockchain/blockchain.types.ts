// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module blockchain
 *
 * @module features/blockchain/types
 */

export interface BalancesResponse {
  balance: string;
  tokens?: unknown[];
  totalValueUsd?: number;
  lastUpdated?: string;
}

export interface TransactionsResponse {
  data: unknown[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface TransactionsParams {
  address?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}
