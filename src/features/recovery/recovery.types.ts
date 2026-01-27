// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le service de récupération IBEX - OpenAPI v1.1
 * Conformes au schéma OpenAPI
 */

/**
 * Opération de récupération (pending ou executed)
 */
export interface RecoveryOperation {
  userOpHash: string
  status: 'CREATED' | 'SIGNED' | 'EXECUTED' | 'CONFIRMED' | 'FAILED'
  transactionHash?: string
  createdAt: string
  updatedAt: string
}

/**
 * Réponse du statut de récupération depuis /v1.1/recovery/status/{safeAddress}
 * Conforme au schéma OpenAPI v1.1
 */
export interface RecoveryStatusResponse {
  /** Adresse de la Safe */
  safeAddress: string

  /** Indique si la récupération est activée */
  recoveryEnabled: boolean

  /** Adresse du guardian de récupération (si activé) */
  recoveryAddress: string | null

  /** Délai avant exécution de la récupération en secondes */
  delay: number | null

  /** Indique si une récupération est en cours */
  pendingRecovery: boolean

  /** Indique si la récupération peut être exécutée maintenant */
  canExecute: boolean

  /** Date/heure après laquelle la récupération peut être exécutée */
  executeAfter: string | null

  /** Indique si les données de récupération sont présentes */
  dataRecovery: boolean

  /** Opérations de récupération en attente */
  pending: RecoveryOperation[]

  /** Opérations de récupération exécutées */
  executed: RecoveryOperation[]
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
