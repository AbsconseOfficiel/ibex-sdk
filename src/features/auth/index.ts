// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Module d'authentification IBEX - OpenAPI v1.1
 *
 * @module features/auth
 */

export { AuthService } from './auth.service'
export type {
  AuthResponse,
  IframeResponse,
  SignInOptions,
  SignUpOptions,
  RegistrationCredentialOptions,
  AuthenticationCredentialOptions,
  SignUpChallengeResponse,
  SignInChallengeResponse,
} from './auth.types'
