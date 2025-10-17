// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de gestion des données privées (IBEx Safe)
 *
 * @module features/privacy
 */

import type { HttpClient } from '../../core/http';
import type {
  UserPrivateData,
  SaveUserDataResponse,
  ValidateEmailResponse,
  ConfirmEmailParams,
} from './privacy.types';

/**
 * Service de gestion de la vie privée
 */
export class PrivacyService {
  constructor(private http: HttpClient) {}

  /**
   * Récupère les données privées de l'utilisateur
   *
   * @param externalUserId - ID externe de l'utilisateur
   * @returns Données privées de l'utilisateur
   */
  async getUserData(externalUserId: string): Promise<UserPrivateData> {
    return this.http.request<UserPrivateData>(`/v1/ibexsafe/userdata/external/${externalUserId}`, {
      cache: true,
      cacheTTL: 300000, // 5 minutes
    });
  }

  /**
   * Sauvegarde les données privées de l'utilisateur
   *
   * @param externalUserId - ID externe de l'utilisateur
   * @param data - Données à sauvegarder (clés avec préfixe 'private.' non retournées en GET)
   * @returns Résultat de la sauvegarde
   */
  async saveUserData(
    externalUserId: string,
    data: Record<string, unknown>
  ): Promise<SaveUserDataResponse> {
    const result = await this.http.request<SaveUserDataResponse>('/v1/ibexsafe/userdata', {
      method: 'POST',
      body: { externalUserId, data },
      cache: false,
    });

    // Invalider le cache
    this.http.invalidateCache(externalUserId);

    return result;
  }

  /**
   * Valide une adresse email
   *
   * @param email - Email à valider
   * @param externalUserId - ID externe de l'utilisateur
   * @returns Réponse de validation
   */
  async validateEmail(email: string, externalUserId: string): Promise<ValidateEmailResponse> {
    return this.http.request<ValidateEmailResponse>('/v1/ibexsafe/validateEmail', {
      method: 'POST',
      body: { email, externalUserId },
      cache: false,
    });
  }

  /**
   * Confirme une adresse email avec le code reçu
   *
   * @param params - Paramètres de confirmation
   * @returns Résultat de la confirmation
   */
  async confirmEmail(params: ConfirmEmailParams): Promise<unknown> {
    const {
      email,
      code,
      externalUserId,
      userDataName = 'marketing.email',
      optinNews,
      optinNotifications,
    } = params;

    return this.http.request('/v1/ibexsafe/confirmEmail', {
      method: 'POST',
      body: {
        email,
        code,
        externalUserId,
        userDataName,
        optinNews,
        optinNotifications,
      },
      cache: false,
    });
  }
}
