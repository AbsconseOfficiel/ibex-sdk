// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de gestion de la récupération IBEX - OpenAPI v1.1
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
   * Récupère le statut de récupération d'une Safe (v1.1)
   * GET /v1.1/recovery/status/{safeAddress}
   *
   * @param safeAddress - Adresse de la Safe
   * @returns Statut de récupération de la Safe avec opérations pending/executed
   *
   * @example
   * ```typescript
   * const status = await recoveryService.getRecoveryStatus('0x123...');
   * console.log(status.recoveryEnabled);  // true/false
   * console.log(status.dataRecovery);     // true/false
   * console.log(status.pending);          // Opérations en attente
   * console.log(status.executed);         // Opérations exécutées
   * ```
   */
  async getRecoveryStatus(safeAddress: string): Promise<RecoveryStatusResponse> {
    return this.http.request<RecoveryStatusResponse>(`/v1.1/recovery/status/${safeAddress}`, {
      cache: true,
      cacheTTL: 60000, // 1 minute
    })
  }

  /**
   * Récupère le statut de récupération d'un Safe avec vérification optionnelle on-chain (v1.2)
   *
   * Par défaut, utilise l'état de la base de données (comme v1/v1.1).
   * Utilisez `verifyOnChain: true` pour forcer une vérification directe on-chain via RPC.
   *
   * **Modes:**
   * - **Database mode (default)**: Rapide, utilise uniquement l'état de la base de données
   * - **RPC mode** (`verifyOnChain: true`): Appels directs au contrat via RPC pour vérification on-chain
   *
   * @param safeAddress - Adresse du Safe
   * @param options - Options de récupération (chainId, verifyOnChain)
   * @returns Statut de récupération avec opérations pending et executed
   *
   * @example
   * ```typescript
   * // Mode base de données (par défaut)
   * const status = await recoveryService.getRecoveryStatusV2('0x...');
   *
   * // Mode RPC (vérification on-chain)
   * const statusOnChain = await recoveryService.getRecoveryStatusV2('0x...', {
   *   verifyOnChain: true,
   *   chainId: 100
   * });
   * console.log(`Recovery enabled (on-chain): ${statusOnChain.recoveryEnabled}`);
   * ```
   */
  async getRecoveryStatusV2(
    safeAddress: string,
    options?: {
      chainId?: number
      verifyOnChain?: boolean
    }
  ): Promise<RecoveryStatusResponse> {
    const queryParams: Record<string, unknown> = {}
    if (options?.chainId) queryParams.chainId = options.chainId
    if (options?.verifyOnChain !== undefined) queryParams.verifyOnChain = options.verifyOnChain

    const headers: Record<string, string> = {}
    if (options?.chainId) {
      headers['X-Blockchain-Id'] = options.chainId.toString()
    }

    return this.http.request<RecoveryStatusResponse>(`/v1.2/recovery/status/${safeAddress}`, {
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      cache: options?.verifyOnChain ? false : true, // Pas de cache si vérification on-chain
      cacheTTL: 60000, // 1 minute
    })
  }
}
