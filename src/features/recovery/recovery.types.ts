// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le service de récupération IBEX
 * Conformes au schéma OpenAPI
 */

/**
 * Réponse du statut de récupération depuis /v1/recovery/status/{safeAddress}
 * Conforme au schéma OpenAPI
 */
export interface RecoveryStatusResponse {
  recoveryEnabled: boolean
  safeAddress: string
  recoveryAddress?: string
  delay?: number
  pendingRecovery: boolean
  canExecute: boolean
  executeAfter?: string
}

/**
 * Paramètres pour activer la récupération
 */
export interface EnableRecoveryParams {
  safeAddress: string
  chainId?: number
  firstName: string
  lastName: string
  birthDate: string
  birthCity: string
  birthCountry: string
}

/**
 * Réponse de récupération
 */
export interface RecoveryResponse {
  success: boolean
  userOpHash?: string
  transactionHash?: string
}
