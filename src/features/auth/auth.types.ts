// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module d'authentification - OpenAPI v1.1
 *
 * @module features/auth/types
 */

/**
 * Options pour le sign-in
 */
export interface SignInOptions {
  /** Inclure les balances dans la réponse HTTP (pour clients sans WebSocket) */
  includeBalance?: boolean
  /** Inclure l'historique complet des transactions dans la réponse HTTP */
  includeTransactions?: boolean
  /** Inclure les userdata IBEx Safe dans la réponse HTTP */
  includeUserdata?: boolean
}

/**
 * Options pour le sign-up
 */
export interface SignUpOptions {
  /** Nom d'affichage du passkey (identifiant principal affiché par l'OS) */
  keyName?: string
  /** Label décoratif du passkey */
  keyDisplayName?: string
  /** Liste des chain IDs pour déploiement multi-chaînes */
  chainIds?: number[]
}

/**
 * Réponse d'authentification (sign-up, sign-in, refresh)
 */
export interface AuthResponse {
  /** Token d'accès JWT */
  access_token: string

  /** Token de rafraîchissement */
  refresh_token?: string

  /** Durée de validité du token en secondes */
  expires_in?: number

  /** Type de token (toujours 'Bearer') */
  token_type?: string

  /** Émetteur du token (rpId) */
  issuer?: string

  /** Audience du token (rpId) */
  audience?: string

  /** Sujet du token (externalUserId) */
  subject?: string

  /** Rôles de l'utilisateur */
  roles?: string[]

  /** Nom du passkey utilisé */
  keyName?: string

  /** Nom d'affichage du passkey */
  keyDisplayName?: string

  /** Hash de l'opération utilisateur (si applicable) */
  userOpHash?: string | null

  /** Hash de la transaction (si applicable) */
  transactionHash?: string | null

  /** Chain ID effectif pour les opérations */
  chainId?: number

  /**
   * Mapping des adresses Safe par chainId
   * @example { "100": "0x...", "421614": "0x...", "11155111": "0x..." }
   */
  safeAddress?: Record<string, string>

  /**
   * Balances BCReader pour le Safe de la chaîne effective
   * Présent uniquement si includeBalance=true
   */
  balance?: {
    timestamp?: string
    balances?: Record<
      string,
      {
        address: string
        balance: string
      }
    >
  }

  /**
   * Historique complet des transactions (agrégé)
   * Présent uniquement si includeTransactions=true
   */
  transactions?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
    data?: Array<{
      transactionHash: string
      from: string
      to: string
      watchedAddress: string
      direction: 'IN' | 'OUT'
      tokenAddress: string
      tokenType: string
      tokenSymbol: string
      tokenName: string
      tokenDecimals: number
      valueFormatted: string
      timestamp: string
    }>
  }

  /**
   * Données utilisateur IBEx Safe
   * Présent uniquement si includeUserdata=true
   */
  userdata?: Record<string, unknown>

  /**
   * Feature flags du domaine
   */
  services?: Array<Record<string, boolean>>
}

/**
 * Réponse iframe KYC
 */
export interface IframeResponse {
  /** URL de l'iframe KYC */
  chatbotURL: string

  /** ID de session KYC */
  sessionId: string
}

/**
 * Options de credentials WebAuthn pour l'inscription
 */
export interface RegistrationCredentialOptions {
  rp: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
    displayName: string
  }
  challenge: string
  pubKeyCredParams: Array<{
    alg: number
    type: string
  }>
  authenticatorSelection: {
    residentKey: string
    userVerification: string
  }
  attestation: string
  timeout: number
}

/**
 * Options de credentials WebAuthn pour l'authentification
 */
export interface AuthenticationCredentialOptions {
  rpId: string
  challenge: string
  timeout: number
  allowCredentials: Array<{
    id: string
    type: 'public-key'
  }>
  userVerification: string
  extensions?: Record<string, unknown>
}

/**
 * Réponse du challenge d'inscription
 */
export interface SignUpChallengeResponse {
  credentialRequestOptions: RegistrationCredentialOptions
}

/**
 * Réponse du challenge de connexion
 */
export interface SignInChallengeResponse {
  credentialRequestOptions: AuthenticationCredentialOptions
}
