// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Client IBEX principal
 * Architecture simplifiée conforme au Swagger IBEX
 */

import { ApiClient } from './ApiClient';
import { AuthService } from '../services/AuthService';
import { WalletService } from '../services/WalletService';
import { TransactionService } from '../services/TransactionService';
import { KycService } from '../services/KycService';
import { IbexSafeService } from '../services/IbexSafeService';
import { CacheManager } from './CacheManager';
import type { IbexConfig, AuthResponse, UserDetails } from '../types';

/**
 * Client IBEX principal - API unifiée et simplifiée
 * Conforme au Swagger IBEX : https://passkeys-testnet-app-testnet.cryptosimple.app/openapi.json
 */
export class IbexClient {
  private apiClient: ApiClient;
  private cacheManager: CacheManager;

  // Services spécialisés
  public readonly auth: AuthService;
  public readonly wallet: WalletService;
  public readonly transactions: TransactionService;
  public readonly kyc: KycService;
  public readonly ibexSafe: IbexSafeService;

  constructor(config: IbexConfig) {
    // Initialiser le client API
    this.apiClient = new ApiClient(config);

    // Initialiser le gestionnaire de cache
    this.cacheManager = new CacheManager();

    // Initialiser les services
    this.auth = new AuthService(this.apiClient, this.cacheManager);
    this.wallet = new WalletService(this.apiClient, this.cacheManager);
    this.transactions = new TransactionService(this.apiClient, this.cacheManager);
    this.kyc = new KycService(this.apiClient, this.cacheManager);
    this.ibexSafe = new IbexSafeService(this.apiClient, this.cacheManager);
  }

  // ========================================================================
  // AUTHENTIFICATION SIMPLIFIÉE
  // ========================================================================

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(passkeyName?: string): Promise<AuthResponse> {
    return this.auth.signUp(passkeyName);
  }

  /**
   * Connexion d'un utilisateur existant
   */
  async signIn(): Promise<AuthResponse> {
    return this.auth.signIn();
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(): Promise<void> {
    await this.auth.logout();
    this.clearCache();
  }

  /**
   * Récupérer les détails de l'utilisateur
   */
  async getUserDetails(): Promise<UserDetails> {
    return this.auth.getUserDetails();
  }

  // ========================================================================
  // GESTION DU PORTEFEUILLE
  // ========================================================================

  /**
   * Récupérer les adresses du portefeuille
   */
  async getWalletAddresses(): Promise<any> {
    return this.wallet.getAddresses();
  }

  /**
   * Récupérer les chain IDs supportés
   */
  async getSupportedChainIds(): Promise<any> {
    return this.wallet.getChainIds();
  }

  /**
   * Récupérer les opérations utilisateur
   */
  async getUserOperations(): Promise<any> {
    return this.wallet.getOperations();
  }

  // ========================================================================
  // TRANSACTIONS ET BALANCES
  // ========================================================================

  /**
   * Récupérer les balances
   */
  async getBalances(address?: string): Promise<any> {
    return this.transactions.getBalances(address);
  }

  /**
   * Récupérer les transactions
   */
  async getTransactions(options: any = {}): Promise<any> {
    return this.transactions.getTransactions(options);
  }

  // ========================================================================
  // OPÉRATIONS SAFE
  // ========================================================================

  /**
   * Exécuter une opération Safe
   */
  async executeSafeOperation(
    safeAddress: string,
    chainId: number,
    operations: any[]
  ): Promise<any> {
    return this.wallet.executeSafeOperation(safeAddress, chainId, operations);
  }

  /**
   * Transfert EURe
   */
  async transferEURe(
    safeAddress: string,
    chainId: number,
    to: string,
    amount: string
  ): Promise<any> {
    return this.wallet.transferEURe(safeAddress, chainId, to, amount);
  }

  /**
   * Créer un IBAN
   */
  async createIban(safeAddress: string, chainId: number): Promise<any> {
    return this.wallet.createIban(safeAddress, chainId);
  }

  /**
   * Retrait vers IBAN
   */
  async withdrawToIban(
    safeAddress: string,
    chainId: number,
    amount: string,
    iban: string,
    label?: string,
    recipientInfo?: any
  ): Promise<any> {
    return this.wallet.withdrawToIban(safeAddress, chainId, amount, iban, label, recipientInfo);
  }

  // ========================================================================
  // KYC
  // ========================================================================

  /**
   * Créer un iframe KYC
   */
  async createKycIframe(language: string = 'fr'): Promise<any> {
    return this.kyc.createIframe(language);
  }

  /**
   * Créer une URL de redirection complète pour le KYC
   */
  async createKycRedirectUrl(language: string = 'fr', appUrl?: string): Promise<string> {
    return this.kyc.createKycRedirectUrl(language, appUrl);
  }

  // ========================================================================
  // IBEX SAFE - DONNÉES PRIVÉES
  // ========================================================================

  /**
   * Récupérer les données utilisateur privées
   */
  async getUserPrivateData(externalUserId: string): Promise<Record<string, any>> {
    return this.ibexSafe.getUserData(externalUserId);
  }

  /**
   * Sauvegarder les données utilisateur privées
   */
  async saveUserPrivateData(
    externalUserId: string,
    data: Record<string, any>
  ): Promise<{ success: boolean }> {
    return this.ibexSafe.saveUserData(externalUserId, data);
  }

  /**
   * Valider un email
   */
  async validateEmail(email: string, externalUserId: string): Promise<any> {
    return this.ibexSafe.validateEmail(email, externalUserId);
  }

  /**
   * Confirmer un email
   */
  async confirmEmail(
    email: string,
    code: string,
    externalUserId: string,
    options?: any
  ): Promise<any> {
    return this.ibexSafe.confirmEmail(email, code, externalUserId, options);
  }

  // ========================================================================
  // RÉCUPÉRATION
  // ========================================================================

  /**
   * Récupérer le statut de récupération
   */
  async getRecoveryStatus(safeAddress: string): Promise<any> {
    return this.wallet.getRecoveryStatus(safeAddress);
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Obtenir le token d'accès actuel
   */
  getToken(): string | null {
    return this.apiClient.getToken();
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cacheManager.clear();
    this.apiClient.clearCache();
  }

  /**
   * Vérifier la santé de l'API
   */
  async getHealth(): Promise<any> {
    return this.apiClient.request('/health');
  }
}
