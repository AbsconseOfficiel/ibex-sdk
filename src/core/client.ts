// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Client IBEX principal - Architecture modulaire conforme à l'OpenAPI
 *
 * Délègue toutes les opérations aux services spécialisés pour une meilleure
 * organisation et conformité avec l'API OpenAPI.
 */

import { HttpClient } from './http'
import { StorageManager } from './StorageManager'
import { AuthService } from '../features/auth'
import { UserService } from '../features/users'
import { BlockchainService } from '../features/blockchain'
import { SafeService } from '../features/safe'
import { PrivacyService } from '../features/privacy'
import { RecoveryService } from '../features/recovery'
import { HealthService } from '../features/health'
import { KycService } from '../features/kyc'
import type { IbexConfig } from '../types'

/**
 * Client IBEX principal avec architecture modulaire
 */
export class IbexClient {
  public readonly httpClient: HttpClient
  public readonly storage: StorageManager

  // Services spécialisés
  public readonly auth: AuthService
  public readonly users: UserService
  public readonly blockchain: BlockchainService
  public readonly safe: SafeService
  public readonly privacy: PrivacyService
  public readonly recovery: RecoveryService
  public readonly health: HealthService
  public readonly kyc: KycService

  constructor(config: IbexConfig) {
    this.storage = new StorageManager({
      enableMemoryCache: true,
      enableSessionStorage: true,
      enablePersistentStorage: true,
      defaultTTL: 60000,
    })

    this.httpClient = new HttpClient(config, this.storage)

    // Initialiser tous les services
    this.auth = new AuthService(this.httpClient)
    this.users = new UserService(this.httpClient)
    this.blockchain = new BlockchainService(this.httpClient)
    this.safe = new SafeService(this.httpClient)
    this.privacy = new PrivacyService(this.httpClient)
    this.recovery = new RecoveryService(this.httpClient)
    this.health = new HealthService(this.httpClient)
    this.kyc = new KycService(this.httpClient)
  }

  // ========================================================================
  // MÉTHODES DE CONVENIENCE (délégation aux services)
  // ========================================================================

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(passkeyName?: string) {
    return this.auth.signUp(passkeyName)
  }

  /**
   * Connexion d'un utilisateur existant
   */
  async signIn() {
    return this.auth.signIn()
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout() {
    return this.auth.logout()
  }

  /**
   * Rafraîchit le token d'accès
   */
  async refresh(refreshToken: string) {
    return this.auth.refresh(refreshToken)
  }

  /**
   * Crée une URL de redirection KYC
   */
  async createKycRedirectUrl(language: string = 'fr', returnUrl?: string) {
    return this.auth.createKycRedirectUrl(language, returnUrl)
  }

  /**
   * Récupère les détails de l'utilisateur
   */
  async getUserDetails() {
    return this.users.getUserDetails()
  }

  /**
   * Récupère les opérations de l'utilisateur
   */
  async getUserOperations() {
    return this.users.getUserOperations()
  }

  /**
   * Récupère les chain IDs supportés
   */
  async getSupportedChainIds() {
    return this.users.getSupportedChainIds()
  }

  /**
   * Récupère les adresses de portefeuille
   */
  async getWalletAddresses() {
    return this.users.getWalletAddresses()
  }

  /**
   * Récupère un utilisateur par son ID externe
   */
  async getUserById(externalUserId: string) {
    return this.users.getUserById(externalUserId)
  }

  /**
   * Récupère les balances
   */
  async getBalances(address?: string) {
    return this.blockchain.getBalances(address)
  }

  /**
   * Récupère les transactions
   */
  async getTransactions(params?: any) {
    return this.blockchain.getTransactions(params)
  }

  /**
   * Transfère des EURe
   */
  async transfer(params: any) {
    return this.safe.transfer(params)
  }

  /**
   * Retire des EURe vers un IBAN
   */
  async withdraw(params: any) {
    return this.safe.withdraw(params)
  }

  /**
   * Crée un IBAN Monerium
   */
  async createIban(safeAddress: string, chainId: number = 421614) {
    return this.safe.createIban(safeAddress, chainId)
  }

  /**
   * Signe un message
   */
  async signMessage(params: any) {
    return this.safe.signMessage(params)
  }

  /**
   * Active la récupération
   */
  async enableRecovery(params: any) {
    return this.safe.enableRecovery(params)
  }

  /**
   * Annule la récupération
   */
  async cancelRecovery(safeAddress: string, chainId: number = 421614) {
    return this.safe.cancelRecovery(safeAddress, chainId)
  }

  /**
   * Récupère les données privées de l'utilisateur
   */
  async getUserPrivateData(externalUserId: string) {
    return this.privacy.getUserData(externalUserId)
  }

  /**
   * Sauvegarde les données privées de l'utilisateur
   */
  async saveUserPrivateData(externalUserId: string, data: Record<string, unknown>) {
    return this.privacy.saveUserData(externalUserId, data)
  }

  /**
   * Valide un email
   */
  async validateEmail(email: string, externalUserId: string) {
    return this.privacy.validateEmail(email, externalUserId)
  }

  /**
   * Confirme un email
   */
  async confirmEmail(params: any) {
    return this.privacy.confirmEmail(params)
  }

  /**
   * Récupère le statut de récupération
   */
  async getRecoveryStatus(safeAddress: string) {
    return this.recovery.getRecoveryStatus(safeAddress)
  }

  /**
   * Vérifie la santé de l'API
   */
  async getHealth() {
    return this.health.getHealth()
  }

  /**
   * Démarre le processus KYC
   */
  async startKyc(language: string = 'fr') {
    return this.kyc.start(language)
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Obtenir le token d'accès actuel
   */
  getToken(): string | null {
    return this.httpClient.getToken()
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.storage.clear()
    this.httpClient.clearCache()
  }
}
