// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le service utilisateur IBEX
 * Conformes au schéma OpenAPI
 */

/**
 * Réponse des détails utilisateur depuis /v1/users/me
 * Conforme au schéma OpenAPI
 */
export interface UserDetailsResponse {
  id: string
  ky: string // Statut KYC (0-5)
  signers: Array<{
    id: string
    safes: Array<{
      address: string
      threshold: number
      iban?: {
        chainId: number
        iban?: string
        bic?: string
      }
    }>
  }>
}

/**
 * Réponse des opérations utilisateur depuis /v1/users/me/operations
 * Conforme au schéma OpenAPI
 */
export interface UserOperationsResponse {
  data: Array<{
    id: string
    createdAt: string
    updatedAt: string
    index: number
    type: string
    data: Record<string, unknown>
    safeOperation?: {
      userOpHash: string
      createdAt: string
      updatedAt: string
      paymaster: string
      status: string
      error: string | null
      safeAddress: string
      transactionHash: string
      signatures: Array<{
        createdAt: string
        data: {
          clientDataJSON: string
          authenticatorData: string
          signature: string
          userHandle: string | null
        }
        signerId: string
      }>
    }
  }>
}

/**
 * Réponse des chain IDs supportés depuis /v1/users/me/chainid
 * Conforme au schéma OpenAPI
 */
export interface ChainIdsResponse {
  defaultChainId: number
  supportedChainIds: number[]
}

/**
 * Réponse des adresses de portefeuille depuis /v1/users/me/address
 * Conforme au schéma OpenAPI
 */
export interface WalletAddressesResponse {
  rpId: string
  externalUserId: string
  count: number
  wallets: Array<{
    safeAddress: string
    chainIds: number[]
    createdAt: string
    updatedAt: string
    primary: boolean
  }>
}
