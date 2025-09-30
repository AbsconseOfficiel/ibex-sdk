// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Point d'entrée principal du SDK IBEX
 *
 * TODO: Ajouter la documentation des exports
 * TODO: Implémenter les tests d'intégration
 * TODO: Ajouter la validation des types
 */

// ============================================================================
// HOOKS
// ============================================================================

// Hook principal pour l'intégration
export { useIbex } from './hooks/useIbex';

// ============================================================================
// PROVIDERS
// ============================================================================

// Provider de configuration
export { IbexProvider } from './context/IbexProvider';

// ============================================================================
// CORE
// ============================================================================

// Client IBEX simplifié
export { IbexClient } from './core/IbexClient';

// ============================================================================
// UTILITAIRES
// ============================================================================

// Formatage des données
export * from './utils/formatters';

// Validation des entrées
export * from './utils/validators';

// Système de logs
export { logger } from './utils/logger';

// ============================================================================
// TYPES
// ============================================================================

// Types TypeScript
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
// CORE (usage avancé)
// ============================================================================

// Clients principaux
export { ApiClient } from './core/ApiClient';
export { CacheManager } from './core/CacheManager';

// Services internes
export { WebSocketService } from './services/WebSocketService';
