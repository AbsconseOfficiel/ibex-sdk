// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Hook principal pour l'intégration IBEX
 *
 * TODO: Ajouter la gestion des erreurs réseau
 * TODO: Implémenter le cache des données
 * TODO: Ajouter les tests unitaires
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { IbexClient } from '../core/IbexClient';
import { WebSocketManager } from '../services/WebSocketManager';
import { WebSocketConfig } from '../services/WebSocketService';
import { logger } from '../utils/logger';
import type { IbexConfig, User, Wallet, Operation, Balance, Transaction } from '../types';

// ============================================================================
// TYPES INTERNES
// ============================================================================

interface IbexData {
  user: User | null;
  wallet: Wallet | null;
  balance: Balance;
  transactions: Transaction[];
  operations: Operation[];
}

interface IbexReturn {
  // Données principales
  balance: number;
  transactions: Transaction[];
  operations: Operation[];
  user: User | null;
  wallet: Wallet | null;

  // État
  isLoading: boolean;
  error: string | null;
  isWebSocketConnected: boolean;

  // Actions
  signIn: () => Promise<void>;
  signUp: (passkeyName?: string) => Promise<void>;
  logout: () => Promise<void>;
  send: (amount: number, to: string) => Promise<void>;
  receive: () => Promise<string>;
  withdraw: (amount: number, iban: string) => Promise<void>;
  startKyc: (language?: string) => Promise<string>;
  refresh: () => Promise<void>;
  clearError: () => void;

  // Actions IBEX Safe
  getUserPrivateData: (externalUserId: string) => Promise<Record<string, any>>;
  saveUserPrivateData: (
    externalUserId: string,
    data: Record<string, any>
  ) => Promise<{ success: boolean }>;
  validateEmail: (email: string, externalUserId: string) => Promise<any>;
  confirmEmail: (
    email: string,
    code: string,
    externalUserId: string,
    options?: any
  ) => Promise<any>;

  // Utilitaires
  getKycStatusLabel: (level: number) => string;
  getOperationTypeLabel: (type: string) => string;
  getOperationStatusLabel: (status: string) => string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useIbex(config: IbexConfig): IbexReturn {
  const [client] = useState(() => new IbexClient(config));
  const [data, setData] = useState<IbexData>({
    user: null,
    wallet: null,
    balance: { amount: 0, symbol: 'EURe', usdValue: 0 },
    transactions: [],
    operations: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  const isInitialized = useRef(false);
  const wsCallbacksRef = useRef<any>(null);

  // ========================================================================
  // UTILITAIRES STABLES
  // ========================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, message: string) => {
    logger.error('HOOK', message, error);
    setError(error instanceof Error ? error.message : message);
  }, []);

  // ========================================================================
  // TRANSFORMATIONS DE DONNÉES
  // ========================================================================

  // Déduplique les transactions par ID
  const deduplicateTransactions = useCallback((transactions: Transaction[]): Transaction[] => {
    const seen = new Set<string>();
    return transactions.filter(tx => {
      if (seen.has(tx.id)) return false;
      seen.add(tx.id);
      return true;
    });
  }, []);

  const transformUser = useCallback((userData: any): User | null => {
    if (!userData) return null;

    const kycLevel = parseInt(userData.ky || '0', 10);
    const email = kycLevel >= 5 ? userData.email : null;

    return {
      id: userData.id,
      email,
      kyc: {
        status: kycLevel >= 5 ? 'verified' : 'pending',
        level: kycLevel,
      },
    };
  }, []);

  const transformWallet = useCallback((userData: any): Wallet | null => {
    if (!userData?.signers?.[0]?.safes?.[0]) return null;

    const safe = userData.signers[0].safes[0];
    return {
      address: safe.address,
      isConnected: true,
      chainId: safe.chainId || 421614,
    };
  }, []);

  // Convertit les données de transaction en format standard
  const transformTransaction = useCallback((tx: any): Transaction => {
    // Gère les deux formats : historique (transaction_data) et temps réel (new_transaction)
    let transactionData;
    let isNewTransaction = false;

    if (tx.newTransaction) {
      // Format new_transaction : les données sont dans tx.newTransaction
      transactionData = tx.newTransaction;
      isNewTransaction = true;
    } else if (tx.transaction) {
      // Format transaction_data : les données sont dans tx.transaction
      transactionData = tx.transaction;
    } else {
      // Format direct
      transactionData = tx;
    }

    // Calcul du montant selon le format
    let amount;
    if (isNewTransaction) {
      // Pour new_transaction : la valeur est déjà en EURe (pas de conversion wei)
      amount = parseFloat(transactionData.value || '0');
    } else {
      // Pour transaction_data : convertir wei en EURe (1 EURe = 10^18 wei)
      const amountInWei = transactionData.value || '0';
      amount =
        typeof amountInWei === 'string' ? parseFloat(amountInWei) / Math.pow(10, 18) : amountInWei;
    }

    // Utilise le hash comme ID unique pour éviter les doublons
    const id =
      transactionData.transactionHash || transactionData.hash || String(transactionData.id);

    const result = {
      id,
      amount,
      type: transactionData.direction === 'IN' ? 'IN' : 'OUT',
      status: 'confirmed' as const,
      date: transactionData.timestamp,
      hash: transactionData.transactionHash || transactionData.hash,
      from: transactionData.from,
      to: transactionData.to,
    };

    return result as Transaction;
  }, []);

  const transformOperation = useCallback((op: any): Operation => {
    // Les opérations utilisent déjà le bon format (pas de conversion wei)
    const amount = parseFloat(op.data?.params?.amount || '0');

    return {
      id: op.id,
      type: op.type as any,
      status: op.safeOperation?.status || op.status || 'unknown',
      amount: amount,
      createdAt: op.createdAt,
      ...(op.safeOperation && {
        safeOperation: {
          userOpHash: op.safeOperation.userOpHash,
          status: op.safeOperation.status,
        },
      }),
    };
  }, []);

  // ========================================================================
  // RECHARGEMENT DES OPÉRATIONS
  // ========================================================================

  // Debounce pour éviter les appels multiples
  const refreshOperationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingOperationsRef = useRef<boolean>(false);

  const refreshOperations = useCallback(async () => {
    // Évite les appels simultanés
    if (isRefreshingOperationsRef.current) {
      return;
    }

    // Annule le refresh précédent s'il est en cours
    if (refreshOperationsTimeoutRef.current) {
      clearTimeout(refreshOperationsTimeoutRef.current);
    }

    // Programme un nouveau refresh avec un délai de 500ms
    refreshOperationsTimeoutRef.current = setTimeout(async () => {
      try {
        isRefreshingOperationsRef.current = true;

        const token = client.getToken();
        if (!token) return;

        const opData = await client.getUserOperations();
        const operations = (opData?.data || [])
          .filter((op: any) => {
            // Filtre seulement les opérations exécutées
            const safeStatus = op.safeOperation?.status;
            return safeStatus === 'EXECUTED';
          })
          .map(transformOperation);

        setData(prev => ({
          ...prev,
          operations,
        }));

        logger.info('OPERATIONS', 'Opérations rafraîchies', { count: operations.length });
      } catch (error) {
        logger.debug('OPERATIONS', 'Erreur lors du rafraîchissement des opérations', error);
      } finally {
        isRefreshingOperationsRef.current = false;
      }
    }, 500);
  }, [client, transformOperation]);

  // ========================================================================
  // CALLBACKS WEBSOCKET
  // ========================================================================

  // Crée les callbacks une seule fois pour éviter les re-renders
  const createWebSocketCallbacks = useCallback(() => {
    if (wsCallbacksRef.current) return wsCallbacksRef.current;

    const callbacks = {
      onAuthSuccess: (data: any) => {
        logger.success('WebSocket', 'Authentifié avec succès', data);
      },

      // Met à jour le solde quand reçu via WebSocket
      onBalanceUpdate: (data: any) => {
        setData(prev => ({
          ...prev,
          balance: {
            amount: parseFloat(data.balance) || 0,
            symbol: 'EURe',
            usdValue: 0,
          },
        }));

        // Rafraîchit les opérations quand le solde change
        // car cela peut indiquer une nouvelle activité
        refreshOperations();
      },

      // Ajoute une nouvelle transaction à la liste (évite les doublons)
      onNewTransaction: (data: any) => {
        const transaction = transformTransaction(data);

        setData(prev => {
          // Vérifie si la transaction existe déjà
          const exists = prev.transactions.some(tx => tx.id === transaction.id);
          if (exists) return prev;

          // Ajoute la nouvelle transaction et déduplique
          const newTransactions = [transaction, ...prev.transactions];
          const deduplicated = deduplicateTransactions(newTransactions);

          return {
            ...prev,
            transactions: deduplicated.slice(0, 50), // Limite à 50 transactions
          };
        });

        // Rafraîchit les opérations quand une nouvelle transaction arrive
        // car les opérations peuvent être liées aux transactions
        refreshOperations();
      },

      onUserData: (userData: any) => {
        setData(prev => ({
          ...prev,
          user: transformUser(userData),
          wallet: transformWallet(userData),
        }));
      },

      onIbanUpdate: (ibanData: any) => {
        logger.info('IBAN', 'Statut IBAN mis à jour', ibanData);
        setData(prev => ({
          ...prev,
          user: prev.user
            ? {
                ...prev.user,
                iban: {
                  ...prev.user.iban,
                  status: ibanData.newState,
                  updatedAt: ibanData.updatedAt,
                },
              }
            : prev.user,
        }));
      },

      onKycUpdate: (kycData: any) => {
        logger.info('KYC', 'Statut KYC mis à jour', kycData);
        setData(prev => ({
          ...prev,
          user: prev.user
            ? {
                ...prev.user,
                kyc: {
                  ...prev.user.kyc,
                  status: kycData.newKyc.toLowerCase() as 'pending' | 'verified' | 'rejected',
                  updatedAt: kycData.updatedAt,
                },
              }
            : prev.user,
        }));
      },

      // Met à jour les opérations en temps réel
      onOperationUpdate: (operationData: any) => {
        logger.info('OPERATION', 'Opération mise à jour', operationData);
        const operation = transformOperation(operationData);

        setData(prev => {
          // Trouve l'opération existante et la met à jour
          const existingIndex = prev.operations.findIndex(op => op.id === operation.id);

          if (existingIndex >= 0) {
            // Met à jour l'opération existante
            const updatedOperations = [...prev.operations];
            updatedOperations[existingIndex] = operation;
            return {
              ...prev,
              operations: updatedOperations,
            };
          } else {
            // Ajoute la nouvelle opération
            return {
              ...prev,
              operations: [operation, ...prev.operations],
            };
          }
        });
      },

      onConnectionChange: (connected: boolean) => {
        setIsWebSocketConnected(connected);
      },

      onError: (errorMessage: string) => {
        setError(errorMessage);
      },
    };

    wsCallbacksRef.current = callbacks;
    return callbacks;
  }, [
    transformTransaction,
    transformUser,
    transformWallet,
    deduplicateTransactions,
    refreshOperations,
  ]);

  // ========================================================================
  // INITIALISATION WEBSOCKET
  // ========================================================================

  const initializeWebSocket = useCallback(
    async (jwtToken: string) => {
      const wsConfig: WebSocketConfig = {
        apiUrl: config.baseURL.replace('http', 'ws') + '/ws',
        jwtToken,
        clientName: 'IBEX SDK',
      };

      const callbacks = createWebSocketCallbacks();
      await WebSocketManager.connect(wsConfig, callbacks);
    },
    [config.baseURL, createWebSocketCallbacks]
  );

  // ========================================================================
  // CHARGEMENT INITIAL
  // ========================================================================

  const loadInitialData = useCallback(async () => {
    if (isInitialized.current) return;

    isInitialized.current = true;
    setIsLoading(true);

    try {
      logger.api('Chargement initial');

      // Vérifie l'authentification avant de charger les données
      const token = client.getToken();
      if (!token) {
        logger.debug('HOOK', 'Pas de token - Utilisateur non authentifié');
        setIsLoading(false);
        return;
      }

      // Charge les opérations depuis l'API
      try {
        const opData = await client.getUserOperations();
        const operations = (opData?.data || [])
          .filter((op: any) => {
            // Filtre seulement les opérations exécutées
            const safeStatus = op.safeOperation?.status;
            return safeStatus === 'EXECUTED';
          })
          .map(transformOperation);

        setData(prev => ({
          ...prev,
          operations,
        }));
      } catch (opError) {
        logger.debug('HOOK', 'Erreur lors du chargement des opérations', opError);
        // Continue même si les opérations échouent
      }

      // Initialise le WebSocket pour les mises à jour temps réel
      await initializeWebSocket(token);
      setIsWebSocketConnected(WebSocketManager.connected);

      logger.success('Chargement', 'Données initiales chargées');
    } catch (error) {
      handleError(error, 'Erreur de chargement initial');
    } finally {
      setIsLoading(false);
    }
  }, [client, transformOperation, initializeWebSocket, handleError]);

  // ========================================================================
  // ACTIONS PUBLIQUES
  // ========================================================================

  const signIn = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      await client.signIn();
      await loadInitialData();
    } catch (error) {
      handleError(error, 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [client, loadInitialData, clearError, handleError]);

  const signUp = useCallback(
    async (passkeyName?: string) => {
      setIsLoading(true);
      clearError();

      try {
        await client.signUp(passkeyName);
        await loadInitialData();
      } catch (error) {
        handleError(error, "Erreur d'inscription");
      } finally {
        setIsLoading(false);
      }
    },
    [client, loadInitialData, clearError, handleError]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      await client.logout();
      WebSocketManager.disconnect();
    } finally {
      setData({
        user: null,
        wallet: null,
        balance: { amount: 0, symbol: 'EURe', usdValue: 0 },
        transactions: [],
        operations: [],
      });
      isInitialized.current = false;
      setIsLoading(false);
    }
  }, [client, clearError]);

  const send = useCallback(
    async (amount: number, to: string) => {
      if (!data.wallet?.address) throw new Error('Portefeuille non connecté');

      setIsLoading(true);
      clearError();

      try {
        await client.transferEURe(data.wallet.address, 421614, to, amount.toString());
      } catch (error) {
        handleError(error, "Erreur d'envoi");
      } finally {
        setIsLoading(false);
      }
    },
    [data.wallet?.address, client, clearError, handleError]
  );

  const receive = useCallback(async (): Promise<string> => {
    if (!data.wallet?.address) throw new Error('Portefeuille non connecté');
    return data.wallet.address;
  }, [data.wallet?.address]);

  const withdraw = useCallback(
    async (amount: number, iban: string) => {
      if (!data.wallet?.address) throw new Error('Portefeuille non connecté');

      setIsLoading(true);
      clearError();

      try {
        await client.withdrawToIban(
          data.wallet.address,
          421614,
          amount.toString(),
          iban,
          'Retrait IBEX'
        );
      } catch (error) {
        handleError(error, 'Erreur de retrait');
      } finally {
        setIsLoading(false);
      }
    },
    [data.wallet?.address, client, clearError, handleError]
  );

  const startKyc = useCallback(
    async (language: string = 'fr'): Promise<string> => {
      try {
        const kycUrl = await client.createKycRedirectUrl(language);
        logger.kyc('URL KYC reçue', { kycUrl });
        return kycUrl;
      } catch (error) {
        handleError(error, 'Erreur KYC');
        throw error;
      }
    },
    [client, handleError]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      await loadInitialData();
    } catch (error) {
      handleError(error, 'Erreur de rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialData, clearError, handleError]);

  // ========================================================================
  // ACTIONS IBEX SAFE
  // ========================================================================

  const getUserPrivateData = useCallback(
    async (externalUserId: string): Promise<Record<string, any>> => {
      try {
        return await client.getUserPrivateData(externalUserId);
      } catch (error) {
        handleError(error, 'Erreur récupération données privées');
        return {};
      }
    },
    [client, handleError]
  );

  const saveUserPrivateData = useCallback(
    async (externalUserId: string, data: Record<string, any>): Promise<{ success: boolean }> => {
      try {
        return await client.saveUserPrivateData(externalUserId, data);
      } catch (error) {
        handleError(error, 'Erreur sauvegarde données privées');
        return { success: false };
      }
    },
    [client, handleError]
  );

  const validateEmail = useCallback(
    async (email: string, externalUserId: string): Promise<any> => {
      try {
        return await client.validateEmail(email, externalUserId);
      } catch (error) {
        handleError(error, 'Erreur validation email');
        return null;
      }
    },
    [client, handleError]
  );

  const confirmEmail = useCallback(
    async (
      email: string,
      code: string,
      externalUserId: string,
      options: any = {}
    ): Promise<any> => {
      try {
        return await client.confirmEmail(email, code, externalUserId, options);
      } catch (error) {
        handleError(error, 'Erreur confirmation email');
        return null;
      }
    },
    [client, handleError]
  );

  // ========================================================================
  // EFFECT PRINCIPAL
  // ========================================================================

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const token = client.getToken();
      if (!token || !mounted) return;

      try {
        await loadInitialData();
      } catch (error) {
        if (!mounted) return;

        if (
          error instanceof Error &&
          (error.message.includes('Unauthorized') || error.message.includes('401'))
        ) {
          logger.auth("Token invalide - Reset de l'état");
          setData({
            user: null,
            wallet: null,
            balance: { amount: 0, symbol: 'EURe', usdValue: 0 },
            transactions: [],
            operations: [],
          });
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      isInitialized.current = false;

      // Nettoie le timeout de refresh des opérations
      if (refreshOperationsTimeoutRef.current) {
        clearTimeout(refreshOperationsTimeoutRef.current);
      }
    };
  }, [client, loadInitialData]);

  // ========================================================================
  // RETOUR DU HOOK
  // ========================================================================

  return {
    // Données principales
    balance: data.balance.amount,
    transactions: data.transactions,
    operations: data.operations,
    user: data.user,
    wallet: data.wallet,

    // État
    isLoading,
    error,
    isWebSocketConnected,

    // Actions
    signIn,
    signUp,
    logout,
    send,
    receive,
    withdraw,
    startKyc,
    refresh,
    clearError,

    // Actions IBEX Safe
    getUserPrivateData,
    saveUserPrivateData,
    validateEmail,
    confirmEmail,

    // Utilitaires
    getKycStatusLabel,
    getOperationTypeLabel,
    getOperationStatusLabel,
  };
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function getKycStatusLabel(level: number): string {
  switch (level) {
    case 1:
      return 'En cours';
    case 2:
      return 'Dossier envoyé';
    case 3:
      return 'Manque de pièce';
    case 4:
      return 'Refusé';
    case 5:
      return 'Accepté';
    default:
      return 'Non défini';
  }
}

function getOperationTypeLabel(type: string): string {
  switch (type) {
    case 'TRANSFER':
      return 'Transfert EURe';
    case 'WITHDRAW':
      return 'Retrait IBAN';
    case 'IBAN_CREATE':
      return 'Création IBAN';
    case 'SIGN_MESSAGE':
      return 'Signature de message';
    case 'ENABLE_RECOVERY':
      return 'Activation récupération';
    case 'CANCEL_RECOVERY':
      return 'Annulation récupération';
    case 'KYC':
      return "Vérification d'identité";
    default:
      return type;
  }
}

function getOperationStatusLabel(status: string): string {
  switch (status) {
    case 'executed':
      return 'Exécutée';
    case 'completed':
      return 'Terminée';
    case 'failed':
      return 'Échouée';
    case 'pending':
      return 'En attente';
    default:
      return status;
  }
}
