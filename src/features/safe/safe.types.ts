// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module Safe
 *
 * @module features/safe/types
 */

export interface SafeOperationRequest {
  safeAddress: string;
  chainId: number;
  operations: SafeOperationInput[];
}

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

export interface RecipientInfo {
  firstName: string;
  lastName: string;
  country: string;
}

export interface SafeOperationResponse {
  credentialRequestOptions: unknown;
  operationId?: string;
}

export interface TransferParams {
  safeAddress: string;
  chainId?: number;
  to: string;
  amount: number;
}

export interface WithdrawParams {
  safeAddress: string;
  chainId?: number;
  iban: string;
  amount: number;
  label?: string;
  recipientInfo: RecipientInfo;
}

export interface SignMessageParams {
  safeAddress: string;
  chainId?: number;
  message: string;
}

export interface EnableRecoveryParams {
  safeAddress: string;
  chainId?: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthCity: string;
  birthCountry: string;
}

export interface UserOperationsResponse {
  data: unknown[];
}
