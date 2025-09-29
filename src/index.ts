// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

// ============================================================================
// HOOKS PRINCIPAUX
// ============================================================================

// Hook principal - API unifiée et simplifiée
export { useIbex } from './hooks/useIbex';

// ============================================================================
// PROVIDERS
// ============================================================================

// Provider principal pour la configuration
export { IbexProvider } from './context/IbexProvider';

// ============================================================================
// UTILITAIRES
// ============================================================================

// Utilitaires de formatage
export * from './utils/formatters';

// Utilitaires de validation
export * from './utils/validators';

// Logger
export { logger } from './utils/logger';

// ============================================================================
// TYPES
// ============================================================================

// Types principaux
export type {
  IbexConfig,
  User,
  Wallet,
  Transaction,
  Operation,
  Balance,
  AuthResponse,
  UserDetails,
  BalanceResponse,
  TransactionResponse,
  SafeOperation,
  SafeOperationRequest,
  SafeOperationResponse,
  SafeOperationInput,
  RecipientInfo,
  KycResponse,
  KycStatus,
  KycStatusInfo,
  ApiError,
  ApiResponse,
  TransactionOptions,
  BalanceOptions,
  WebAuthnOptions,
  UserPrivateData,
  SaveUserDataResponse,
} from './types';

// ============================================================================
// CORE (pour usage avancé)
// ============================================================================

// Client principal (pour usage avancé)
export { IbexClient } from './core/IbexClient';
export { ApiClient } from './core/ApiClient';
export { CacheManager } from './core/CacheManager';

// Services (pour usage avancé)
export { AuthService } from './services/AuthService';
export { WalletService } from './services/WalletService';
export { TransactionService } from './services/TransactionService';
export { KycService } from './services/KycService';
export { IbexSafeService } from './services/IbexSafeService';
