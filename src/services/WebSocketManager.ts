// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Manager WebSocket singleton
 *
 * TODO: Ajouter la gestion des reconnexions automatiques
 * TODO: Implémenter le monitoring de la connexion
 * TODO: Ajouter les tests de connectivité
 */

import { WebSocketService, WebSocketConfig, WebSocketCallbacks } from './WebSocketService';
import { logger } from '../utils/logger';

export class WebSocketManager {
  private static instance: WebSocketService | null = null;
  private static isConnecting = false;
  private static connectionPromise: Promise<void> | null = null;

  /**
   * Récupère l'instance WebSocket actuelle
   */
  static getInstance(): WebSocketService | null {
    return this.instance;
  }

  /**
   * Établit une connexion WebSocket
   */
  static async connect(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}): Promise<void> {
    // Évite les connexions multiples
    if (this.instance && this.instance.connected) {
      logger.debug('WebSocketManager', 'Instance déjà connectée');
      return;
    }

    // Attend la fin d'une connexion en cours
    if (this.isConnecting && this.connectionPromise) {
      logger.debug('WebSocketManager', 'Connexion en cours, attente...');
      await this.connectionPromise;
      return;
    }

    // Nettoie l'ancienne instance si déconnectée
    if (this.instance && !this.instance.connected) {
      logger.debug('WebSocketManager', "Nettoyage de l'ancienne instance déconnectée");
      this.instance.disconnect();
      this.instance = null;
    }

    this.isConnecting = true;
    this.connectionPromise = (async () => {
      try {
        logger.debug('WebSocketManager', 'Création de la nouvelle instance WebSocket');
        this.instance = new WebSocketService(config, callbacks);
        this.instance.connect();

        // Attend que la connexion soit établie
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout de connexion WebSocket'));
          }, 10000);

          const onConnectionChange = (connected: boolean) => {
            clearTimeout(timeout);
            if (connected) {
              logger.success('WebSocketManager', 'Instance unique connectée');
              resolve();
            } else {
              reject(new Error('Échec de connexion WebSocket'));
            }
          };

          // Ajoute temporairement le callback de connexion
          const originalCallback = callbacks.onConnectionChange;
          callbacks.onConnectionChange = connected => {
            onConnectionChange(connected);
            originalCallback?.(connected);
          };
        });
      } catch (error) {
        logger.error('WebSocketManager', 'Erreur de connexion', error);
        this.instance = null;
        throw error;
      } finally {
        this.isConnecting = false;
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Ferme la connexion WebSocket
   */
  static disconnect(): void {
    if (this.instance) {
      logger.debug('WebSocketManager', "Déconnexion de l'instance unique");
      this.instance.disconnect();
      this.instance = null;
    }
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  /**
   * Met à jour le token JWT
   */
  static updateToken(newToken: string): void {
    if (this.instance) {
      this.instance.updateToken(newToken);
    }
  }

  /**
   * Vérifie si la connexion est active
   */
  static get connected(): boolean {
    return this.instance?.connected || false;
  }

  /**
   * Remet à zéro l'instance (pour les tests)
   */
  static reset(): void {
    this.disconnect();
    this.instance = null;
    this.isConnecting = false;
    this.connectionPromise = null;
  }
}
