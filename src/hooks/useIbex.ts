// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Hook principal IBEX
 * API unifiée et simplifiée conforme au Swagger IBEX
 */

import { useState, useEffect, useCallback } from 'react';
import { IbexClient } from '../core/IbexClient';
import { logger } from '../utils/logger';
import type { IbexConfig, User, Wallet, Transaction, Operation, Balance } from '../types';

// ============================================================================
// TYPES UNIFIÉS
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

  // Actions d'authentification
  signIn: () => Promise<void>;
  signUp: (passkeyName?: string) => Promise<void>;
  logout: () => Promise<void>;

  // Actions financières
  send: (amount: number, to: string) => Promise<void>;
  receive: () => Promise<string>;
  withdraw: (amount: number, iban: string) => Promise<void>;

  // Actions KYC
  startKyc: (language?: string) => Promise<string>;

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
  refresh: () => Promise<void>;
  clearError: () => void;
  getKycStatusLabel: (level: number) => string;
  getOperationTypeLabel: (type: string) => string;
  getOperationStatusLabel: (status: string) => string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook IBEX optimisé
 * API unifiée conforme au Swagger IBEX
 */
export function useIbex(config: IbexConfig): IbexReturn {
  const [client] = useState(() => new IbexClient(config));
  const [data, setData] = useState<IbexData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiCall = useCallback(
    async <T>(apiCall: () => Promise<T>, errorMessage: string, fallback?: T): Promise<T | null> => {
      try {
        return await apiCall();
      } catch (error) {
        logger.error('API', errorMessage, error);
        setError(error instanceof Error ? error.message : errorMessage);
        return fallback || null;
      }
    },
    []
  );

  // ========================================================================
  // FONCTIONS DE TRANSFORMATION
  // ========================================================================

  const transformUser = useCallback((userDetails: any): User | null => {
    if (!userDetails) return null;

    const kyLevel = userDetails.ky || '0';
    const level = parseInt(kyLevel, 10);

    return {
      id: userDetails.id,
      email: userDetails.email || userDetails.id,
      kyc: {
        status: level >= 5 ? 'verified' : 'pending',
        level,
      },
    };
  }, []);

  const transformWallet = useCallback((userDetails: any): Wallet | null => {
    if (!userDetails?.signers?.[0]?.safes?.[0]) return null;

    const safe = userDetails.signers[0].safes[0];
    return {
      address: safe.address,
      isConnected: true,
      chainId: safe.chainId || 421614,
    };
  }, []);

  const transformBalance = useCallback((balanceData: any): Balance => {
    if (!balanceData) return { amount: 0, symbol: 'EURe' };

    let amount = 0;

    // Structure de l'API bcreader: { balance: { balance: "22211.88889" } }
    if (balanceData.balance?.balance !== undefined) {
      amount = parseFloat(balanceData.balance.balance || '0');
    }
    // Structure directe: { balance: "123.45" }
    else if (balanceData.balance !== undefined) {
      amount = parseFloat(balanceData.balance || '0');
    }
    // Structure avec amount direct
    else if (balanceData.amount !== undefined) {
      amount = parseFloat(balanceData.amount || '0');
    }

    return {
      amount: isNaN(amount) ? 0 : amount,
      symbol: 'EURe',
      usdValue: balanceData.usdValue ? parseFloat(balanceData.usdValue) : 0,
    };
  }, []);

  const transformTransactions = useCallback((txData: any[]): Transaction[] => {
    if (!Array.isArray(txData)) return [];

    return txData.map(tx => {
      // Essayer plusieurs champs pour le montant
      let amount = 0;
      if (tx.valueFormatted !== undefined) {
        amount = parseFloat(tx.valueFormatted);
      } else if (tx.value !== undefined) {
        amount = parseFloat(tx.value);
      } else if (tx.amount !== undefined) {
        amount = parseFloat(tx.amount);
      }

      return {
        id: String(tx.id || tx.hash || tx.transactionHash),
        amount: isNaN(amount) ? 0 : amount,
        type: tx.direction === 'IN' ? 'IN' : 'OUT',
        status: mapTransactionStatus(tx.status),
        date: tx.timestamp || tx.createdAt || tx.date,
        hash: tx.hash || tx.transactionHash,
        from: tx.from,
        to: tx.to,
      };
    });
  }, []);

  const transformOperations = useCallback((opData: any[]): Operation[] => {
    if (!Array.isArray(opData)) return [];

    return opData.map(op => {
      // Utiliser le statut de safeOperation si disponible, sinon le statut principal
      const actualStatus = op.safeOperation?.status || op.status;

      const operation: Operation = {
        id: op.id,
        type: mapOperationType(op.type),
        status: mapOperationStatus(actualStatus),
        amount: op.amount ? parseFloat(op.amount) : 0,
        createdAt: op.createdAt,
      };

      if (op.safeOperation) {
        operation.safeOperation = {
          userOpHash: op.safeOperation.userOpHash,
          status: op.safeOperation.status,
        };
      }

      return operation;
    });
  }, []);

  // ========================================================================
  // FONCTIONS DE CHARGEMENT
  // ========================================================================

  const loadCoreData = useCallback(async () => {
    const userDetails = await handleApiCall(
      () => client.getUserDetails(),
      'Erreur lors du chargement des données utilisateur'
    );

    if (!userDetails) throw new Error('Données utilisateur non disponibles');

    return {
      user: transformUser(userDetails),
      wallet: transformWallet(userDetails),
    };
  }, [client, handleApiCall, transformUser, transformWallet]);

  const loadBalance = useCallback(
    async (walletAddress?: string): Promise<Balance> => {
      const balanceData = await handleApiCall(
        () => client.getBalances(walletAddress),
        'Erreur lors du chargement de la balance',
        { balance: '0' }
      );

      return transformBalance(balanceData);
    },
    [client, handleApiCall, transformBalance]
  );

  const loadOperations = useCallback(async (): Promise<Operation[]> => {
    const opData = await handleApiCall(
      () => client.getUserOperations(),
      'Erreur lors du chargement des opérations',
      { data: [] }
    );

    const operations = opData?.data || opData || [];
    return transformOperations(Array.isArray(operations) ? operations : []);
  }, [client, handleApiCall, transformOperations]);

  const loadTransactions = useCallback(
    async (walletAddress: string): Promise<Transaction[]> => {
      if (!walletAddress) return [];

      const txData = await handleApiCall(
        () => client.getTransactions({ address: walletAddress, limit: 50 }),
        'Erreur lors du chargement des transactions',
        { data: [] }
      );

      const transactions = txData?.data || txData || [];
      return transformTransactions(Array.isArray(transactions) ? transactions : []);
    },
    [client, handleApiCall, transformTransactions]
  );

  const loadAllData = useCallback(async () => {
    try {
      logger.api('Chargement de toutes les données');

      // 1. Charger les données de base
      const coreData = await loadCoreData();
      logger.debug('CORE', 'Données de base chargées', coreData);

      // 2. Charger les données financières en parallèle
      const [balance, operations] = await Promise.all([
        loadBalance(coreData.wallet?.address),
        loadOperations(),
      ]);
      logger.debug('FINANCIAL', 'Données financières chargées', { balance, operations });

      // 3. Charger les transactions
      const transactions = await loadTransactions(coreData.wallet?.address || '');
      logger.debug('TX', 'Transactions chargées', { count: transactions.length });

      // 4. Mettre à jour l'état
      setData({
        user: coreData.user,
        wallet: coreData.wallet,
        balance,
        operations,
        transactions,
      });

      logger.success('Toutes les données chargées', 'Chargement terminé');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de chargement';
      setError(message);
      logger.error('LOAD', 'Erreur lors du chargement', error);
      throw error;
    }
  }, [loadCoreData, loadBalance, loadOperations, loadTransactions]);

  // ========================================================================
  // ACTIONS PUBLIQUES
  // ========================================================================

  const signIn = useCallback(async () => {
    setIsLoading(true);
    clearError();
    logger.auth('Tentative de connexion');

    try {
      await client.signIn();
      logger.success('Connexion réussie', 'Connexion réussie');
      await loadAllData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      setError(message);
      logger.error('AUTH', 'Erreur de connexion', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client, loadAllData, clearError]);

  const signUp = useCallback(
    async (passkeyName?: string) => {
      setIsLoading(true);
      clearError();
      logger.auth("Tentative d'inscription");

      try {
        await client.signUp(passkeyName);
        logger.success('Inscription réussie', 'Inscription réussie');
        await loadAllData();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur d'inscription";
        setError(message);
        logger.error('AUTH', "Erreur d'inscription", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [client, loadAllData, clearError]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      await client.logout();
    } finally {
      setData(null);
      setIsLoading(false);
    }
  }, [client, clearError]);

  const send = useCallback(
    async (amount: number, to: string) => {
      if (!data?.wallet?.address) throw new Error('Portefeuille non connecté');

      setIsLoading(true);
      clearError();

      try {
        await client.transferEURe(data.wallet.address, 421614, to, amount.toString());

        // Mettre à jour optimistiquement
        setData(prev =>
          prev
            ? {
                ...prev,
                balance: { ...prev.balance, amount: prev.balance.amount - amount },
              }
            : null
        );

        // Recharger les données
        await loadAllData();
        logger.success(`Envoi de ${amount}€ effectué`, 'Transaction réussie');
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur d'envoi";
        setError(message);
        logger.error('SEND', "Erreur d'envoi", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [data?.wallet?.address, client, loadAllData, clearError]
  );

  const receive = useCallback(async (): Promise<string> => {
    if (!data?.wallet?.address) throw new Error('Portefeuille non connecté');
    return data.wallet.address;
  }, [data?.wallet?.address]);

  const withdraw = useCallback(
    async (amount: number, iban: string) => {
      if (!data?.wallet?.address) throw new Error('Portefeuille non connecté');

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

        // Mettre à jour optimistiquement
        setData(prev =>
          prev
            ? {
                ...prev,
                balance: { ...prev.balance, amount: prev.balance.amount - amount },
              }
            : null
        );

        // Recharger les données
        await loadAllData();
        logger.success(`Retrait de ${amount}€ effectué`, 'Retrait réussi');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur de retrait';
        setError(message);
        logger.error('WITHDRAW', 'Erreur de retrait', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [data?.wallet?.address, client, loadAllData, clearError]
  );

  const startKyc = useCallback(
    async (language: string = 'fr'): Promise<string> => {
      const kycUrl = await handleApiCall(
        () => client.createKycRedirectUrl(language),
        'Erreur lors du démarrage du KYC'
      );

      if (!kycUrl) throw new Error('Impossible de démarrer le KYC');

      logger.kyc('URL KYC reçue', { kycUrl });
      return kycUrl;
    },
    [client, handleApiCall]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      await loadAllData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de rafraîchissement';
      setError(message);
      logger.error('REFRESH', 'Erreur de rafraîchissement', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData, clearError]);

  // ========================================================================
  // ACTIONS IBEX SAFE
  // ========================================================================

  const getUserPrivateData = useCallback(
    async (externalUserId: string): Promise<Record<string, any>> => {
      const result = await handleApiCall(
        () => client.getUserPrivateData(externalUserId),
        'Erreur lors de la récupération des données privées',
        {}
      );
      return result || {};
    },
    [client, handleApiCall]
  );

  const saveUserPrivateData = useCallback(
    async (externalUserId: string, data: Record<string, any>): Promise<{ success: boolean }> => {
      const result = await handleApiCall(
        () => client.saveUserPrivateData(externalUserId, data),
        'Erreur lors de la sauvegarde des données privées',
        { success: false }
      );
      return result || { success: false };
    },
    [client, handleApiCall]
  );

  const validateEmail = useCallback(
    async (email: string, externalUserId: string): Promise<any> => {
      return handleApiCall(
        () => client.validateEmail(email, externalUserId),
        "Erreur lors de la validation de l'email"
      );
    },
    [client, handleApiCall]
  );

  const confirmEmail = useCallback(
    async (
      email: string,
      code: string,
      externalUserId: string,
      options: any = {}
    ): Promise<any> => {
      return handleApiCall(
        () => client.confirmEmail(email, code, externalUserId, options),
        "Erreur lors de la confirmation de l'email"
      );
    },
    [client, handleApiCall]
  );

  // ========================================================================
  // CHARGEMENT INITIAL
  // ========================================================================

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      const token = client.getToken();
      if (!token || !mounted) return;

      logger.debug('HOOK', 'Chargement initial des données');
      try {
        await loadAllData();
      } catch (error) {
        if (!mounted) return;

        if (
          error instanceof Error &&
          (error.message.includes('Unauthorized') || error.message.includes('401'))
        ) {
          logger.auth("Token invalide - Nettoyage de l'état");
          setData(null);
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  // ========================================================================
  // RETOUR DU HOOK
  // ========================================================================

  return {
    // Données principales
    balance: data?.balance?.amount || 0,
    transactions: data?.transactions || [],
    operations: data?.operations || [],
    user: data?.user || null,
    wallet: data?.wallet || null,

    // État
    isLoading,
    error,

    // Actions d'authentification
    signIn,
    signUp,
    logout,

    // Actions financières
    send,
    receive,
    withdraw,

    // Actions KYC
    startKyc,

    // Actions IBEX Safe
    getUserPrivateData,
    saveUserPrivateData,
    validateEmail,
    confirmEmail,

    // Utilitaires
    refresh,
    clearError,
    getKycStatusLabel,
    getOperationTypeLabel,
    getOperationStatusLabel,
  };
}

// ============================================================================
// FONCTIONS UTILITAIRES DE MAPPING
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
      return type; // Retourner le type original si non reconnu
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

function mapTransactionStatus(status: string): 'confirmed' | 'pending' | 'failed' {
  switch (status) {
    case 'SUCCESS':
    case 'confirmed':
    case 'completed':
      return 'confirmed';
    case 'PENDING':
    case 'pending':
      return 'pending';
    case 'FAILED':
    case 'failed':
    case 'error':
      return 'failed';
    default:
      return 'pending';
  }
}

function mapOperationType(
  type: string
):
  | 'TRANSFER'
  | 'WITHDRAW'
  | 'KYC'
  | 'IBAN_CREATE'
  | 'SIGN_MESSAGE'
  | 'ENABLE_RECOVERY'
  | 'CANCEL_RECOVERY' {
  switch (type) {
    case 'TRANSFER_EURe':
      return 'TRANSFER';
    case 'MONERIUM_WITHDRAW_EURe':
      return 'WITHDRAW';
    case 'MONERIUM_CREATE_IBAN':
      return 'IBAN_CREATE';
    case 'SIGN_MESSAGE':
      return 'SIGN_MESSAGE';
    case 'ENABLE_RECOVERY':
      return 'ENABLE_RECOVERY';
    case 'CANCEL_RECOVERY':
      return 'CANCEL_RECOVERY';
    case 'KYC':
      return 'KYC';
    default:
      // Retourner le type original si non reconnu pour éviter de masquer les vrais types
      return type as any;
  }
}

function mapOperationStatus(status: string): 'pending' | 'completed' | 'failed' | 'executed' {
  switch (status) {
    case 'EXECUTED':
      return 'executed';
    case 'completed':
      return 'completed';
    case 'FAILED':
    case 'failed':
      return 'failed';
    case 'CREATED':
    case 'PENDING':
    case 'pending':
    default:
      return 'pending';
  }
}
