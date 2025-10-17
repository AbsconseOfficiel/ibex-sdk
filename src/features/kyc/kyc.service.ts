// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service KYC IBEX
 *
 * @module features/kyc
 */

import type { HttpClient } from '../../core/http'
import type { IframeResponse } from '../auth/auth.types'

/**
 * Service de vérification d'identité (KYC)
 */
export class KycService {
  constructor(private http: HttpClient) {}

  /**
   * Démarre le processus KYC
   *
   * @param language - Langue de l'interface KYC
   * @param returnUrl - URL de retour après KYC
   * @returns URL de redirection KYC complète
   */
  async start(language: string = 'fr', returnUrl?: string): Promise<string> {
    const iframe = await this.http.request<IframeResponse>('/v1/auth/iframe', {
      method: 'POST',
      body: { language },
      cache: false,
    })

    const finalReturnUrl =
      returnUrl || (typeof window !== 'undefined' ? window.location.origin : '')

    // Ajouter le paramètre language à l'URL du chatbot KYC
    return `${iframe.chatbotURL}?session=${iframe.sessionId}&returnUrl=${encodeURIComponent(
      finalReturnUrl
    )}&language=${encodeURIComponent(language)}`
  }

  /**
   * Récupère le statut KYC depuis les données utilisateur
   *
   * Note: Le statut KYC est inclus dans les données utilisateur (/v1/users/me)
   * et mis à jour via WebSocket (user.kyc.updated)
   */
  async getStatus(): Promise<{ level: number; status: string }> {
    const userData = await this.http.request<{
      ky: string
    }>('/v1/users/me', {
      cache: true,
      cacheTTL: 60000,
    })

    const level = parseInt(userData.ky || '0', 10)

    // Mapper le level au status
    const statusMap: Record<number, string> = {
      0: 'not_started',
      1: 'in_progress',
      2: 'dossier_sent',
      3: 'missing_document',
      4: 'rejected',
      5: 'verified',
    }

    return {
      level,
      status: statusMap[level] || 'unknown',
    }
  }
}
