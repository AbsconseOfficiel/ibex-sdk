// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * IBEX SDK - Point d'entrée principal
 *
 * SDK React/TypeScript moderne pour l'intégration des services IBEX.
 * Architecture modulaire avec features namespaced.
 *
 * @example
 * ```typescript
 * import { IbexProvider, useIbex } from '@absconse/ibex-sdk';
 *
 * // Configuration
 * const config = {
 *   baseURL: 'https://api.ibex.com',
 *   domain: 'myapp.com'
 * };
 *
 * // Provider
 * function App() {
 *   return (
 *     <IbexProvider config={config}>
 *       <Dashboard />
 *     </IbexProvider>
 *   );
 * }
 *
 * // Hook
 * function Dashboard() {
 *   const { user, balance, signIn, send, sdk } = useIbex();
 *
 *   // Usage simple
 *   await signIn();
 *   await send(100, '0x...');
 *
 *   // Usage avancé
 *   await sdk.safe.enableRecovery({ ... });
 *   await sdk.privacy.saveUserData({ ... });
 * }
 * ```
 *
 * @module @absconse/ibex-sdk
 */

// ============================================================================
// CLIENT & HOOK PRINCIPAL
// ============================================================================

export { IbexClient } from './core/client'
export { useIbex } from './hooks/useIbex'
export { IbexProvider, useIbexConfig } from './context/IbexProvider'

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Configuration
  IbexConfig,
  CacheConfig,
  WebSocketConfig,

  // Types de base
  User,
  Wallet,
  Balance,
  Transaction,
  Operation,

  // Auth
  AuthResponse,
  IframeResponse,

  // Wallet
  WalletAddressesResponse,
  ChainIdsResponse,
  UserDetailsResponse,
  WalletInfo,

  // Transactions
  TransactionsHistoryResponse,
  TransactionsBalancesResponse,
  TransactionsOptions,

  // Safe
  SafeOperationRequest,
  SafeOperationResponse,
  TransferParams,
  WithdrawParams,
  SignMessageParams,
  EnableRecoveryParams,
  UserOperationsResponse,
  RecipientInfo,

  // Recovery
  RecoveryStatusResponse,

  // Privacy
  UserPrivateData,
  SaveUserDataResponse,
  ValidateEmailResponse,
  ConfirmEmailParams,

  // Blockchain
  BalancesResponse,
  TransactionsResponse,
  TransactionsParams,
} from './types'

// ============================================================================
// UTILITAIRES
// ============================================================================

// Formatters
export {
  formatCurrency,
  formatUsd,
  formatAddress,
  formatHash,
  formatDate,
  formatRelativeDate,
  getStatusClasses,
  getTransactionIcon,
  getOperationIcon,
} from './utils/formatters'

// Validators
export {
  isValidAddress,
  isValidIban,
  isValidAmount,
  isValidAmountString,
  isValidEmail,
  isValidConfig,
  isValidUserData,
  isValidSafeOperation,
  isValidTransactionParams,
  isValidDate,
} from './utils/validators'

// Logger
export { logger, LogLevel } from './utils/logger'

// WebAuthn
export {
  challengeToArrayBuffer,
  prepareWebAuthnRegistrationOptions,
  prepareWebAuthnAuthenticationOptions,
} from './utils/webauthn'

// ============================================================================
// CORE (usage avancé)
// ============================================================================

export { HttpClient } from './core/http'
export { CacheManager, CACHE_STRATEGIES } from './core/cache'
export { StorageManager } from './core/StorageManager'
export { WebSocketService } from './core/websocket'

// ============================================================================
// FEATURES (usage direct sans hook)
// ============================================================================

export { AuthService } from './features/auth'
export { UserService } from './features/users'
export { BlockchainService } from './features/blockchain'
export { SafeService } from './features/safe'
export { KycService } from './features/kyc'
export { RecoveryService } from './features/recovery'
export { PrivacyService } from './features/privacy'
export { HealthService } from './features/health'
