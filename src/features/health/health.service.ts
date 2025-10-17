// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de santé IBEX
 *
 * Gère:
 * - Vérification de la santé de l'API
 *
 * @module features/health
 */

import type { HttpClient } from '../../core/http'
import type { HealthResponse } from './health.types'

/**
 * Service de santé
 */
export class HealthService {
  constructor(private http: HttpClient) {}

  /**
   * Vérifie la santé de l'API
   * GET /health
   *
   * @returns Statut de santé de l'API
   *
   * @example
   * ```typescript
   * const health = await healthService.getHealth();
   * console.log(health.status); // "ok"
   * ```
   */
  async getHealth(): Promise<HealthResponse> {
    return this.http.request<HealthResponse>('/health', {
      cache: false, // Pas de cache pour le health check
    })
  }
}
