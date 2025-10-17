// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Hook React principal pour IBEX SDK
 *
 * Interface simplifiée pour accéder à toutes les fonctionnalités IBEX.
 * Architecture basée sur le nouveau client SDK modulaire.
 *
 * @example
 * ```typescript
 * function MyApp() {
 *   const {
 *     user,
 *     wallet,
 *     balance,
 *     transactions,
 *     operations,
 *     isLoading,
 *     error,
 *     signIn,
 *     signUp,
 *     send,
 *     receive,
 *     startKyc,
 *     sdk
 *   } = useIbex();
 *
 *   // Usage avancé via SDK
 *   await sdk.safe.enableRecovery({ ... });
 *   await sdk.privacy.saveUserData({ ... });
 * }
 * ```
 *
 * @module hooks/useIbex
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { IbexClient } from '../core/client'
import { WebSocketService } from '../core/websocket'
import { useIbexConfig } from '../context/IbexProvider'
import { logger } from '../utils/logger'
import type { User, Wallet, Balance, Transaction, Operation } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface IbexData {
  user: User | null
  wallet: Wallet | null
  balance: Balance
  transactions: Transaction[]
  operations: Operation[]
}

interface IbexReturn {
  // Données
  user: User | null
  wallet: Wallet | null
  balance: number
  transactions: Transaction[]
  operations: Operation[]

  // États
  isLoading: boolean
  error: string | null
  isConnected: boolean

  // Actions rapides
  signIn: () => Promise<void>
  signUp: (passkeyName?: string) => Promise<void>
  logout: () => Promise<void>
  send: (amount: number, to: string) => Promise<void>
  receive: () => Promise<string>
  startKyc: (language?: string) => Promise<string>
  refresh: () => Promise<void>
  clearError: () => void

  // Accès au SDK complet pour usage avancé
  sdk: IbexClient
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook principal pour utiliser IBEX SDK
 */
export function useIbex(): IbexReturn {
  const { config } = useIbexConfig()
  const [client] = useState(() => new IbexClient(config))

  const [data, setData] = useState<IbexData>({
    user: null,
    wallet: null,
    balance: { amount: 0, symbol: 'EURe', usdValue: 0 },
    transactions: [],
    operations: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const wsRef = useRef<WebSocketService | null>(null)
  const isInitialized = useRef(false)

  // ========================================================================
  // WEBSOCKET SETUP
  // ========================================================================

  const setupWebSocket = useCallback(
    async (token: string) => {
      const wsUrl = config.baseURL.replace('http', 'ws') + '/ws'

      const wsService = new WebSocketService(
        {
          url: wsUrl,
          jwtToken: token,
          clientName: 'IBEX SDK',
        },
        {
          onConnectionChange: connected => {
            setIsConnected(connected)
          },

          onBalanceData: (data: any) => {
            if (data?.balance?.balance) {
              const amount = parseFloat(data.balance.balance.balance || '0')
              setData(prev => ({
                ...prev,
                balance: { amount, symbol: 'EURe', usdValue: 0 },
              }))
            }
          },

          onBalanceUpdate: (data: any) => {
            const amount = parseFloat(data.balance || '0')
            setData(prev => ({
              ...prev,
              balance: { amount, symbol: 'EURe', usdValue: 0 },
            }))
          },

          onUserData: (userData: any) => {
            const kycLevel = parseInt(userData.ky || '0', 10)
            const statusMap: Record<number, User['kyc']['status']> = {
              0: 'not_started',
              1: 'in_progress',
              2: 'dossier_sent',
              3: 'missing_document',
              4: 'rejected',
              5: 'verified',
            }

            const user: User = {
              id: userData.id || '',
              email: kycLevel >= 5 ? userData.email || null : null,
              kyc: {
                status: statusMap[kycLevel] || 'not_started',
                level: kycLevel,
              },
            }

            let wallet: Wallet | null = null
            if (userData.signers?.[0]?.safes?.[0]) {
              const safe = userData.signers[0].safes[0]
              wallet = {
                address: safe.address || '',
                isConnected: true,
                chainId: safe.chainId || 421614,
              }
            }

            setData(prev => ({ ...prev, user, wallet }))
          },

          onTransactionData: (txData: any) => {
            if (txData?.transactions?.data) {
              const transactions = txData.transactions.data
                .map((tx: any) => transformTransaction(tx))
                .filter((tx: Transaction | null) => tx !== null)

              setData(prev => ({
                ...prev,
                transactions: deduplicateTransactions(transactions as Transaction[]),
              }))
            }
          },

          onNewTransaction: (tx: any) => {
            const transaction = transformTransaction(tx)
            if (transaction) {
              setData(prev => ({
                ...prev,
                transactions: deduplicateTransactions([transaction, ...prev.transactions]).slice(
                  0,
                  50
                ),
              }))
            }
          },

          onOperationData: (opData: any) => {
            if (opData?.operations) {
              const operations = opData.operations
                .filter((op: any) => {
                  const status = op.safeOperation?.status || op.status
                  return status === 'EXECUTED' || status === 'executed'
                })
                .map((op: any) => transformOperation(op))

              setData(prev => ({ ...prev, operations }))
            }
          },

          onOperationUpdate: (op: any) => {
            const operation = transformOperation(op)
            setData(prev => {
              const existingIndex = prev.operations.findIndex(o => o.id === operation.id)
              if (existingIndex >= 0) {
                const updatedOps = [...prev.operations]
                updatedOps[existingIndex] = operation
                return { ...prev, operations: updatedOps }
              } else {
                return { ...prev, operations: [operation, ...prev.operations] }
              }
            })
          },

          onKycUpdate: (kycData: any) => {
            setData(prev => {
              if (!prev.user) return prev
              const level = parseInt(kycData.newKyc || '0', 10)
              const statusMap: Record<number, User['kyc']['status']> = {
                0: 'not_started',
                1: 'in_progress',
                2: 'dossier_sent',
                3: 'missing_document',
                4: 'rejected',
                5: 'verified',
              }
              return {
                ...prev,
                user: {
                  ...prev.user,
                  kyc: {
                    status: statusMap[level] || 'not_started',
                    level,
                    updatedAt: kycData.updatedAt,
                  },
                },
              }
            })
          },

          onError: errorMessage => {
            setError(errorMessage)
          },
        }
      )

      wsService.connect()
      wsRef.current = wsService
    },
    [config.baseURL]
  )

  // ========================================================================
  // TRANSFORMERS
  // ========================================================================

  const transformTransaction = (tx: any): Transaction | null => {
    if (!tx || typeof tx !== 'object') return null

    const txData = tx.newTransaction || tx.transaction || tx
    if (!txData) return null

    const isNewFormat = !!tx.newTransaction
    const amount = isNewFormat
      ? parseFloat(txData.value || '0')
      : parseFloat(txData.value || '0') / Math.pow(10, 18)

    return {
      id: txData.transactionHash || txData.hash || txData.id || '',
      amount,
      type: (txData.direction || 'OUT') === 'IN' ? 'IN' : 'OUT',
      status: 'confirmed',
      date: txData.timestamp || new Date().toISOString(),
      hash: txData.transactionHash || txData.hash || '',
      from: txData.from || '',
      to: txData.to || '',
    }
  }

  const transformOperation = (op: any): Operation => {
    const amount = parseFloat(op.data?.params?.amount || op.amount || '0')
    return {
      id: op.id || '',
      type: op.type || 'TRANSFER',
      status: (op.safeOperation?.status || op.status || 'unknown').toLowerCase(),
      amount,
      createdAt: op.createdAt || '',
      safeOperation: op.safeOperation
        ? {
            userOpHash: op.safeOperation.userOpHash,
            status: op.safeOperation.status,
          }
        : undefined,
    }
  }

  const deduplicateTransactions = (transactions: Transaction[]): Transaction[] => {
    const seen = new Set<string>()
    return transactions.filter(tx => {
      if (seen.has(tx.id)) return false
      seen.add(tx.id)
      return true
    })
  }

  // ========================================================================
  // LOAD INITIAL DATA
  // ========================================================================

  const loadInitialData = useCallback(async () => {
    if (isInitialized.current) return
    isInitialized.current = true

    setIsLoading(true)

    try {
      const token = client.getToken()
      if (!token) {
        logger.debug('HOOK', 'Pas de token - Utilisateur non authentifié')
        setIsLoading(false)
        return
      }

      // Charger les opérations initiales
      try {
        const ops = await client.getUserOperations()
        const operations = (ops.data || [])
          .filter((op: any) => {
            const status = op.safeOperation?.status || op.status
            return status === 'EXECUTED' || status === 'executed'
          })
          .map((op: any) => transformOperation(op))

        setData(prev => ({ ...prev, operations }))
      } catch (error) {
        logger.error('HOOK', 'Erreur chargement opérations', error)
      }

      // Setup WebSocket
      await setupWebSocket(token)

      logger.success('HOOK', 'Données initiales chargées')
    } catch (error) {
      logger.error('HOOK', 'Erreur chargement initial', error)
      setError(error instanceof Error ? error.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [client, setupWebSocket])

  // ========================================================================
  // ACTIONS PUBLIQUES
  // ========================================================================

  const signIn = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await client.signIn()
      await loadInitialData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [client, loadInitialData])

  const signUp = useCallback(
    async (passkeyName?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        await client.signUp(passkeyName)
        await loadInitialData()
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erreur d'inscription")
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [client, loadInitialData]
  )

  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      await client.logout()
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    } finally {
      setData({
        user: null,
        wallet: null,
        balance: { amount: 0, symbol: 'EURe', usdValue: 0 },
        transactions: [],
        operations: [],
      })
      isInitialized.current = false
      setIsLoading(false)
    }
  }, [client])

  const send = useCallback(
    async (amount: number, to: string) => {
      if (!data.wallet?.address) throw new Error('Portefeuille non connecté')

      setIsLoading(true)
      setError(null)

      try {
        await client.transfer({
          safeAddress: data.wallet.address,
          chainId: data.wallet.chainId,
          to,
          amount,
        })
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erreur d'envoi")
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [data.wallet, client]
  )

  const receive = useCallback(async (): Promise<string> => {
    if (!data.wallet?.address) throw new Error('Portefeuille non connecté')
    return data.wallet.address
  }, [data.wallet])

  const startKyc = useCallback(
    async (language: string = 'fr'): Promise<string> => {
      setError(null)
      try {
        return await client.startKyc(language)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erreur KYC')
        throw error
      }
    },
    [client]
  )

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await loadInitialData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de rafraîchissement')
    } finally {
      setIsLoading(false)
    }
  }, [loadInitialData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const token = client.getToken()
      if (!token || !mounted) return

      try {
        await loadInitialData()
      } catch (error) {
        if (!mounted) return
        if (
          error instanceof Error &&
          (error.message.includes('401') || error.message.includes('Unauthorized'))
        ) {
          logger.auth("Token invalide - Reset de l'état")
          setData({
            user: null,
            wallet: null,
            balance: { amount: 0, symbol: 'EURe', usdValue: 0 },
            transactions: [],
            operations: [],
          })
        }
      }
    }

    load()

    return () => {
      mounted = false
      isInitialized.current = false
      if (wsRef.current) {
        wsRef.current.disconnect()
      }
    }
  }, [client, loadInitialData])

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // Données
    user: data.user,
    wallet: data.wallet,
    balance: data.balance.amount,
    transactions: data.transactions,
    operations: data.operations,

    // États
    isLoading,
    error,
    isConnected,

    // Actions
    signIn,
    signUp,
    logout,
    send,
    receive,
    startKyc,
    refresh,
    clearError,

    // SDK complet pour usage avancé
    sdk: client,
  }
}
