// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de gestion de la récupération IBEX
 *
 * Gère:
 * - Statut de récupération des Safes
 * - Activation/désactivation de la récupération
 *
 * @module features/recovery
 */

import type { HttpClient } from '../../core/http'
import type { RecoveryStatusResponse } from './recovery.types'

/**
 * Service de gestion de la récupération
 */
export class RecoveryService {
  constructor(private http: HttpClient) {}

  /**
   * Récupère le statut de récupération d'une Safe
   * GET /v1/recovery/status/{safeAddress}
   *
   * @param safeAddress - Adresse de la Safe
   * @returns Statut de récupération de la Safe
   *
   * @example
   * ```typescript
   * const status = await recoveryService.getRecoveryStatus('0x123...');
   * console.log(status.recoveryEnabled); // true/false
   * ```
   */
  async getRecoveryStatus(safeAddress: string): Promise<RecoveryStatusResponse> {
    return this.http.request<RecoveryStatusResponse>(`/v1/recovery/status/${safeAddress}`, {
      cache: true,
      cacheTTL: 60000, // 1 minute
    })
  }
}
