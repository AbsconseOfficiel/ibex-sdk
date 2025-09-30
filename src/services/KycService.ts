// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Service KYC IBEX conforme au Swagger
 * Gestion du processus de vérification d'identité
 */

import type { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../core/CacheManager';

/**
 * Service KYC conforme au Swagger IBEX
 */
export class KycService {
  constructor(private apiClient: ApiClient, private cacheManager: CacheManager) {}

  // ========================================================================
  // IFRAME KYC
  // ========================================================================

  /**
   * Créer un iframe KYC
   * POST /v1/auth/iframe
   */
  async createIframe(language: string = 'fr'): Promise<{
    chatbotURL: string;
    sessionId: string;
  }> {
    const response = await this.apiClient.request<{
      chatbotURL: string;
      sessionId: string;
    }>('/v1/auth/iframe', {
      method: 'POST',
      body: { language },
      cache: false, // Ne pas cacher les requêtes KYC
    });

    return response;
  }

  /**
   * Créer une URL de redirection complète pour le KYC
   * Format: redirectUrl = ${chatbotURL}?session=${sessionId}&returnUrl=${encodeURIComponent(appUrl)}
   */
  async createKycRedirectUrl(
    language: string = 'fr',
    appUrl: string = window.location.origin
  ): Promise<string> {
    const response = await this.createIframe(language);

    const redirectUrl = `${response.chatbotURL}?session=${
      response.sessionId
    }&returnUrl=${encodeURIComponent(appUrl)}`;

    return redirectUrl;
  }

  // ========================================================================
  // STATUT KYC
  // ========================================================================

  /**
   * Le statut KYC est inclus dans /v1/users/me via le champ 'ky'
   * Cette méthode extrait le statut depuis les détails utilisateur
   */
  getKycStatusFromUserDetails(userDetails: unknown): {
    status: 'pending' | 'verified' | 'rejected';
    level: number;
    label: string;
    description: string;
  } {
    const userData = userDetails as Record<string, unknown>;
    const kyLevel = userData.ky || '0';
    const level = parseInt(String(kyLevel), 10);

    // Mapping des statuts selon les spécifications IBEX
    const status = level >= 5 ? 'verified' : 'pending';

    const labelMap: Record<number, string> = {
      1: 'En cours',
      2: 'Dossier envoyé',
      3: 'Manque de pièce',
      4: 'Refusé',
      5: 'Accepté',
    };

    const descriptionMap: Record<string, string> = {
      pending: 'Votre dossier KYC est en cours de traitement',
      verified: 'Votre identité a été vérifiée avec succès',
      rejected: 'Votre dossier KYC a été rejeté',
    };

    return {
      status,
      level,
      label: labelMap[level] || 'Non défini',
      description: descriptionMap[status] || 'Statut inconnu',
    };
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Invalider le cache KYC
   */
  invalidateKycCache(): void {
    this.cacheManager.invalidateByTag(CacheManager.TAGS.KYC);
  }
}
