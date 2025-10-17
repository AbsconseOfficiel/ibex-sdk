// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service d'authentification IBEX
 *
 * Gère:
 * - Inscription (sign-up) avec passkeys
 * - Connexion (sign-in) avec passkeys
 * - Refresh token
 * - Iframe KYC
 *
 * @module features/auth
 */

import type { HttpClient } from '../../core/http';
import type { AuthResponse, IframeResponse } from './auth.types';
import {
  prepareWebAuthnRegistrationOptions,
  prepareWebAuthnAuthenticationOptions,
} from '../../utils/webauthn';

/**
 * Service d'authentification
 */
export class AuthService {
  constructor(private http: HttpClient) {}

  /**
   * Inscription d'un nouvel utilisateur
   *
   * @param passkeyName - Nom optionnel pour le passkey
   * @returns Réponse d'authentification avec tokens
   *
   * @example
   * ```typescript
   * const auth = await authService.signUp('My iPhone');
   * console.log(auth.access_token);
   * ```
   */
  async signUp(passkeyName?: string): Promise<AuthResponse> {
    // 1. Obtenir les options d'inscription
    const challengeResponse = await this.http.request<{
      credentialRequestOptions: unknown;
    }>('/v1/auth/sign-up', { method: 'GET' });

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnRegistrationOptions(challengeResponse.credentialRequestOptions);

    // 3. Créer les credentials WebAuthn
    const credential = await navigator.credentials.create({
      publicKey: options as PublicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error('Échec de la création des credentials');
    }

    // 4. Finaliser l'inscription
    const authResponse = await this.http.request<AuthResponse>('/v1/auth/sign-up', {
      method: 'POST',
      body: {
        credential,
        chainId: 421614,
        keyName: passkeyName,
        keyDisplayName: passkeyName,
      },
    });

    // 5. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.http.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
  }

  /**
   * Connexion d'un utilisateur existant
   *
   * @returns Réponse d'authentification avec tokens
   *
   * @example
   * ```typescript
   * const auth = await authService.signIn();
   * console.log(auth.access_token);
   * ```
   */
  async signIn(): Promise<AuthResponse> {
    // 1. Obtenir les options de connexion
    const challengeResponse = await this.http.request<{
      credentialRequestOptions: unknown;
    }>('/v1/auth/sign-in', { method: 'GET' });

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnAuthenticationOptions(
      challengeResponse.credentialRequestOptions
    );

    // 3. Obtenir les credentials WebAuthn
    const credential = await navigator.credentials.get({
      publicKey: options as PublicKeyCredentialRequestOptions,
    });

    if (!credential) {
      throw new Error("Échec de l'authentification");
    }

    // 4. Finaliser la connexion
    const authResponse = await this.http.request<AuthResponse>('/v1/auth/sign-in', {
      method: 'POST',
      body: { credential, chainId: 421614 },
    });

    // 5. Sauvegarder les tokens
    if (authResponse.access_token) {
      this.http.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
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
    this.http.clearTokens();
    this.http.clearCache();
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
    });

    if (authResponse.access_token) {
      this.http.setTokens(authResponse.access_token, authResponse.refresh_token);
    }

    return authResponse;
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
    });
  }

  /**
   * Crée une URL de redirection complète pour le KYC
   *
   * @param language - Langue de l'iframe (défaut: 'fr')
   * @param returnUrl - URL de retour après KYC (défaut: location.origin)
   * @returns URL de redirection complète
   *
   * @example
   * ```typescript
   * const kycUrl = await authService.createKycRedirectUrl('fr', 'https://myapp.com/kyc-callback');
   * window.location.href = kycUrl;
   * ```
   */
  async createKycRedirectUrl(
    language: string = 'fr',
    returnUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
  ): Promise<string> {
    const response = await this.createIframe(language);
    return `${response.chatbotURL}?session=${response.sessionId}&returnUrl=${encodeURIComponent(
      returnUrl
    )}`;
  }
}
