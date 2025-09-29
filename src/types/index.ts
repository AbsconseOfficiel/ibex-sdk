// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Types TypeScript unifiés pour le SDK IBEX
 * Conformes au Swagger IBEX
 */

// ============================================================================
// TYPES DE BASE SIMPLIFIÉS
// ============================================================================

/**
 * Utilisateur IBEX avec données essentielles
 */
export interface User {
  id: string;
  email: string;
  kyc: {
    status: 'pending' | 'verified' | 'rejected';
    level: number;
  };
}

/**
 * Portefeuille utilisateur
 */
export interface Wallet {
  address: string;
  isConnected: boolean;
  chainId: number;
}

/**
 * Transaction simplifiée
 */
export interface Transaction {
  id: string;
  amount: number;
  type: 'IN' | 'OUT';
  status: 'confirmed' | 'pending' | 'failed';
  date: string;
  hash: string;
  from: string;
  to: string;
}

/**
 * Opération utilisateur
 */
export interface Operation {
  id: string;
  type:
    | 'TRANSFER'
    | 'WITHDRAW'
    | 'KYC'
    | 'IBAN_CREATE'
    | 'SIGN_MESSAGE'
    | 'ENABLE_RECOVERY'
    | 'CANCEL_RECOVERY';
  status: 'pending' | 'completed' | 'failed' | 'executed';
  amount?: number;
  createdAt: string;
  safeOperation?: {
    userOpHash?: string;
    status?: string;
  };
}

/**
 * Balance utilisateur
 */
export interface Balance {
  amount: number;
  symbol: string;
  usdValue?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration IBEX simplifiée
 */
export interface IbexConfig {
  baseURL: string;
  domain: string;
  rpId?: string; // Auto-déduit du domain si non fourni
  defaultChainId?: number;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  issuer?: string;
  audience?: string;
  subject?: string;
  roles?: string[];
  keyName?: string;
  keyDisplayName?: string;
  userOpHash?: string;
  transactionHash?: string;
}

/**
 * Détails utilisateur depuis /v1/users/me
 */
export interface UserDetails {
  id: string;
  ky: string; // Statut KYC (0-5)
  signers: Array<{
    id: string;
    safes: Array<{
      address: string;
      threshold: number;
      iban?: {
        chainId: number;
        iban: string;
        bic: string;
      };
    }>;
  }>;
}

/**
 * Réponse des balances
 */
export interface BalanceResponse {
  balance: string;
  tokens?: any[];
  totalValueUsd?: number;
  lastUpdated?: string;
}

/**
 * Réponse des transactions
 */
export interface TransactionResponse {
  data: any[];
  pagination?: any;
}

// ============================================================================
// WEBAUTHN
// ============================================================================

/**
 * Options WebAuthn
 */
export interface WebAuthnOptions {
  challenge: ArrayBuffer;
  rpId: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
  timeout?: number;
  hints?: string[];
  attestation?: AttestationConveyancePreference;
  extensions?: any;
  rp?: {
    id: string;
    name: string;
  };
  user?: {
    id: ArrayBuffer;
    name: string;
    displayName: string;
  };
  pubKeyCredParams?: Array<{
    type: string;
    alg: number;
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment;
    userVerification?: UserVerificationRequirement;
    residentKey?: ResidentKeyRequirement;
  };
}

// ============================================================================
// SAFE OPERATIONS
// ============================================================================

/**
 * Requête d'opération Safe
 */
export interface SafeOperationRequest {
  safeAddress: string;
  chainId: number;
  operations: SafeOperationInput[];
}

/**
 * Réponse de préparation d'opération Safe
 */
export interface SafeOperationResponse {
  credentialRequestOptions: WebAuthnOptions;
  operationId?: string;
}

/**
 * Input d'opération Safe
 */
export interface SafeOperationInput {
  type:
    | 'TRANSFER_EURe'
    | 'MONERIUM_CREATE_IBAN'
    | 'MONERIUM_WITHDRAW_EURe'
    | 'SIGN_MESSAGE'
    | 'ENABLE_RECOVERY'
    | 'CANCEL_RECOVERY';
  to?: string;
  amount?: string;
  iban?: string;
  label?: string;
  recipientInfo?: RecipientInfo;
  message?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthCity?: string;
  birthCountry?: string;
}

/**
 * Informations du destinataire
 */
export interface RecipientInfo {
  firstName: string;
  lastName: string;
  country: string;
}

// ============================================================================
// KYC
// ============================================================================

/**
 * Réponse KYC iframe
 */
export interface KycResponse {
  chatbotURL: string;
  sessionId: string;
}

/**
 * Statut KYC
 */
export type KycStatus = 'pending' | 'verified' | 'rejected';

/**
 * Informations du statut KYC
 */
export interface KycStatusInfo {
  status: KycStatus;
  label: string;
  description?: string;
  requiredActions?: string[];
  updatedAt?: string;
}

// ============================================================================
// IBEX SAFE
// ============================================================================

/**
 * Données utilisateur privées
 */
export interface UserPrivateData {
  [key: string]: any;
}

/**
 * Réponse de sauvegarde des données
 */
export interface SaveUserDataResponse {
  success: boolean;
}

// ============================================================================
// ERREURS
// ============================================================================

/**
 * Erreur API structurée
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

/**
 * Réponse API générique
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============================================================================
// OPTIONS ET CONFIGURATION
// ============================================================================

/**
 * Options pour les requêtes de transactions
 */
export interface TransactionOptions {
  address?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
  type?: string;
  status?: string;
}

/**
 * Options pour les requêtes de balances
 */
export interface BalanceOptions {
  address?: string;
  tokens?: string[];
}

// ============================================================================
// TYPES LEGACY (pour compatibilité)
// ============================================================================

/**
 * @deprecated Utilisez User à la place
 */
export interface UserDetails extends User {}

/**
 * @deprecated Utilisez Transaction[] à la place
 */
export interface TransactionResponse {
  data: any[];
  pagination?: any;
}

/**
 * @deprecated Utilisez Operation[] à la place
 */
export interface SafeOperation {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  data?: any;
}
