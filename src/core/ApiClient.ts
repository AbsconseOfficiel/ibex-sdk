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

/**
 * Client API HTTP avec gestion du cache et des tokens
 */
export class ApiClient {
  private config: IbexConfig;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: IbexConfig) {
    this.config = config;
    this.loadTokensFromStorage();
  }

  // ========================================================================
  // GESTION DES TOKENS
  // ========================================================================

  private loadTokensFromStorage(): void {
    if (typeof window === 'undefined') return;

    this.token = localStorage.getItem('ibex_access_token');
    this.refreshToken = localStorage.getItem('ibex_refresh_token');
  }

  private saveTokensToStorage(): void {
    if (typeof window === 'undefined') return;

    if (this.token) {
      localStorage.setItem('ibex_access_token', this.token);
    }
    if (this.refreshToken) {
      localStorage.setItem('ibex_refresh_token', this.refreshToken);
    }
  }

  private clearTokensFromStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('ibex_access_token');
    localStorage.removeItem('ibex_refresh_token');
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    this.token = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    this.saveTokensToStorage();
  }

  getToken(): string | null {
    return this.token;
  }

  clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    this.clearTokensFromStorage();
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
      const cachedData = this.getFromCache<T>(url);
      if (cachedData) {
        return cachedData;
      }
    }

    // Préparer les headers
    const authToken = token || this.token;
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
              this.setCache(url, result, cacheTTL);
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
        this.setCache(url, result, cacheTTL);
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
    if (!this.refreshToken) return null;

    try {
      const response = await this.request<{
        access_token: string;
        refresh_token?: string;
      }>('/v1/auth/refresh', {
        method: 'POST',
        body: { refresh_token: this.refreshToken },
      });

      this.setTokens(response.access_token, response.refresh_token);
      return response.access_token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  // ========================================================================
  // CACHE SIMPLE
  // ========================================================================

  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}
