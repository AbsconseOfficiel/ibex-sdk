// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Service IBEX Safe conforme au Swagger
 * Gestion des données utilisateur privées
 */

import type { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../core/CacheManager';

/**
 * Service IBEX Safe conforme au Swagger IBEX
 */
export class IbexSafeService {
  constructor(private apiClient: ApiClient, private cacheManager: CacheManager) {}

  // ========================================================================
  // DONNÉES UTILISATEUR PRIVÉES
  // ========================================================================

  /**
   * Récupérer les données utilisateur privées
   * GET /v1/ibexsafe/userdata/external/{externalUserId}
   */
  async getUserData(externalUserId: string): Promise<Record<string, unknown>> {
    const cacheKey = `user_data_${externalUserId}`;
    const cached = this.cacheManager.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const userData = await this.apiClient.request<Record<string, unknown>>(
      `/v1/ibexsafe/userdata/external/${externalUserId}`,
      {
        cache: true,
        cacheTTL: 300000, // Cache 5 minutes
      }
    );

    this.cacheManager.set(cacheKey, userData, 300000, [CacheManager.TAGS.IBEX_SAFE]);
    return userData;
  }

  /**
   * Sauvegarder les données utilisateur privées
   * POST /v1/ibexsafe/userdata
   */
  async saveUserData(
    externalUserId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    const result = await this.apiClient.request<{ success: boolean }>('/v1/ibexsafe/userdata', {
      method: 'POST',
      body: {
        externalUserId,
        data,
      },
      cache: false, // Ne pas cacher les écritures
    });

    // Invalider le cache des données utilisateur
    this.cacheManager.invalidateByPattern(`user_data_${externalUserId}`);

    return result;
  }

  // ========================================================================
  // VALIDATION EMAIL
  // ========================================================================

  /**
   * Valider un email
   * POST /v1/ibexsafe/validateEmail
   */
  async validateEmail(email: string, externalUserId: string): Promise<unknown> {
    return this.apiClient.request('/v1/ibexsafe/validateEmail', {
      method: 'POST',
      body: {
        email,
        externalUserId,
      },
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
  // UTILITAIRES
  // ========================================================================

  /**
   * Invalider le cache des données utilisateur
   */
  invalidateUserDataCache(externalUserId: string): void {
    this.cacheManager.invalidateByPattern(`user_data_${externalUserId}`);
  }

  /**
   * Invalider tout le cache IBEX Safe
   */
  invalidateAllCache(): void {
    this.cacheManager.invalidateByTag(CacheManager.TAGS.IBEX_SAFE);
  }
}
