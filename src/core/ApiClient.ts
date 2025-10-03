// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Client API HTTP optimisé pour IBEX
 * Gestion centralisée des requêtes avec cache intelligent
 */

import type { IbexConfig, ApiError } from '../types';
import { StorageManager } from './StorageManager';

/**
 * Client API HTTP avec gestion du cache et des tokens
 */
export class ApiClient {
  private config: IbexConfig;
  private storage: StorageManager;

  constructor(config: IbexConfig) {
    this.config = config;
    this.storage = new StorageManager({
      enableMemoryCache: true,
      enableSessionStorage: true,
      enablePersistentStorage: true,
      defaultTTL: 60000,
    });
  }

  // ========================================================================
  // GESTION DES TOKENS
  // ========================================================================

  setTokens(accessToken: string, refreshToken?: string): void {
    this.storage.setTokens(accessToken, refreshToken);
  }

  getToken(): string | null {
    const { accessToken } = this.storage.getTokens();
    return accessToken;
  }

  clearTokens(): void {
    this.storage.clearTokens();
  }

  // ========================================================================
  // REQUÊTES HTTP
  // ========================================================================

  /**
   * Effectuer une requête HTTP
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      params?: Record<string, unknown>;
      queryParams?: Record<string, unknown>;
      token?: string;
      cache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      params,
      queryParams,
      token,
      cache = false,
      cacheTTL = 60000,
    } = options;

    // Construire l'URL
    let url = `${this.config.baseURL}${endpoint}`;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
      });
    }

    // Ajouter les paramètres de requête
    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Vérifier le cache pour les requêtes GET
    if (method === 'GET' && cache) {
      const cacheKey = this.generateCacheKey(endpoint, queryParams);
      const cachedData = this.storage.getCacheData<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Préparer les headers
    const authToken = token || this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Préparer le body
    const requestBody = body ? JSON.stringify(body) : undefined;

    // Effectuer la requête
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody || null,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Gestion du refresh token pour les erreurs 401
      if (response.status === 401 && authToken && !url.includes('/auth/refresh')) {
        try {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            // Retry avec le nouveau token
            const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            const retryResponse = await fetch(url, {
              method,
              headers: newHeaders,
              body: requestBody || null,
            });

            const result = await this.handleResponse<T>(retryResponse);

            // Mettre en cache si nécessaire
            if (method === 'GET' && cache) {
              const cacheKey = this.generateCacheKey(endpoint, queryParams);
              this.storage.setCacheData(cacheKey, result, cacheTTL);
            }

            return result;
          }
        } catch (refreshError) {
          // Si le refresh échoue, nettoyer les tokens
          this.clearTokens();
          throw refreshError;
        }
      }

      const result = await this.handleResponse<T>(response);

      // Mettre en cache si nécessaire
      if (method === 'GET' && cache) {
        const cacheKey = this.generateCacheKey(endpoint, queryParams);
        this.storage.setCacheData(cacheKey, result, cacheTTL);
      }

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ========================================================================
  // GESTION DES RÉPONSES
  // ========================================================================

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: ApiError;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = {
          code: `HTTP_${response.status}`,
          message: errorText || response.statusText,
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    try {
      return await response.json();
    } catch {
      return {} as T;
    }
  }

  // ========================================================================
  // REFRESH TOKEN
  // ========================================================================

  private async refreshAccessToken(): Promise<string | null> {
    const { refreshToken } = this.storage.getTokens();
    if (!refreshToken) return null;

    try {
      const response = await this.request<{
        access_token: string;
        refresh_token?: string;
      }>('/v1/auth/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });

      this.setTokens(response.access_token, response.refresh_token);
      return response.access_token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Générer une clé de cache sécurisée (sans URL complète)
   */
  private generateCacheKey(endpoint: string, queryParams?: Record<string, unknown>): string {
    // Nettoyer l'endpoint pour enlever les paramètres dynamiques
    const cleanEndpoint = endpoint
      .replace(/\/[a-fA-F0-9-]{36}/g, '/{id}') // UUIDs
      .replace(/\/[a-fA-F0-9]{40}/g, '/{hash}') // Hashes Ethereum
      .replace(/\/\d+/g, '/{number}'); // Nombres

    // Créer une clé basée sur l'endpoint et les paramètres
    const paramsKey = queryParams ? JSON.stringify(queryParams) : '';
    const fullKey = `${cleanEndpoint}${paramsKey}`;

    // Hasher la clé pour éviter les URLs en clair
    return this.hashString(fullKey);
  }

  /**
   * Hasher une chaîne de caractères (simple hash pour le cache)
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }

    return `api_${Math.abs(hash).toString(36)}`;
  }

  clearCache(): void {
    this.storage.clear();
  }
}
