// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service d'authentification IBEX - OpenAPI v1.1
 *
 * Gère:
 * - Inscription (sign-up) avec passkeys
 * - Connexion (sign-in) avec passkeys
 * - Refresh token
 * - Iframe KYC
 *
 * @module features/auth
 */

import type { HttpClient } from '../../core/http'
import type {
  AuthResponse,
  IframeResponse,
  SignInOptions,
  SignUpOptions,
  SignUpChallengeResponse,
  SignInChallengeResponse,
} from './auth.types'
import {
  prepareWebAuthnRegistrationOptions,
  prepareWebAuthnAuthenticationOptions,
} from '../../utils/webauthn'

/**
 * Service d'authentification
 */
export class AuthService {
  constructor(private http: HttpClient) {}

  /**
   * Inscription d'un nouvel utilisateur
   *
   * @param options - Options d'inscription (nom du passkey, chainIds)
   * @returns Réponse d'authentification avec tokens
   *
   * @example
   * ```typescript
   * const auth = await authService.signUp({ keyName: 'My iPhone' });
   * console.log(auth.access_token);
   * console.log(auth.safeAddress); // { "100": "0x...", "421614": "0x..." }
   * ```
   */
  async signUp(options?: string | SignUpOptions): Promise<AuthResponse> {
    // Support legacy string parameter for backward compatibility
    const opts: SignUpOptions =
      typeof options === 'string' ? { keyName: options, keyDisplayName: options } : options || {}

    // 1. Obtenir les options d'inscription
    const challengeResponse = await this.http.request<SignUpChallengeResponse>('/v1/auth/sign-up', {
      method: 'GET',
    })

    // 2. Préparer les options WebAuthn
    const webAuthnOptions = prepareWebAuthnRegistrationOptions(
      challengeResponse.credentialRequestOptions
    )

    // 3. Créer les credentials WebAuthn
    const credential = await navigator.credentials.create({
      publicKey: webAuthnOptions as PublicKeyCredentialCreationOptions,
    })

    if (!credential) {
      throw new Error('Échec de la création des credentials')
    }

    // 4. Finaliser l'inscription
    const authResponse = await this.http.request<AuthResponse>('/v1/auth/sign-up', {
      method: 'POST',
      body: {
        credential,
        ...(opts.chainIds && { chainIds: opts.chainIds }),
        ...(opts.keyName && { keyName: opts.keyName }),
        ...(opts.keyDisplayName && { keyDisplayName: opts.keyDisplayName }),
      },
    })

    // 5. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.http.setTokens(authResponse.access_token, authResponse.refresh_token)
    }

    return authResponse
  }

  /**
   * Connexion d'un utilisateur existant
   *
   * @param options - Options de connexion (includeBalance, includeTransactions, includeUserdata)
   * @returns Réponse d'authentification avec tokens et données optionnelles
   *
   * @example
   * ```typescript
   * // Connexion simple
   * const auth = await authService.signIn();
   *
   * // Connexion avec données incluses
   * const auth = await authService.signIn({
   *   includeBalance: true,
   *   includeTransactions: true,
   *   includeUserdata: true
   * });
   * console.log(auth.balance);       // BCReader balances
   * console.log(auth.transactions);  // Transaction history
   * console.log(auth.userdata);      // IBEx Safe userdata
   * ```
   */
  async signIn(options?: SignInOptions): Promise<AuthResponse> {
    // 1. Obtenir les options de connexion
    const challengeResponse = await this.http.request<SignInChallengeResponse>('/v1/auth/sign-in', {
      method: 'GET',
    })

    // 2. Préparer les options WebAuthn
    const webAuthnOptions = prepareWebAuthnAuthenticationOptions(
      challengeResponse.credentialRequestOptions
    )

    // 3. Obtenir les credentials WebAuthn
    const credential = await navigator.credentials.get({
      publicKey: webAuthnOptions as PublicKeyCredentialRequestOptions,
    })

    if (!credential) {
      throw new Error("Échec de l'authentification")
    }

    // 4. Finaliser la connexion avec options
    const authResponse = await this.http.request<AuthResponse>('/v1/auth/sign-in', {
      method: 'POST',
      body: {
        credential,
        ...(options?.includeBalance !== undefined && { includeBalance: options.includeBalance }),
        ...(options?.includeTransactions !== undefined && {
          includeTransactions: options.includeTransactions,
        }),
        ...(options?.includeUserdata !== undefined && { includeUserdata: options.includeUserdata }),
      },
    })

    // 5. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.http.setTokens(authResponse.access_token, authResponse.refresh_token)
    }

    return authResponse
  }

  /**
   * Déconnexion de l'utilisateur
   *
   * @example
   * ```typescript
   * await authService.logout();
   * ```
   */
  async logout(): Promise<void> {
    this.http.clearTokens()
    this.http.clearCache()
  }

  /**
   * Rafraîchit le token d'accès
   *
   * @param refreshToken - Token de rafraîchissement
   * @returns Nouvelle réponse d'authentification
   *
   * @example
   * ```typescript
   * const auth = await authService.refresh(refreshToken);
   * console.log(auth.access_token);
   * ```
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const authResponse = await this.http.request<AuthResponse>('/v1/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
      skipAuth: true,
    })

    if (authResponse.access_token) {
      this.http.setTokens(authResponse.access_token, authResponse.refresh_token)
    }

    return authResponse
  }

  /**
   * Crée un iframe KYC
   *
   * @param language - Langue de l'iframe (défaut: 'fr')
   * @returns Réponse iframe avec URL et session ID
   *
   * @example
   * ```typescript
   * const iframe = await authService.createIframe('en');
   * console.log(iframe.chatbotURL);
   * ```
   */
  async createIframe(language: string = 'fr'): Promise<IframeResponse> {
    return this.http.request<IframeResponse>('/v1/auth/iframe', {
      method: 'POST',
      body: { language },
      cache: false,
    })
  }

  /**
   * Crée une URL de redirection complète pour le KYC
   *
   * @deprecated Utiliser KycService.start() qui inclut le paramètre language dans l'URL
   * @param language - Langue de l'iframe (défaut: 'fr')
   * @param returnUrl - URL de retour après KYC (défaut: location.origin)
   * @returns URL de redirection complète
   *
   * @example
   * ```typescript
   * // Deprecated - utiliser kycService.start() à la place
   * const kycUrl = await authService.createKycRedirectUrl('fr', 'https://myapp.com/kyc-callback');
   * 
   * // Recommandé
   * const kycUrl = await kycService.start('fr', 'https://myapp.com/kyc-callback');
   * window.location.href = kycUrl;
   * ```
   */
  async createKycRedirectUrl(
    language: string = 'fr',
    returnUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
  ): Promise<string> {
    const response = await this.createIframe(language)
    // Note: KycService.start() ajoute aussi le paramètre language à l'URL
    return `${response.chatbotURL}?session=${response.sessionId}&returnUrl=${encodeURIComponent(
      returnUrl
    )}&language=${encodeURIComponent(language)}`
  }
}
