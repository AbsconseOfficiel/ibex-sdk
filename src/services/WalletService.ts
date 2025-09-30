// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Service de gestion du portefeuille IBEX
 * Conforme au Swagger IBEX pour les opérations Safe
 */

import type { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../core/CacheManager';
import type {
  WalletAddressesResponse,
  SupportedChainIdsResponse,
  UserOperationsResponse,
} from '../types';

/**
 * Service de gestion du portefeuille conforme au Swagger IBEX
 */
export class WalletService {
  constructor(private apiClient: ApiClient, private cacheManager: CacheManager) {}

  // ========================================================================
  // ADRESSES ET INFORMATIONS
  // ========================================================================

  /**
   * Récupérer les adresses du portefeuille
   * GET /v1/users/me/address
   */
  async getAddresses(): Promise<WalletAddressesResponse> {
    const cacheKey = 'wallet_addresses';
    const cached = this.cacheManager.get<WalletAddressesResponse>(cacheKey);
    if (cached) return cached;

    const addresses = await this.apiClient.request('/v1/users/me/address', {
      cache: true,
      cacheTTL: 300000, // Cache 5 minutes
    });

    this.cacheManager.set(cacheKey, addresses, 300000, [CacheManager.TAGS.WALLET]);
    return addresses as WalletAddressesResponse;
  }

  /**
   * Récupérer les chain IDs supportés
   * GET /v1/users/me/chainid
   */
  async getChainIds(): Promise<SupportedChainIdsResponse> {
    const cacheKey = 'wallet_chain_ids';
    const cached = this.cacheManager.get<SupportedChainIdsResponse>(cacheKey);
    if (cached) return cached;

    const chainIds = await this.apiClient.request<SupportedChainIdsResponse>(
      '/v1/users/me/chainid',
      {
        cache: true,
        cacheTTL: 300000, // Cache 5 minutes
      }
    );

    this.cacheManager.set(cacheKey, chainIds, 300000, [CacheManager.TAGS.WALLET]);
    return chainIds;
  }

  /**
   * Récupérer les opérations utilisateur
   * GET /v1/users/me/operations
   */
  async getOperations(): Promise<UserOperationsResponse> {
    const cacheKey = 'wallet_operations';
    const cached = this.cacheManager.get<UserOperationsResponse>(cacheKey);
    if (cached) return cached;

    const operations = await this.apiClient.request<UserOperationsResponse>(
      '/v1/users/me/operations',
      {
        cache: true,
        cacheTTL: 30000, // Cache 30 secondes
      }
    );

    this.cacheManager.set(cacheKey, operations, 30000, [CacheManager.TAGS.OPERATIONS]);
    return operations;
  }

  // ========================================================================
  // OPÉRATIONS SAFE
  // ========================================================================

  /**
   * Préparer une opération Safe
   * POST /v1/safes/operations
   */
  async prepareSafeOperation(
    safeAddress: string,
    chainId: number,
    operations: unknown[]
  ): Promise<unknown> {
    return this.apiClient.request('/v1/safes/operations', {
      method: 'POST',
      body: {
        safeAddress,
        chainId,
        operations,
      },
    });
  }

  /**
   * Exécuter une opération Safe préparée
   * PUT /v1/safes/operations
   */
  async executeSafeOperation(
    safeAddress: string,
    chainId: number,
    operations: unknown[]
  ): Promise<unknown> {
    // 1. Préparer l'opération
    const preparation = await this.prepareSafeOperation(safeAddress, chainId, operations);

    // 2. Signer avec WebAuthn
    const { prepareWebAuthnAuthenticationOptions } = await import('../utils/webauthn');
    const preparationData = preparation as Record<string, unknown>;
    const preparedOptions = prepareWebAuthnAuthenticationOptions(
      preparationData.credentialRequestOptions
    );

    const credential = await navigator.credentials.get({
      publicKey: preparedOptions as any,
    });

    if (!credential) {
      throw new Error('Échec de la signature WebAuthn');
    }

    // 3. Exécuter l'opération
    return this.apiClient.request('/v1/safes/operations', {
      method: 'PUT',
      body: { credential },
    });
  }

  // ========================================================================
  // TRANSFERTS EURe
  // ========================================================================

  /**
   * Transférer des EURe
   */
  async transferEURe(
    safeAddress: string,
    chainId: number,
    to: string,
    amount: string
  ): Promise<unknown> {
    const operations = [
      {
        type: 'TRANSFER_EURe',
        to,
        amount,
      },
    ];

    return this.executeSafeOperation(safeAddress, chainId, operations);
  }

  // ========================================================================
  // GESTION IBAN
  // ========================================================================

  /**
   * Créer un IBAN
   */
  async createIban(safeAddress: string, chainId: number): Promise<unknown> {
    const operations = [
      {
        type: 'MONERIUM_CREATE_IBAN',
      },
    ];

    return this.executeSafeOperation(safeAddress, chainId, operations);
  }

  /**
   * Retirer des EURe vers un IBAN
   */
  async withdrawToIban(
    safeAddress: string,
    chainId: number,
    amount: string,
    iban: string,
    label?: string,
    recipientInfo?: unknown
  ): Promise<unknown> {
    const operations = [
      {
        type: 'MONERIUM_WITHDRAW_EURe',
        amount,
        to: iban, // L'IBAN est passé dans le champ 'to'
        label,
        recipientInfo,
      },
    ];

    return this.executeSafeOperation(safeAddress, chainId, operations);
  }

  // ========================================================================
  // RÉCUPÉRATION
  // ========================================================================

  /**
   * Récupérer le statut de récupération
   * GET /v1/recovery/status/{safeAddress}
   */
  async getRecoveryStatus(safeAddress: string): Promise<unknown> {
    const cacheKey = `recovery_status_${safeAddress}`;
    const cached = this.cacheManager.get<WalletAddressesResponse>(cacheKey);
    if (cached) return cached;

    const status = await this.apiClient.request(`/v1/recovery/status/${safeAddress}`, {
      cache: true,
      cacheTTL: 60000, // Cache 1 minute
    });

    this.cacheManager.set(cacheKey, status, 60000, [CacheManager.TAGS.WALLET]);
    return status;
  }
}
