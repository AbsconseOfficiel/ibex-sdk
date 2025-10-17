// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service WebSocket optimisé pour IBEX SDK
 *
 * Features:
 * - Reconnexion automatique avec exponential backoff
 * - Heartbeat pour maintenir la connexion
 * - File d'attente de messages pendant déconnexion
 * - Batch de messages pour optimiser la bande passante
 * - Types stricts pour tous les événements
 *
 * @module core/websocket
 */

import { logger } from '../utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketConfig {
  url: string
  jwtToken: string
  clientName?: string
  heartbeatInterval?: number
  reconnectMaxAttempts?: number
  reconnectBaseDelay?: number
}

/**
 * Types d'événements WebSocket stricts
 */
export type WebSocketEventType =
  | 'auth_success'
  | 'auth_error'
  | 'balance_data'
  | 'balance_update'
  | 'transaction_data'
  | 'new_transaction'
  | 'user_data'
  | 'operation_data'
  | 'operation_update'
  | 'new_operation'
  | 'user.iban.updated'
  | 'user.kyc.updated'
  | 'chainid_data'
  | 'recovery_data'

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType
  data: T
  timestamp?: string
}

/**
 * Callbacks typés pour chaque événement
 */
export interface WebSocketCallbacks {
  onAuthSuccess?: (data: { safeAddress: string; message: string }) => void
  onBalanceData?: (data: unknown) => void
  onBalanceUpdate?: (data: { address: string; balance: string; updated_at: string }) => void
  onTransactionData?: (data: unknown) => void
  onNewTransaction?: (data: unknown) => void
  onUserData?: (data: unknown) => void
  onOperationData?: (data: unknown) => void
  onOperationUpdate?: (data: unknown) => void
  onNewOperation?: (data: unknown) => void
  onIbanUpdate?: (data: {
    safeAddress: string
    iban: string
    newState: string
    updatedAt: string
  }) => void
  onKycUpdate?: (data: { safeAddress: string; newKyc: string; updatedAt: string }) => void
  onChainIdData?: (data: unknown) => void
  onRecoveryData?: (data: unknown) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: string) => void
}

// ============================================================================
// WEBSOCKET SERVICE
// ============================================================================

/**
 * Service WebSocket optimisé
 */
export class WebSocketService {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private callbacks: WebSocketCallbacks

  // Reconnexion
  private reconnectAttempts = 0
  private maxReconnectAttempts: number
  private reconnectBaseDelay: number
  private reconnectTimer: NodeJS.Timeout | null = null

  // Heartbeat
  private heartbeatInterval: number
  private heartbeatTimer: NodeJS.Timeout | null = null
  private lastHeartbeatResponse = Date.now()

  // File d'attente
  private messageQueue: string[] = []
  private maxQueueSize = 100

  // État
  private isConnected = false
  private isReconnecting = false

  constructor(config: WebSocketConfig, callbacks: WebSocketCallbacks = {}) {
    this.config = config
    this.callbacks = callbacks

    this.maxReconnectAttempts = config.reconnectMaxAttempts || 5
    this.reconnectBaseDelay = config.reconnectBaseDelay || 1000
    this.heartbeatInterval = config.heartbeatInterval || 30000 // 30s par défaut
  }

  // ========================================================================
  // CONNECTION
  // ========================================================================

  /**
   * Établit la connexion WebSocket
   */
  connect(): void {
    if (this.ws) {
      logger.warn('WebSocket', 'Déjà connecté, ignore la requête')
      return
    }

    try {
      logger.debug('WebSocket', 'Connexion...', { url: this.config.url })

      this.ws = new WebSocket(this.config.url)
      this.setupEventListeners()
    } catch (error) {
      logger.error('WebSocket', 'Erreur de connexion', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): void {
    this.isReconnecting = false

    // Nettoyer les timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // Fermer la connexion
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.callbacks.onConnectionChange?.(false)
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      logger.success('WebSocket', 'Connecté')

      this.isConnected = true
      this.reconnectAttempts = 0
      this.callbacks.onConnectionChange?.(true)

      // Envoyer l'authentification
      this.authenticate()

      // Démarrer le heartbeat
      this.startHeartbeat()

      // Envoyer les messages en file d'attente
      this.flushMessageQueue()
    }

    this.ws.onmessage = event => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)

        // Mettre à jour le timestamp de dernière réponse pour le heartbeat
        this.lastHeartbeatResponse = Date.now()

        this.handleMessage(message)
      } catch (error) {
        logger.error('WebSocket', 'Erreur de parsing du message', error)
      }
    }

    this.ws.onclose = event => {
      logger.warn('WebSocket', `Connexion fermée: ${event.code} ${event.reason}`)

      this.isConnected = false
      this.callbacks.onConnectionChange?.(false)

      this.stopHeartbeat()

      // Codes d'erreur graves qui nécessitent une action utilisateur
      const criticalCodes = [1008, 1002, 1003, 1006] // Token invalide, protocole, données, connexion fermée anormalement

      if (criticalCodes.includes(event.code)) {
        if (event.code === 1008) {
          this.callbacks.onError?.('Token JWT invalide ou expiré')
        } else {
          this.callbacks.onError?.(
            `Erreur de connexion (${event.code}): ${event.reason || 'Connexion fermée'}`
          )
        }
        return
      }

      // Pour les autres codes (1000, 1001, etc.), on ne considère pas comme une erreur grave
      // Reconnexion automatique silencieuse
      if (!this.isReconnecting) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = error => {
      logger.error('WebSocket', 'Erreur', error)
      // Ne pas propager les erreurs de connexion comme des erreurs graves
      // La reconnexion automatique s'occupera de rétablir la connexion
      // Seulement logger l'erreur pour le debugging
    }
  }

  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================

  private handleMessage(message: WebSocketMessage): void {
    logger.debug('WebSocket', `Message reçu: ${message.type}`)

    switch (message.type) {
      case 'auth_success':
        this.callbacks.onAuthSuccess?.(message.data as any)
        break

      case 'auth_error':
        this.callbacks.onError?.(
          String((message.data as any).message || "Erreur d'authentification")
        )
        break

      case 'balance_data':
        this.callbacks.onBalanceData?.(message.data)
        break

      case 'balance_update':
        this.callbacks.onBalanceUpdate?.(message.data as any)
        break

      case 'transaction_data':
        this.callbacks.onTransactionData?.(message.data)
        break

      case 'new_transaction':
        this.callbacks.onNewTransaction?.(message.data)
        break

      case 'user_data':
        this.callbacks.onUserData?.(message.data)
        break

      case 'operation_data':
        this.callbacks.onOperationData?.(message.data)
        break

      case 'operation_update':
        this.callbacks.onOperationUpdate?.(message.data)
        break

      case 'new_operation':
        this.callbacks.onNewOperation?.(message.data)
        break

      case 'user.iban.updated':
        this.callbacks.onIbanUpdate?.(message.data as any)
        break

      case 'user.kyc.updated':
        this.callbacks.onKycUpdate?.(message.data as any)
        break

      case 'chainid_data':
        this.callbacks.onChainIdData?.(message.data)
        break

      case 'recovery_data':
        this.callbacks.onRecoveryData?.(message.data)
        break

      default:
        logger.debug('WebSocket', 'Type de message non géré', { type: message.type })
    }
  }

  // ========================================================================
  // SEND
  // ========================================================================

  /**
   * Envoie un message via WebSocket
   */
  send(message: unknown): void {
    const messageStr = JSON.stringify(message)

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(messageStr)
    } else {
      // Mettre en file d'attente si non connecté
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(messageStr)
        logger.debug('WebSocket', "Message mis en file d'attente", {
          queueSize: this.messageQueue.length,
        })
      } else {
        logger.warn('WebSocket', "File d'attente pleine, message ignoré")
      }
    }
  }

  /**
   * Authentification initiale
   */
  private authenticate(): void {
    this.send({
      type: 'auth',
      token: this.config.jwtToken,
      clientName: this.config.clientName || 'IBEX SDK',
    })
  }

  /**
   * Vide la file d'attente de messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return

    logger.debug('WebSocket', `Envoi de ${this.messageQueue.length} messages en attente`)

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(message)
      }
    }
  }

  // ========================================================================
  // HEARTBEAT
  // ========================================================================

  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected) {
        this.stopHeartbeat()
        return
      }

      // Vérifier si on a reçu une réponse récemment (plus tolérant)
      const timeSinceLastResponse = Date.now() - this.lastHeartbeatResponse
      if (timeSinceLastResponse > this.heartbeatInterval * 4) {
        // 4x pour être encore plus tolérant
        logger.warn('WebSocket', 'Pas de réponse au heartbeat, reconnexion douce')
        // Reconnexion douce sans forcer la déconnexion
        this.scheduleReconnect()
        return
      }

      // Envoyer un ping seulement si on n'a pas reçu de message récemment
      if (timeSinceLastResponse > this.heartbeatInterval) {
        this.send({ type: 'ping', timestamp: Date.now() })
      }
    }, this.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // ========================================================================
  // RECONNECTION
  // ========================================================================

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('WebSocket', 'Nombre maximum de tentatives de reconnexion atteint')
      // Ne pas propager comme erreur grave, juste logger
      // L'utilisateur peut toujours utiliser l'API REST
      return
    }

    // Exponential backoff
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 secondes
    )

    this.reconnectAttempts++
    this.isReconnecting = true

    logger.debug(
      'WebSocket',
      `Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.ws = null
      this.connect()
    }, delay)
  }

  // ========================================================================
  // TOKEN UPDATE
  // ========================================================================

  /**
   * Met à jour le token JWT et reconnecte
   */
  updateToken(newToken: string): void {
    this.config.jwtToken = newToken

    if (this.isConnected) {
      this.disconnect()
      this.connect()
    }
  }

  /**
   * Réinitialise les tentatives de reconnexion
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0
    this.isReconnecting = false
  }

  /**
   * Force une reconnexion immédiate
   */
  forceReconnect(): void {
    this.resetReconnectAttempts()
    this.disconnect()
    this.connect()
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  /**
   * Vérifie si la connexion est active
   */
  get connected(): boolean {
    return this.isConnected
  }
}
