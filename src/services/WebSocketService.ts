// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service WebSocket pour les mises à jour temps réel
 *
 * TODO: Ajouter la gestion des messages en batch
 * TODO: Implémenter la compression des messages
 * TODO: Ajouter les métriques de performance
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketConfig {
  apiUrl: string;
  jwtToken: string;
  clientName?: string;
}

export interface BalanceUpdate {
  address: string;
  balance: string;
  updated_at: string;
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  tokenAddress?: string;
  tokenType?: string;
  tokenSymbol?: string;
  tokenName?: string;
  value: string;
  direction: 'IN' | 'OUT';
}

export interface NewTransactionUpdate {
  address: string;
  transaction: Transaction;
}

export interface UserData {
  id: string;
  ky: string;
  signers: Array<{
    id: string;
    safes: Array<{
      address: string;
      threshold: number;
      iban?: {
        chainId: number;
        iban: string;
        bic: string;
      };
    }>;
  }>;
}

export interface IbanUpdate {
  safeAddress: string;
  iban: string;
  previousState: string;
  newState: string;
  updatedAt: string;
}

export interface KycUpdate {
  safeAddress: string;
  previousKyc: string;
  newKyc: string;
  updatedAt: string;
}

export interface WebSocketCallbacks {
  onAuthSuccess?: (data: { safeAddress: string; message: string }) => void;
  onBalanceUpdate?: (data: BalanceUpdate) => void;
  onNewTransaction?: (data: NewTransactionUpdate) => void;
  onUserData?: (data: UserData) => void;
  onIbanUpdate?: (data: IbanUpdate) => void;
  onKycUpdate?: (data: KycUpdate) => void;
  onOperationUpdate?: (data: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

// ============================================================================
// SERVICE WEBSOCKET
// ============================================================================

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private callbacks: WebSocketCallbacks;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private isConnected = false;

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Établit la connexion WebSocket
   */
  connect(): void {
    try {
      logger.debug('WebSocket', 'Connexion au WebSocket IBEX...', { url: this.config.apiUrl });

      this.ws = new WebSocket(this.config.apiUrl);

      this.ws.onopen = () => {
        logger.success('WebSocket', 'Connecté au WebSocket IBEX');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.callbacks.onConnectionChange?.(true);

        // Envoie les credentials d'authentification
        this.ws?.send(
          JSON.stringify({
            type: 'auth',
            token: this.config.jwtToken,
            clientName: this.config.clientName || 'IBEX SDK Client',
          })
        );
      };

      this.ws.onmessage = event => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = event => {
        logger.warn('WebSocket', `Connexion fermée: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.callbacks.onConnectionChange?.(false);

        if (event.code === 1008) {
          // Code 1008 = Token invalide
          this.callbacks.onError?.('Token JWT invalide ou expiré');
          return;
        }

        this.scheduleReconnect();
      };

      this.ws.onerror = error => {
        logger.error('WebSocket', 'Erreur WebSocket', error);
        this.callbacks.onError?.('Erreur de connexion WebSocket');
      };
    } catch (error) {
      logger.error('WebSocket', 'Échec de connexion', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Traite les messages reçus du WebSocket
   */
  private handleMessage(message: any): void {
    logger.debug('WebSocket', 'Message reçu', { type: message.type });

    switch (message.type) {
      case 'auth_success':
        logger.success('WebSocket', 'Authentification réussie', message.data);
        this.callbacks.onAuthSuccess?.(message.data);
        break;

      case 'balance_data':
        // Données de balance initiales
        if (message.data?.balance?.balance?.balance) {
          this.callbacks.onBalanceUpdate?.({
            address: message.data.safeAddress,
            balance: message.data.balance.balance.balance,
            updated_at: message.data.balance.timestamp || message.timestamp,
          });
        }
        break;

      case 'balance_update':
        // Mise à jour de balance en temps réel
        this.callbacks.onBalanceUpdate?.(message.data);
        break;

      case 'transaction_data':
        // Données de transactions initiales
        if (message.data?.transactions?.data) {
          const transactions = message.data.transactions.data;
          transactions.forEach((tx: any) => {
            this.callbacks.onNewTransaction?.({
              address: message.data.safeAddress,
              transaction: {
                hash: tx.transactionHash,
                blockNumber: tx.blockNumber,
                timestamp: tx.timestamp,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                direction: tx.direction,
                tokenSymbol: 'EURe',
              },
            });
          });
        }
        break;

      case 'new_transaction':
        // Nouvelle transaction en temps réel
        this.callbacks.onNewTransaction?.(message.data);
        break;

      case 'user_data':
        // Données utilisateur
        this.callbacks.onUserData?.(message.data);
        break;

      case 'operation_data':
        // Données d'opérations initiales
        if (message.data?.operations?.data) {
          const operations = message.data.operations.data;
          operations.forEach((op: any) => {
            this.callbacks.onOperationUpdate?.(op);
          });
        }
        break;

      case 'user.iban.updated':
        // Mise à jour du statut IBAN
        logger.info('WebSocket', 'IBAN mis à jour', message.data);
        this.callbacks.onIbanUpdate?.(message.data);
        break;

      case 'user.kyc.updated':
        // Mise à jour du statut KYC
        logger.info('WebSocket', 'KYC mis à jour', message.data);
        this.callbacks.onKycUpdate?.(message.data);
        break;

      case 'operation_update':
        // Mise à jour d'opération en temps réel
        logger.info('WebSocket', 'Opération mise à jour', message.data);
        this.callbacks.onOperationUpdate?.(message.data);
        break;

      case 'new_operation':
        // Nouvelle opération en temps réel
        logger.info('WebSocket', 'Nouvelle opération', message.data);
        this.callbacks.onOperationUpdate?.(message.data);
        break;

      case 'auth_error':
        // Erreur d'authentification
        logger.error('WebSocket', "Erreur d'authentification", message.data);
        this.callbacks.onError?.(message.data.message || "Erreur d'authentification");
        break;

      case 'chainid_data':
        // Données de chaîne (pas de callback nécessaire)
        logger.debug('WebSocket', 'Données de chaîne reçues', message.data);
        break;

      case 'recovery_data':
        // Données de récupération (pas de callback nécessaire)
        logger.debug('WebSocket', 'Données de récupération reçues', message.data);
        break;

      default:
        logger.debug('WebSocket', 'Message type non géré', { type: message.type });
    }
  }

  /**
   * Programme une reconnexion avec délai progressif
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('WebSocket', 'Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    logger.debug('WebSocket', `Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Met à jour le token JWT et reconnecte
   */
  updateToken(newToken: string): void {
    this.config.jwtToken = newToken;

    // Reconnecte si déjà connecté
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.callbacks.onConnectionChange?.(false);
  }

  /**
   * Vérifie si la connexion est active
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
