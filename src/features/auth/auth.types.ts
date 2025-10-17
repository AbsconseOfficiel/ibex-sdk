// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module d'authentification
 *
 * @module features/auth/types
 */

/**
 * Réponse d'authentification (sign-up, sign-in, refresh)
 */
export interface AuthResponse {
  /** Token d'accès JWT */
  access_token: string;

  /** Token de rafraîchissement */
  refresh_token?: string;

  /** Durée de validité du token en secondes */
  expires_in?: number;

  /** Type de token (toujours 'Bearer') */
  token_type?: string;

  /** Émetteur du token (rpId) */
  issuer?: string;

  /** Audience du token (rpId) */
  audience?: string;

  /** Sujet du token (externalUserId) */
  subject?: string;

  /** Rôles de l'utilisateur */
  roles?: string[];

  /** Nom du passkey utilisé */
  keyName?: string;

  /** Nom d'affichage du passkey */
  keyDisplayName?: string;

  /** Hash de l'opération utilisateur (si applicable) */
  userOpHash?: string;

  /** Hash de la transaction (si applicable) */
  transactionHash?: string;
}

/**
 * Réponse iframe KYC
 */
export interface IframeResponse {
  /** URL de l'iframe KYC */
  chatbotURL: string;

  /** ID de session KYC */
  sessionId: string;
}
