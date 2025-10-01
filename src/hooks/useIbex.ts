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
import { WebSocketService, WebSocketConfig } from '../services/WebSocketService';
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

  // Actions principales
  signIn: () => Promise<void>;
  signUp: (passkeyName?: string) => Promise<void>;
  logout: () => Promise<void>;
  send: (amount: number, to: string) => Promise<void>;
  receive: () => Promise<string>;
  startKyc: (language?: string) => Promise<string>;
  refresh: () => Promise<void>;
  clearError: () => void;

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
  const wsCallbacksRef = useRef<unknown>(null);

  // ========================================================================
  // UTILITAIRES STABLES
  // ========================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, message: string) => {
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

  const transformUser = useCallback((userData: unknown): User | null => {
    if (!userData || typeof userData !== 'object') return null;

    const data = userData as Record<string, unknown>;
    const kycLevel = parseInt(String(data.ky || '0'), 10);
    const email = kycLevel >= 5 ? String(data.email || '') : null;

    // Logique KYC selon l'équipe IBEX :
    // - level 0 : pas encore initié de KYC (not_started)
    // - level 1 : en cours (in_progress)
    // - level 2 : dossier envoyé (dossier_sent)
    // - level 3 : manque de pièce (missing_document)
    // - level 4 : refusé (rejected)
    // - level 5 : accepté (verified)
    let kycStatus:
      | 'not_started'
      | 'in_progress'
      | 'dossier_sent'
      | 'missing_document'
      | 'rejected'
      | 'verified' = 'not_started';
    if (kycLevel === 0) {
      // Nouvel utilisateur : pas encore initié de KYC
      kycStatus = 'not_started';
    } else if (kycLevel === 1) {
      // KYC en cours
      kycStatus = 'in_progress';
    } else if (kycLevel === 2) {
      // Dossier envoyé
      kycStatus = 'dossier_sent';
    } else if (kycLevel === 3) {
      // Manque de pièce
      kycStatus = 'missing_document';
    } else if (kycLevel === 4) {
      // KYC refusé
      kycStatus = 'rejected';
    } else if (kycLevel === 5) {
      // KYC accepté
      kycStatus = 'verified';
    }

    return {
      id: String(data.id || ''),
      email,
      kyc: {
        status: kycStatus,
        level: kycLevel,
      },
    };
  }, []);

  const transformWallet = useCallback((userData: unknown): Wallet | null => {
    if (!userData || typeof userData !== 'object') return null;

    const data = userData as Record<string, unknown>;
    const signers = data.signers as unknown[];
    if (!signers?.[0] || typeof signers[0] !== 'object') return null;

    const signer = signers[0] as Record<string, unknown>;
    const safes = signer.safes as unknown[];
    if (!safes?.[0] || typeof safes[0] !== 'object') return null;

    const safe = safes[0] as Record<string, unknown>;
    return {
      address: String(safe.address || ''),
      isConnected: true,
      chainId: Number(safe.chainId || 421614),
    };
  }, []);

  // Convertit les données de transaction en format standard
  const transformTransaction = useCallback((tx: unknown): Transaction => {
    if (!tx || typeof tx !== 'object') {
      throw new Error('Invalid transaction data');
    }

    const txRecord = tx as Record<string, unknown>;
    // Gère les deux formats : historique (transaction_data) et temps réel (new_transaction)
    let transactionData;
    let isNewTransaction = false;

    if (txRecord.newTransaction) {
      // Format new_transaction : les données sont dans tx.newTransaction
      transactionData = txRecord.newTransaction;
      isNewTransaction = true;
    } else if (txRecord.transaction) {
      // Format transaction_data : les données sont dans tx.transaction
      transactionData = txRecord.transaction;
    } else {
      // Format direct
      transactionData = txRecord;
    }

    // Vérifier que transactionData est un objet
    if (!transactionData || typeof transactionData !== 'object') {
      throw new Error('Invalid transaction data');
    }

    const txData = transactionData as Record<string, unknown>;

    // Calcul du montant selon le format
    let amount;
    if (isNewTransaction) {
      // Pour new_transaction : la valeur est déjà en EURe (pas de conversion wei)
      const parsed = parseFloat(String(txData.value || '0'));
      amount = isNaN(parsed) ? 0 : parsed;
    } else {
      // Pour transaction_data : convertir wei en EURe (1 EURe = 10^18 wei)
      const amountInWei = String(txData.value || '0');
      const parsed = parseFloat(amountInWei);
      amount = isNaN(parsed) ? 0 : parsed / Math.pow(10, 18);
    }

    // Utilise le hash comme ID unique pour éviter les doublons
    const id = String(txData.transactionHash || txData.hash || txData.id || '');

    const result = {
      id,
      amount,
      type: String(txData.direction || 'OUT') === 'IN' ? 'IN' : 'OUT',
      status: 'confirmed' as const,
      date: txData.timestamp ? String(txData.timestamp) : new Date().toISOString(),
      hash: String(txData.transactionHash || txData.hash || ''),
      from: String(txData.from || ''),
      to: String(txData.to || ''),
    };

    return result as Transaction;
  }, []);

  const transformOperation = useCallback((op: unknown): Operation => {
    if (!op || typeof op !== 'object') {
      throw new Error('Invalid operation data');
    }

    const opData = op as Record<string, unknown>;
    const data = opData.data as Record<string, unknown> | undefined;
    const params = data?.params as Record<string, unknown> | undefined;
    const parsed = parseFloat(String(params?.amount || '0'));
    const amount = isNaN(parsed) ? 0 : parsed;

    return {
      id: String(opData.id || ''),
      type: String(opData.type || '') as Operation['type'],
      status: String(
        (opData.safeOperation as Record<string, unknown>)?.status || opData.status || 'unknown'
      ) as Operation['status'],
      amount,
      createdAt: String(opData.createdAt || ''),
      ...(opData.safeOperation && typeof opData.safeOperation === 'object'
        ? {
            safeOperation: {
              userOpHash: String(
                (opData.safeOperation as Record<string, unknown>).userOpHash || ''
              ),
              status: String((opData.safeOperation as Record<string, unknown>).status || ''),
            },
          }
        : {}),
    };
  }, []);

  // ========================================================================
  // CALLBACKS WEBSOCKET
  // ========================================================================

  // Crée les callbacks une seule fois pour éviter les re-renders
  const createWebSocketCallbacks = useCallback(() => {
    if (wsCallbacksRef.current) return wsCallbacksRef.current;

    const callbacks = {
      onAuthSuccess: (data: unknown) => {
        logger.success('WebSocket', 'Authentifié avec succès', data);
        // Les données initiales (balance_data, transaction_data, user_data)
        // sont automatiquement envoyées après l'authentification
      },

      // Met à jour le solde quand reçu via WebSocket
      onBalanceUpdate: (data: unknown) => {
        if (!data || typeof data !== 'object') return;
        const balanceData = data as Record<string, unknown>;

        // Conversion sécurisée pour éviter NaN
        const balanceValue = balanceData.balance;
        let amount = 0;

        if (typeof balanceValue === 'number' && !isNaN(balanceValue)) {
          amount = balanceValue;
        } else if (typeof balanceValue === 'string') {
          const parsed = parseFloat(balanceValue);
          amount = isNaN(parsed) ? 0 : parsed;
        }

        setData(prev => ({
          ...prev,
          balance: {
            amount,
            symbol: 'EURe',
            usdValue: 0,
          },
        }));

        // Les opérations sont maintenant mises à jour via WebSocket
        // (operation_data, operation_update, new_operation)
      },

      // Gère les données initiales de transactions (transaction_data)
      onTransactionData: (data: unknown) => {
        if (!data || typeof data !== 'object') return;
        const txData = data as Record<string, unknown>;
        const transactions = txData.transactions as { data?: unknown[] } | undefined;

        if (transactions?.data) {
          const transformedTransactions = transactions.data
            .map(transformTransaction)
            .filter(tx => tx.id);

          setData(prev => ({
            ...prev,
            transactions: deduplicateTransactions(transformedTransactions),
          }));

          logger.info('WebSocket', 'Transactions initiales chargées', {
            count: transformedTransactions.length,
          });
        }
      },

      // Ajoute une nouvelle transaction à la liste (évite les doublons)
      onNewTransaction: (data: unknown) => {
        try {
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
        } catch (error) {
          logger.warn('WebSocket', 'Nouvelle transaction invalide ignorée', error);
        }

        // Les opérations sont maintenant mises à jour via WebSocket
        // (operation_data, operation_update, new_operation)
      },

      onUserData: (userData: unknown) => {
        setData(prev => ({
          ...prev,
          user: transformUser(userData),
          wallet: transformWallet(userData),
        }));
      },

      onIbanUpdate: (ibanData: unknown) => {
        if (!ibanData || typeof ibanData !== 'object') return;
        const iban = ibanData as Record<string, unknown>;
        logger.info('IBAN', 'Statut IBAN mis à jour', iban);
        setData(prev => ({
          ...prev,
          user: prev.user
            ? {
                ...prev.user,
                iban: {
                  ...prev.user.iban,
                  status: String(iban.newState || '') as 'pending' | 'verified' | 'rejected',
                  updatedAt: String(iban.updatedAt || ''),
                },
              }
            : prev.user,
        }));
      },

      onKycUpdate: (kycData: unknown) => {
        if (!kycData || typeof kycData !== 'object') return;
        const kyc = kycData as Record<string, unknown>;
        logger.info('KYC', 'Statut KYC mis à jour', kyc);
        setData(prev => ({
          ...prev,
          user: prev.user
            ? {
                ...prev.user,
                kyc: {
                  ...prev.user.kyc,
                  status: String(kyc.newKyc || '').toLowerCase() as
                    | 'not_started'
                    | 'in_progress'
                    | 'dossier_sent'
                    | 'missing_document'
                    | 'rejected'
                    | 'verified',
                  updatedAt: String(kyc.updatedAt || ''),
                },
              }
            : prev.user,
        }));
      },

      // Gère les données initiales d'opérations (operation_data)
      onOperationData: (data: unknown) => {
        if (!data || typeof data !== 'object') return;
        const opData = data as Record<string, unknown>;
        const operations = opData.operations as unknown[] | undefined;

        if (operations) {
          const transformedOperations = operations
            .filter((op: unknown) => {
              if (!op || typeof op !== 'object') return false;
              const opData = op as Record<string, unknown>;
              const safeOperation = opData.safeOperation as Record<string, unknown> | undefined;
              const safeStatus = safeOperation?.status;
              const opStatus = opData.status;

              // Accepter les opérations exécutées (différentes variantes)
              return (
                safeStatus === 'EXECUTED' ||
                safeStatus === 'executed' ||
                opStatus === 'EXECUTED' ||
                opStatus === 'executed'
              );
            })
            .map(transformOperation);

          setData(prev => ({
            ...prev,
            operations: transformedOperations,
          }));

          logger.info('WebSocket', 'Opérations initiales chargées', {
            count: transformedOperations.length,
          });
        }
      },

      // Met à jour les opérations en temps réel
      onOperationUpdate: (operationData: unknown) => {
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
  }, [transformTransaction, transformUser, transformWallet, deduplicateTransactions]);

  // ========================================================================
  // INITIALISATION WEBSOCKET
  // ========================================================================

  const initializeWebSocket = useCallback(
    async (jwtToken: string) => {
      const wsConfig: WebSocketConfig = {
        apiUrl: `${config.baseURL.replace('http', 'ws')}/ws`,
        jwtToken,
        clientName: 'IBEX SDK',
      };

      const callbacks = createWebSocketCallbacks();
      const wsService = new WebSocketService(wsConfig, callbacks);
      wsService.connect();
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

      // Charge les opérations initiales via API REST
      // (le WebSocket ne fournit pas les opérations initiales)
      try {
        const opData = (await client.getUserOperations()) as { data?: unknown[] };
        const allOperations = opData?.data || [];

        const operations = allOperations
          .filter((op: unknown) => {
            if (!op || typeof op !== 'object') return false;

            const opData = op as Record<string, unknown>;
            const safeOperation = opData.safeOperation as Record<string, unknown> | undefined;
            const safeStatus = safeOperation?.status;
            const opStatus = opData.status;

            // Accepter les opérations exécutées (différentes variantes)
            return (
              safeStatus === 'EXECUTED' ||
              safeStatus === 'executed' ||
              opStatus === 'EXECUTED' ||
              opStatus === 'executed'
            );
          })
          .map(transformOperation);

        setData(prev => ({
          ...prev,
          operations,
        }));

        logger.info('Chargement', 'Opérations initiales chargées', {
          count: operations.length,
        });
      } catch (error) {
        logger.error('OPERATIONS', 'Erreur lors du chargement des opérations', error);
      }

      // Initialise le WebSocket pour les mises à jour temps réel
      await initializeWebSocket(token);
      setIsWebSocketConnected(true);

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

      // Nettoyage des ressources
    };
  }, [client]); // Suppression de loadInitialData des dépendances pour éviter les boucles

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
    startKyc,
    refresh,
    clearError,

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
    case 0:
      return 'Non initié';
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
