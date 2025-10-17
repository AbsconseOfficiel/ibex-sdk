// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Client HTTP optimisé pour IBEX SDK
 *
 * Features:
 * - Retry automatique avec exponential backoff
 * - Timeout configurable
 * - Interceptors request/response
 * - Gestion automatique refresh token
 * - Cache intelligent intégré
 * - Metrics et monitoring
 *
 * @module core/http
 */

import type { IbexConfig } from '../types'
import { StorageManager } from './StorageManager.js'

// ============================================================================
// TYPES
// ============================================================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  params?: Record<string, string | number>
  queryParams?: Record<string, unknown>
  headers?: Record<string, string>
  cache?: boolean
  cacheTTL?: number
  skipAuth?: boolean
  timeout?: number
  retries?: number
}

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition: (error: Error) => boolean
}

type RequestInterceptor = (config: RequestOptions) => RequestOptions | Promise<RequestOptions>
type ResponseInterceptor = <T>(response: T) => T | Promise<T>
type ErrorInterceptor = (error: Error) => Error | Promise<Error>

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * Client HTTP moderne avec fonctionnalités avancées
 */
export class HttpClient {
  private config: IbexConfig
  private storage: StorageManager
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []
  private retryConfig: RetryConfig

  // Metrics
  private metrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  }

  constructor(config: IbexConfig, storage: StorageManager) {
    this.config = config
    this.storage = storage

    // Configuration retry par défaut
    this.retryConfig = {
      maxAttempts: config.retries || 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryCondition: (error: Error) => {
        // Retry sur erreurs réseau et 5xx
        return (
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('5')
        )
      },
    }
  }

  // ========================================================================
  // INTERCEPTORS
  // ========================================================================

  /**
   * Ajoute un interceptor de requête
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * Ajoute un interceptor de réponse
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * Ajoute un interceptor d'erreur
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor)
  }

  // ========================================================================
  // REQUEST METHOD
  // ========================================================================

  /**
   * Effectue une requête HTTP
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    this.metrics.requestCount++

    // Appliquer les interceptors de requête
    let finalOptions = options
    for (const interceptor of this.requestInterceptors) {
      finalOptions = await interceptor(finalOptions)
    }

    const {
      method = 'GET',
      body,
      params,
      queryParams,
      headers: customHeaders,
      cache = false,
      cacheTTL = 60000,
      skipAuth = false,
      timeout = this.config.timeout || 30000,
    } = finalOptions

    // Construire l'URL
    let url = `${this.config.baseURL}${endpoint}`

    // Remplacer les paramètres d'URL
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)))
      })
    }

    // Ajouter les query params
    if (queryParams) {
      const searchParams = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    // Vérifier le cache pour GET
    if (method === 'GET' && cache) {
      const cacheKey = this.generateCacheKey(endpoint, queryParams)
      const cachedData = this.storage.getCacheData<T>(cacheKey)
      if (cachedData) {
        this.metrics.cacheHits++
        return cachedData
      }
      this.metrics.cacheMisses++
    }

    // Préparer les headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    }

    // Ajouter l'authentification
    if (!skipAuth) {
      const { accessToken } = this.storage.getTokens()
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
    }

    // Fonction de requête avec retry
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Gestion 401 avec refresh token
        if (response.status === 401 && !skipAuth && !url.includes('/auth/refresh')) {
          const newToken = await this.refreshAccessToken()
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`
            const retryResponse = await fetch(url, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
            })
            return await this.handleResponse<T>(retryResponse)
          }
        }

        return await this.handleResponse<T>(response)
      } finally {
        clearTimeout(timeoutId)
      }
    }

    try {
      // Exécuter avec retry logic
      const result = await this.retry(makeRequest, this.retryConfig)

      // Appliquer les interceptors de réponse
      let finalResult = result
      for (const interceptor of this.responseInterceptors) {
        finalResult = await interceptor(finalResult)
      }

      // Mettre en cache si nécessaire
      if (method === 'GET' && cache) {
        const cacheKey = this.generateCacheKey(endpoint, queryParams)
        this.storage.setCacheData(cacheKey, finalResult, cacheTTL)
      }

      this.metrics.successCount++
      return finalResult
    } catch (error) {
      this.metrics.errorCount++

      // Appliquer les interceptors d'erreur
      let finalError = error as Error
      for (const interceptor of this.errorInterceptors) {
        finalError = await interceptor(finalError)
      }

      throw finalError
    }
  }

  // ========================================================================
  // RESPONSE HANDLING
  // ========================================================================

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage: string

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`
      } catch {
        errorMessage = errorText || response.statusText || `HTTP ${response.status}`
      }

      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      ;(error as any).statusText = response.statusText
      throw error
    }

    // Gérer les réponses vides
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T
    }

    try {
      return await response.json()
    } catch {
      return {} as T
    }
  }

  // ========================================================================
  // REFRESH TOKEN
  // ========================================================================

  private async refreshAccessToken(): Promise<string | null> {
    const { refreshToken } = this.storage.getTokens()
    if (!refreshToken) return null

    try {
      const response = await this.request<{
        access_token: string
        refresh_token?: string
      }>('/v1/auth/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken },
        skipAuth: true,
      })

      this.storage.setTokens(response.access_token, response.refresh_token)
      return response.access_token
    } catch (error) {
      this.storage.clearTokens()
      throw error
    }
  }

  // ========================================================================
  // RETRY LOGIC
  // ========================================================================

  private async retry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        // Ne pas retry si la condition n'est pas remplie ou si c'est la dernière tentative
        if (!config.retryCondition(lastError) || attempt === config.maxAttempts - 1) {
          throw lastError
        }

        // Calculer le délai avec exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        )

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  // ========================================================================
  // CACHE UTILS
  // ========================================================================

  private generateCacheKey(endpoint: string, queryParams?: Record<string, unknown>): string {
    const cleanEndpoint = endpoint
      .replace(/\/[a-fA-F0-9-]{36}/g, '/{id}')
      .replace(/\/[a-fA-F0-9]{40}/g, '/{hash}')
      .replace(/\/\d+/g, '/{number}')

    const paramsKey = queryParams ? JSON.stringify(queryParams) : ''
    return this.hashString(`${cleanEndpoint}${paramsKey}`)
  }

  private hashString(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }

    return `api_${Math.abs(hash).toString(36)}`
  }

  // ========================================================================
  // TOKEN MANAGEMENT
  // ========================================================================

  /**
   * Définit les tokens d'authentification
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    this.storage.setTokens(accessToken, refreshToken)
  }

  /**
   * Récupère le token d'accès actuel
   */
  getToken(): string | null {
    const { accessToken } = this.storage.getTokens()
    return accessToken
  }

  /**
   * Supprime les tokens d'authentification
   */
  clearTokens(): void {
    this.storage.clearTokens()
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.storage.clear()
  }

  /**
   * Invalide le cache par pattern
   */
  invalidateCache(pattern: string): void {
    this.storage.invalidate(pattern)
  }

  // ========================================================================
  // METRICS
  // ========================================================================

  /**
   * Récupère les métriques du client HTTP
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate:
        this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      successRate: this.metrics.successCount / this.metrics.requestCount || 0,
    }
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    }
  }
}
