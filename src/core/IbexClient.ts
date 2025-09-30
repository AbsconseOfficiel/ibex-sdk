// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Client IBEX simplifié - Conforme au Swagger officiel
 */

import { ApiClient } from './ApiClient';
import { CacheManager } from './CacheManager';
import {
  prepareWebAuthnRegistrationOptions,
  prepareWebAuthnAuthenticationOptions,
} from '../utils/webauthn';
import type { IbexConfig, AuthResponse } from '../types';

/**
 * Client IBEX simplifié - Accès direct aux services
 */
export class IbexClient {
  public readonly apiClient: ApiClient;
  public readonly cacheManager: CacheManager;

  constructor(config: IbexConfig) {
    this.apiClient = new ApiClient(config);
    this.cacheManager = new CacheManager();
  }

  // ========================================================================
  // AUTHENTIFICATION
  // ========================================================================

  /**
   * Inscription d'un nouvel utilisateur
   * GET /v1/auth/sign-up -> POST /v1/auth/sign-up
   */
  async signUp(passkeyName?: string): Promise<AuthResponse> {
    // 1. Obtenir les options d'inscription
    const challengeResponse = await this.apiClient.request<{
      credentialRequestOptions: unknown;
    }>('/v1/auth/sign-up', { method: 'GET' });

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnRegistrationOptions(challengeResponse.credentialRequestOptions);

    // 3. Créer les credentials WebAuthn
    const credential = await navigator.credentials.create({
      publicKey: options as any,
    });

    if (!credential) {
      throw new Error('Échec de la création des credentials');
    }

    // 3. Finaliser l'inscription
    const authResponse = await this.apiClient.request<AuthResponse>('/v1/auth/sign-up', {
      method: 'POST',
      body: {
        credential,
        chainId: 421614,
        keyName: passkeyName,
        keyDisplayName: passkeyName,
      },
    });

    // 4. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.apiClient.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
  }

  /**
   * Connexion d'un utilisateur existant
   * GET /v1/auth/sign-in -> POST /v1/auth/sign-in
   */
  async signIn(): Promise<AuthResponse> {
    // 1. Obtenir les options de connexion
    const challengeResponse = await this.apiClient.request<{
      credentialRequestOptions: unknown;
    }>('/v1/auth/sign-in', { method: 'GET' });

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnAuthenticationOptions(
      challengeResponse.credentialRequestOptions
    );

    // 3. Obtenir les credentials WebAuthn
    const credential = await navigator.credentials.get({
      publicKey: options as any,
    });

    if (!credential) {
      throw new Error("Échec de l'authentification");
    }

    // 4. Finaliser la connexion
    const authResponse = await this.apiClient.request<AuthResponse>('/v1/auth/sign-in', {
      method: 'POST',
      body: { credential, chainId: 421614 },
    });

    // 4. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.apiClient.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(): Promise<void> {
    this.apiClient.clearTokens();
    this.cacheManager.clear();
  }

  // ========================================================================
  // DONNÉES UTILISATEUR
  // ========================================================================

  /**
   * Récupérer les détails de l'utilisateur
   * GET /v1/users/me
   */
  async getUserDetails(): Promise<unknown> {
    const cacheKey = 'user_details';
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const userDetails = await this.apiClient.request('/v1/users/me', {
      cache: true,
      cacheTTL: 30000,
    });

    this.cacheManager.set(cacheKey, userDetails, 30000, ['user']);
    return userDetails;
  }

  /**
   * Récupérer les adresses du portefeuille
   * GET /v1/users/me/address
   */
  async getWalletAddresses(): Promise<unknown> {
    const cacheKey = 'wallet_addresses';
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const addresses = await this.apiClient.request('/v1/users/me/address', {
      cache: true,
      cacheTTL: 300000,
    });

    this.cacheManager.set(cacheKey, addresses, 300000, ['wallet']);
    return addresses;
  }

  /**
   * Récupérer les chain IDs supportés
   * GET /v1/users/me/chainid
   */
  async getSupportedChainIds(): Promise<unknown> {
    const cacheKey = 'supported_chain_ids';
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const chainIds = await this.apiClient.request('/v1/users/me/chainid', {
      cache: true,
      cacheTTL: 300000,
    });

    this.cacheManager.set(cacheKey, chainIds, 300000, ['wallet']);
    return chainIds;
  }

  /**
   * Récupérer les opérations utilisateur
   * GET /v1/users/me/operations
   */
  async getUserOperations(): Promise<unknown> {
    const cacheKey = 'user_operations';
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const operations = await this.apiClient.request('/v1/users/me/operations', {
      cache: true,
      cacheTTL: 30000,
    });

    this.cacheManager.set(cacheKey, operations, 30000, ['operations']);
    return operations;
  }

  // ========================================================================
  // BLOCKCHAIN DATA
  // ========================================================================

  /**
   * Récupérer les balances
   * GET /v1/bcreader/balances
   */
  async getBalances(address?: string): Promise<unknown> {
    const cacheKey = `balances_${address || 'default'}`;
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const balances = await this.apiClient.request('/v1/bcreader/balances', {
      queryParams: address ? { address } : {},
      cache: true,
      cacheTTL: 30000,
    });

    this.cacheManager.set(cacheKey, balances, 30000, ['balance']);
    return balances;
  }

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
  ): Promise<unknown> {
    const { address, startDate, endDate, limit = 50, page = 1 } = options;

    const queryParams: Record<string, unknown> = {
      limit: Math.min(limit, 100),
      page: Math.max(page, 1),
    };

    if (address) queryParams.address = address;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    const cacheKey = `transactions_${JSON.stringify(queryParams)}`;
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const transactions = await this.apiClient.request('/v1/bcreader/transactions', {
      queryParams,
      cache: true,
      cacheTTL: 60000,
    });

    this.cacheManager.set(cacheKey, transactions, 60000, ['transactions']);
    return transactions;
  }

  // ========================================================================
  // SAFE OPERATIONS
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
      body: { safeAddress, chainId, operations },
    });
  }

  /**
   * Exécuter une opération Safe
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
    const credential = await navigator.credentials.get({
      publicKey: (preparation as any).credentialRequestOptions,
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

  /**
   * Transfert EURe
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
  // KYC
  // ========================================================================

  /**
   * Créer un iframe KYC
   * POST /v1/auth/iframe
   */
  async createKycIframe(language: string = 'fr'): Promise<unknown> {
    return this.apiClient.request('/v1/auth/iframe', {
      method: 'POST',
      body: { language },
      cache: false,
    });
  }

  /**
   * Créer une URL de redirection complète pour le KYC
   */
  async createKycRedirectUrl(
    language: string = 'fr',
    appUrl: string = window.location.origin
  ): Promise<string> {
    const response = (await this.createKycIframe(language)) as {
      chatbotURL: string;
      sessionId: string;
    };

    return `${response.chatbotURL}?session=${response.sessionId}&returnUrl=${encodeURIComponent(
      appUrl
    )}`;
  }

  // ========================================================================
  // IBEX SAFE - DONNÉES PRIVÉES
  // ========================================================================

  /**
   * Récupérer les données utilisateur privées
   * GET /v1/ibexsafe/userdata/external/{externalUserId}
   */
  async getUserPrivateData(externalUserId: string): Promise<unknown> {
    const cacheKey = `user_data_${externalUserId}`;
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const userData = await this.apiClient.request(
      `/v1/ibexsafe/userdata/external/${externalUserId}`,
      {
        cache: true,
        cacheTTL: 300000,
      }
    );

    this.cacheManager.set(cacheKey, userData, 300000, ['ibex_safe']);
    return userData;
  }

  /**
   * Sauvegarder les données utilisateur privées
   * POST /v1/ibexsafe/userdata
   */
  async saveUserPrivateData(
    externalUserId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    const result = await this.apiClient.request<{ success: boolean }>('/v1/ibexsafe/userdata', {
      method: 'POST',
      body: { externalUserId, data },
      cache: false,
    });

    // Invalider le cache
    this.cacheManager.invalidateByPattern(`user_data_${externalUserId}`);
    return result;
  }

  /**
   * Valider un email
   * POST /v1/ibexsafe/validateEmail
   */
  async validateEmail(email: string, externalUserId: string): Promise<unknown> {
    return this.apiClient.request('/v1/ibexsafe/validateEmail', {
      method: 'POST',
      body: { email, externalUserId },
      cache: false,
    });
  }

  /**
   * Confirmer un email
   * POST /v1/ibexsafe/confirmEmail
   */
  async confirmEmail(
    email: string,
    code: string,
    externalUserId: string,
    options: {
      userDataName?: string;
      optinNews?: boolean;
      optinNotifications?: boolean;
    } = {}
  ): Promise<unknown> {
    return this.apiClient.request('/v1/ibexsafe/confirmEmail', {
      method: 'POST',
      body: {
        email,
        code,
        externalUserId,
        userDataName: options.userDataName || 'marketing.email',
        optinNews: options.optinNews,
        optinNotifications: options.optinNotifications,
      },
      cache: false,
    });
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
    const cached = this.cacheManager.get<unknown>(cacheKey);
    if (cached) return cached;

    const status = await this.apiClient.request(`/v1/recovery/status/${safeAddress}`, {
      cache: true,
      cacheTTL: 60000,
    });

    this.cacheManager.set(cacheKey, status, 60000, ['wallet']);
    return status;
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Obtenir le token d'accès actuel
   */
  getToken(): string | null {
    return this.apiClient.getToken();
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cacheManager.clear();
    this.apiClient.clearCache();
  }

  /**
   * Vérifier la santé de l'API
   * GET /health
   */
  async getHealth(): Promise<unknown> {
    return this.apiClient.request('/health');
  }
}
