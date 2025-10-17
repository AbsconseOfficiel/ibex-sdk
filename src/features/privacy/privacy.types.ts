// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module privacy
 *
 * @module features/privacy/types
 */

export interface UserPrivateData {
  [key: string]: unknown;
}

export interface SaveUserDataResponse {
  success: boolean;
}

export interface ValidateEmailResponse {
  success: boolean;
  message?: string;
}

export interface ConfirmEmailParams {
  email: string;
  code: string;
  externalUserId: string;
  userDataName?: string;
  optinNews?: boolean;
  optinNotifications?: boolean;
}
