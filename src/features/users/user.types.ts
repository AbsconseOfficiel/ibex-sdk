// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le service utilisateur IBEX - OpenAPI v1.1
 * Conformes au schéma OpenAPI
 */

/**
 * Information IBAN d'une Safe
 */
export interface SafeIbanInfo {
  chainId: number
  iban?: string
  bic?: string
}

/**
 * Information d'une Safe
 */
export interface SafeInfo {
  address: string
  threshold: number
  iban?: SafeIbanInfo
}

/**
 * Information d'un signer
 */
export interface SignerInfo {
  id: string
  safes: SafeInfo[]
}

/**
 * Réponse des détails utilisateur depuis /v1/users/me
 * Conforme au schéma OpenAPI
 */
export interface UserDetailsResponse {
  id: string
  ky: string // Statut KYC (0-5)
  signers: SignerInfo[]
}

/**
 * Détails d'une SafeOperation
 */
export interface SafeOperationDetails {
  userOpHash: string
  createdAt: string
  updatedAt: string
  paymaster: string
  status: 'CREATED' | 'SIGNED' | 'EXECUTED' | 'CONFIRMED' | 'FAILED'
  error: string | null
  safeAddress: string
  transactionHash: string | null
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

/**
 * Opération utilisateur
 */
export interface UserOperation {
  id: string
  createdAt: string
  updatedAt: string
  index: number
  type: string
  data: Record<string, unknown>
  safeOperation?: SafeOperationDetails
}

/**
 * Réponse des opérations utilisateur depuis /v1.1/users/me/operations
 * Les opérations sont groupées par adresse Safe
 * Conforme au schéma OpenAPI v1.1
 */
export interface UserOperationsResponse {
  data: Record<string, UserOperation[]>
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
 * Information d'un wallet
 */
export interface WalletInfo {
  safeAddress: string
  chainIds: number[]
  createdAt: string
  updatedAt: string
  primary: boolean
}

/**
 * Réponse des adresses de portefeuille depuis /v1/users/me/address
 * Conforme au schéma OpenAPI
 */
export interface WalletAddressesResponse {
  rpId: string
  externalUserId: string
  count: number
  wallets: WalletInfo[]
}
