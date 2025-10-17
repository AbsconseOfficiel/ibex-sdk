// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le service de santé IBEX
 * Conformes au schéma OpenAPI
 */

/**
 * Réponse du health check depuis /health
 * Conforme au schéma OpenAPI
 */
export interface HealthResponse {
  status: string
  timestamp: string
}
