// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * IBEX SDK - Point d'entrée principal - OpenAPI v1.1
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
 *   await sdk.safe.transferToken({ ... });
 *   await sdk.safe.aaveSupply({ ... });
 *   await sdk.blockchain.getPools(100);
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
// TYPES - Configuration
// ============================================================================

export type { IbexConfig, CacheConfig, WebSocketConfig } from './types'

// ============================================================================
// TYPES - Base
// ============================================================================

export type { User, Wallet, Balance, Transaction, Operation } from './types'

// ============================================================================
// TYPES - Auth
// ============================================================================

export type {
  AuthResponse,
  IframeResponse,
  SignInOptions,
  SignUpOptions,
  RegistrationCredentialOptions,
  AuthenticationCredentialOptions,
  SignUpChallengeResponse,
  SignInChallengeResponse,
} from './types'

// ============================================================================
// TYPES - User
// ============================================================================

export type {
  UserDetailsResponse,
  WalletAddressesResponse,
  ChainIdsResponse,
  WalletInfo,
  SafeIbanInfo,
  SafeInfo,
  SignerInfo,
} from './types'

// ============================================================================
// TYPES - Safe Operations
// ============================================================================

export type {
  // Operation types
  SafeOperationType,
  SafeOperationInput,
  TransferEureOperation,
  TransferTokenOperation,
  MoneriumCreateIbanOperation,
  MoneriumWithdrawOperation,
  SignMessageOperation,
  EnableRecoveryOperation,
  CancelRecoveryOperation,
  AaveSupplyOperation,
  AaveWithdrawOperation,
  SwapFromQuoteOperation,
  RecipientInfo,

  // Request/Response
  SafeOperationRequest,
  SafeOperationResponse,
  SafeOperationExecuteResponse,

  // Batch
  BatchOptions,
  BatchIntentRequest,
  BatchIntentResponse,
  BatchExecuteRequest,
  BatchOperationStatus,
  BatchOperationInfo,
  BatchStatusResponse,

  // Status
  OperationStatus,
  OperationStatusResponse,

  // Parameters
  TransferParams,
  TransferTokenParams,
  WithdrawParams,
  SignMessageParams,
  EnableRecoveryParams,
  AaveSupplyParams,
  AaveWithdrawParams,
  SwapFromQuoteParams,

  // User Operations
  SafeOperationDetails,
  UserOperation,
  UserOperationsResponse,
} from './types'

// ============================================================================
// TYPES - Recovery
// ============================================================================

export type { RecoveryOperation, RecoveryStatusResponse, RecoveryResponse } from './types'

// ============================================================================
// TYPES - Blockchain
// ============================================================================

export type {
  // Token
  TokenInfo,
  TokenBalance,

  // Balances
  BalancesResponse,
  BalancesParams,

  // Transactions
  BCReaderTransaction,
  TransactionsResponse,
  TransactionsParams,

  // Pools (AAVE)
  PoolMetadata,
  WatchedPool,
  PoolsResponse,
  PoolBalance,
  PoolBalancesResponse,
  PoolBalancesParams,

  // Swap
  SwapProvider,
  SwapQuoteParams,
  SwapQuoteResponse,
} from './types'

// ============================================================================
// TYPES - Privacy
// ============================================================================

export type {
  UserPrivateData,
  SaveUserDataResponse,
  ValidateEmailResponse,
  ConfirmEmailParams,
} from './types'

// ============================================================================
// TYPES - Simplified/Utility
// ============================================================================

export type {
  TransactionsHistoryResponse,
  TransactionsBalancesResponse,
  TransactionsOptions,
  TransactionOptions,
  BalanceOptions,
  WebAuthnOptions,
  KycStatus,
  KycStatusInfo,
  ApiError,
  ApiResponse,
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
export { BitcoinService } from './features/bitcoin'
