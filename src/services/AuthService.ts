// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Service d'authentification IBEX conforme au Swagger
 * Gestion complète de l'authentification WebAuthn
 */

import type { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../core/CacheManager';
import type { AuthResponse, UserDetails, WebAuthnOptions } from '../types';
import {
  prepareWebAuthnRegistrationOptions,
  prepareWebAuthnAuthenticationOptions,
} from '../utils/webauthn';

/**
 * Service d'authentification conforme au Swagger IBEX
 */
export class AuthService {
  constructor(private apiClient: ApiClient, private cacheManager: CacheManager) {}

  // ========================================================================
  // INSCRIPTION (Sign-up)
  // ========================================================================

  /**
   * Inscription d'un nouvel utilisateur
   * GET /v1/auth/sign-up -> POST /v1/auth/sign-up
   */
  async signUp(passkeyName?: string): Promise<AuthResponse> {
    // 1. Obtenir les options d'inscription
    const challengeResponse = await this.apiClient.request<{
      credentialRequestOptions: WebAuthnOptions;
    }>('/v1/auth/sign-up', {
      method: 'GET',
    });

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnRegistrationOptions(challengeResponse.credentialRequestOptions);

    // 3. Ajouter le nom du passkey si fourni
    if (passkeyName && options.user) {
      options.user = {
        ...options.user,
        displayName: passkeyName,
        name: passkeyName,
      };
    }

    // 4. Créer les credentials
    const credential = await navigator.credentials.create({
      publicKey: options,
    });

    if (!credential) {
      throw new Error('Échec de la création des credentials');
    }

    // 5. Finaliser l'inscription
    const authResponse = await this.apiClient.request<AuthResponse>('/v1/auth/sign-up', {
      method: 'POST',
      body: {
        credential,
        chainId: 421614, // Arbitrum Sepolia par défaut
        keyName: passkeyName,
        keyDisplayName: passkeyName,
      },
    });

    // 6. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.apiClient.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
  }

  // ========================================================================
  // CONNEXION (Sign-in)
  // ========================================================================

  /**
   * Connexion d'un utilisateur existant
   * GET /v1/auth/sign-in -> POST /v1/auth/sign-in
   */
  async signIn(): Promise<AuthResponse> {
    // 1. Obtenir les options de connexion
    const challengeResponse = await this.apiClient.request<{
      credentialRequestOptions: WebAuthnOptions;
    }>('/v1/auth/sign-in', {
      method: 'GET',
    });

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnAuthenticationOptions(
      challengeResponse.credentialRequestOptions
    );

    // 3. Obtenir les credentials
    const credential = await navigator.credentials.get({
      publicKey: options,
    });

    if (!credential) {
      throw new Error("Échec de l'authentification");
    }

    // 4. Finaliser la connexion
    const authResponse = await this.apiClient.request<AuthResponse>('/v1/auth/sign-in', {
      method: 'POST',
      body: {
        credential,
        chainId: 421614, // Arbitrum Sepolia par défaut
      },
    });

    // 5. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.apiClient.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
  }

  // ========================================================================
  // REFRESH TOKEN
  // ========================================================================

  /**
   * Rafraîchir le token d'accès
   * POST /v1/auth/refresh
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.apiClient.getToken();
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    return this.apiClient.request<AuthResponse>('/v1/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  // ========================================================================
  // DÉCONNEXION
  // ========================================================================

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(): Promise<void> {
    try {
      // Note: Le Swagger ne spécifie pas d'endpoint de déconnexion
      // On nettoie simplement les tokens locaux
      this.apiClient.clearTokens();
      this.cacheManager.invalidateByTag(CacheManager.TAGS.USER);
    } catch (error) {
      // Ignorer les erreurs de déconnexion
      console.warn('Erreur lors de la déconnexion:', error);
    }
  }

  // ========================================================================
  // DÉTAILS UTILISATEUR
  // ========================================================================

  /**
   * Récupérer les détails de l'utilisateur connecté
   * GET /v1/users/me
   */
  async getUserDetails(): Promise<UserDetails> {
    const cacheKey = 'user_details';
    const cached = this.cacheManager.get<UserDetails>(cacheKey);
    if (cached) return cached;

    const userDetails = await this.apiClient.request<UserDetails>('/v1/users/me', {
      cache: true,
      cacheTTL: 30000, // Cache 30 secondes
    });

    this.cacheManager.set(cacheKey, userDetails, 30000, [CacheManager.TAGS.USER]);
    return userDetails;
  }

  /**
   * Récupérer les adresses de l'utilisateur
   * GET /v1/users/me/address
   */
  async getUserAddresses(): Promise<any> {
    const cacheKey = 'user_addresses';
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const addresses = await this.apiClient.request('/v1/users/me/address', {
      cache: true,
      cacheTTL: 300000, // Cache 5 minutes
    });

    this.cacheManager.set(cacheKey, addresses, 300000, [
      CacheManager.TAGS.USER,
      CacheManager.TAGS.WALLET,
    ]);
    return addresses;
  }

  /**
   * Récupérer les chain IDs supportés
   * GET /v1/users/me/chainid
   */
  async getUserChainIds(): Promise<any> {
    const cacheKey = 'user_chain_ids';
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const chainIds = await this.apiClient.request('/v1/users/me/chainid', {
      cache: true,
      cacheTTL: 300000, // Cache 5 minutes
    });

    this.cacheManager.set(cacheKey, chainIds, 300000, [CacheManager.TAGS.USER]);
    return chainIds;
  }

  /**
   * Récupérer les opérations de l'utilisateur
   * GET /v1/users/me/operations
   */
  async getUserOperations(): Promise<any> {
    const cacheKey = 'user_operations';
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const operations = await this.apiClient.request('/v1/users/me/operations', {
      cache: true,
      cacheTTL: 30000, // Cache 30 secondes
    });

    this.cacheManager.set(cacheKey, operations, 30000, [
      CacheManager.TAGS.USER,
      CacheManager.TAGS.OPERATIONS,
    ]);
    return operations;
  }
}
