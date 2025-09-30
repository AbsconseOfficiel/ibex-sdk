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
  onOperationUpdate?: (data: unknown) => void;
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
  private reconnectInterval: ReturnType<typeof setTimeout> | null = null;
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
  private handleMessage(message: unknown): void {
    if (!message || typeof message !== 'object') return;

    const msg = message as Record<string, unknown>;
    logger.debug('WebSocket', 'Message reçu', { type: msg.type });

    switch (msg.type) {
      case 'auth_success':
        logger.success('WebSocket', 'Authentification réussie', msg.data);
        this.callbacks.onAuthSuccess?.(msg.data as { safeAddress: string; message: string });
        break;

      case 'balance_data': {
        // Données de balance initiales
        const msgData = msg.data as Record<string, unknown>;
        if (msgData?.balance && typeof msgData.balance === 'object') {
          const balanceData = msgData.balance as Record<string, unknown>;
          if (balanceData.balance && typeof balanceData.balance === 'object') {
            const balance = balanceData.balance as Record<string, unknown>;
            this.callbacks.onBalanceUpdate?.({
              address: String(msgData.safeAddress || ''),
              balance: String(balance.balance || ''),
              updated_at: String(balance.timestamp || msg.timestamp || ''),
            });
          }
        }
        break;
      }

      case 'balance_update': {
        // Mise à jour de balance en temps réel
        const balanceData = msg.data as Record<string, unknown>;
        if (balanceData) {
          this.callbacks.onBalanceUpdate?.({
            address: String(balanceData.address || ''),
            balance: String(balanceData.balance || ''),
            updated_at: String(balanceData.updated_at || ''),
          });
        }
        break;
      }

      case 'transaction_data': {
        // Données de transactions initiales
        const transactionData = msg.data as Record<string, unknown>;
        if (transactionData?.transactions && typeof transactionData.transactions === 'object') {
          const transactionsData = transactionData.transactions as Record<string, unknown>;
          const transactions = transactionsData.data as unknown[];
          transactions.forEach((tx: unknown) => {
            if (!tx || typeof tx !== 'object') return;
            const txData = tx as Record<string, unknown>;
            this.callbacks.onNewTransaction?.({
              address: String(transactionData.safeAddress || ''),
              transaction: {
                hash: String(txData.transactionHash || ''),
                blockNumber: Number(txData.blockNumber || 0),
                timestamp: String(txData.timestamp || ''),
                from: String(txData.from || ''),
                to: String(txData.to || ''),
                value: String(txData.value || ''),
                direction: String(txData.direction || 'OUT') as 'IN' | 'OUT',
                tokenSymbol: 'EURe',
              },
            });
          });
        }
        break;
      }

      case 'new_transaction': {
        // Nouvelle transaction en temps réel
        const newTransactionData = msg.data as Record<string, unknown>;
        if (newTransactionData) {
          this.callbacks.onNewTransaction?.({
            address: String(newTransactionData.address || ''),
            transaction: {
              hash: String(newTransactionData.hash || ''),
              blockNumber: Number(newTransactionData.blockNumber || 0),
              timestamp: String(newTransactionData.timestamp || ''),
              from: String(newTransactionData.from || ''),
              to: String(newTransactionData.to || ''),
              value: String(newTransactionData.value || ''),
              direction: String(newTransactionData.direction || 'OUT') as 'IN' | 'OUT',
              tokenSymbol: 'EURe',
            },
          });
        }
        break;
      }

      case 'user_data': {
        // Données utilisateur
        const userData = msg.data as Record<string, unknown>;
        if (userData) {
          this.callbacks.onUserData?.({
            id: String(userData.id || ''),
            ky: String(userData.ky || '0'),
            signers: Array.isArray(userData.signers) ? userData.signers : [],
          });
        }
        break;
      }

      case 'operation_data': {
        // Données d'opérations initiales
        const operationData = msg.data as Record<string, unknown>;
        if (operationData?.operations && typeof operationData.operations === 'object') {
          const operationsData = operationData.operations as Record<string, unknown>;
          const operations = operationsData.data as unknown[];
          operations.forEach((op: unknown) => {
            this.callbacks.onOperationUpdate?.(op);
          });
        }
        break;
      }

      case 'user.iban.updated': {
        // Mise à jour du statut IBAN
        const ibanData = msg.data as Record<string, unknown>;
        logger.info('WebSocket', 'IBAN mis à jour', ibanData);
        if (ibanData) {
          this.callbacks.onIbanUpdate?.({
            safeAddress: String(ibanData.safeAddress || ''),
            iban: String(ibanData.iban || ''),
            previousState: String(ibanData.previousState || ''),
            newState: String(ibanData.newState || ''),
            updatedAt: String(ibanData.updatedAt || ''),
          });
        }
        break;
      }

      case 'user.kyc.updated': {
        // Mise à jour du statut KYC
        const kycData = msg.data as Record<string, unknown>;
        logger.info('WebSocket', 'KYC mis à jour', kycData);
        if (kycData) {
          this.callbacks.onKycUpdate?.({
            safeAddress: String(kycData.safeAddress || ''),
            previousKyc: String(kycData.previousKyc || ''),
            newKyc: String(kycData.newKyc || ''),
            updatedAt: String(kycData.updatedAt || ''),
          });
        }
        break;
      }

      case 'operation_update': {
        // Mise à jour d'opération en temps réel
        const operationUpdateData = msg.data as Record<string, unknown>;
        logger.info('WebSocket', 'Opération mise à jour', operationUpdateData);
        if (operationUpdateData) {
          this.callbacks.onOperationUpdate?.(operationUpdateData);
        }
        break;
      }

      case 'new_operation': {
        // Nouvelle opération en temps réel
        const newOperationData = msg.data as Record<string, unknown>;
        logger.info('WebSocket', 'Nouvelle opération', newOperationData);
        if (newOperationData) {
          this.callbacks.onOperationUpdate?.(newOperationData);
        }
        break;
      }

      case 'auth_error': {
        // Erreur d'authentification
        const errorData = msg.data as Record<string, unknown>;
        logger.error('WebSocket', "Erreur d'authentification", errorData);
        if (errorData) {
          this.callbacks.onError?.(String(errorData.message || "Erreur d'authentification"));
        }
        break;
      }

      case 'chainid_data': {
        // Données de chaîne (pas de callback nécessaire)
        const chainData = msg.data as Record<string, unknown>;
        logger.debug('WebSocket', 'Données de chaîne reçues', chainData);
        break;
      }

      case 'recovery_data': {
        // Données de récupération (pas de callback nécessaire)
        const recoveryData = msg.data as Record<string, unknown>;
        logger.debug('WebSocket', 'Données de récupération reçues', recoveryData);
        break;
      }

      default:
        logger.debug('WebSocket', 'Message type non géré', { type: msg.type });
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
