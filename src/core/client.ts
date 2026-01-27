// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Client IBEX principal - Architecture modulaire conforme à l'OpenAPI v1.1
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
import { BitcoinService } from '../features/bitcoin'
import type { IbexConfig } from '../types'
import type {
  SignInOptions,
  SignUpOptions,
  TransferTokenParams,
  AaveSupplyParams,
  AaveWithdrawParams,
  SwapFromQuoteParams,
  SwapQuoteParams,
  BatchIntentRequest,
  PoolBalancesParams,
  TransactionsParams,
  BalancesParams,
  ConfirmEmailParams,
} from '../types'

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
  public readonly bitcoin: BitcoinService

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
    this.bitcoin = new BitcoinService(this.httpClient)
  }

  // ========================================================================
  // AUTHENTICATION
  // ========================================================================

  /**
   * Inscription d'un nouvel utilisateur
   * @param options - Options d'inscription ou nom du passkey (legacy)
   */
  async signUp(options?: string | SignUpOptions) {
    return this.auth.signUp(options)
  }

  /**
   * Connexion d'un utilisateur existant
   * @param options - Options de connexion (includeBalance, includeTransactions, includeUserdata)
   */
  async signIn(options?: SignInOptions) {
    return this.auth.signIn(options)
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
   * 
   * @deprecated Utiliser startKyc() à la place (supporte returnUrl depuis la version actuelle)
   */
  async createKycRedirectUrl(language: string = 'fr', returnUrl?: string) {
    return this.auth.createKycRedirectUrl(language, returnUrl)
  }

  // ========================================================================
  // USER INFO
  // ========================================================================

  /**
   * Récupère les détails de l'utilisateur
   */
  async getUserDetails() {
    return this.users.getUserDetails()
  }

  /**
   * Récupère les opérations de l'utilisateur groupées par Safe (v1.1)
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
   * 
   * @remarks
   * Cet endpoint peut nécessiter x-api-key (server-side) selon votre configuration backend.
   * Le SDK utilise JWT par défaut. Vérifiez avec votre équipe backend si JWT est accepté.
   */
  async getUserById(externalUserId: string) {
    return this.users.getUserById(externalUserId)
  }

  // ========================================================================
  // BLOCKCHAIN (BCReader)
  // ========================================================================

  /**
   * Récupère les balances
   */
  async getBalances(params?: BalancesParams) {
    return this.blockchain.getBalances(params)
  }

  /**
   * Récupère les transactions
   */
  async getTransactions(params?: TransactionsParams) {
    return this.blockchain.getTransactions(params)
  }

  /**
   * Récupère les pools actifs pour une blockchain
   */
  async getPools(blockchainId: number) {
    return this.blockchain.getPools(blockchainId)
  }

  /**
   * Récupère les balances de pools pour une adresse
   */
  async getPoolBalances(params: PoolBalancesParams) {
    return this.blockchain.getPoolBalances(params)
  }

  /**
   * Obtient une quote de swap
   */
  async getSwapQuote(params: SwapQuoteParams) {
    return this.blockchain.getSwapQuote(params)
  }

  // ========================================================================
  // SAFE OPERATIONS - TRANSFERS
  // ========================================================================

  /**
   * Transfère des EURe (deprecated - utiliser transferToken)
   * 
   * @deprecated Déprécié depuis v2.1, sera supprimé en v3.0
   * 
   * Utiliser transferToken() avec l'adresse du token EURe à la place.
   * 
   * @example
   * ```typescript
   * // Avant (deprecated)
   * await sdk.transfer({ safeAddress, to, amount })
   * 
   * // Après
   * await sdk.transferToken({ 
   *   safeAddress, 
   *   tokenAddress: '<EURe_ADDRESS>', 
   *   to, 
   *   amount: '10.50' 
   * })
   * ```
   */
  async transfer(params: {
    safeAddress: string
    chainId?: number
    to: string
    amount: number | string
  }) {
    return this.safe.transfer(params)
  }

  /**
   * Transfère des tokens ERC20
   */
  async transferToken(params: TransferTokenParams) {
    return this.safe.transferToken(params)
  }

  /**
   * Retire des EURe vers un IBAN
   */
  async withdraw(params: {
    safeAddress: string
    chainId?: number
    iban: string
    amount: number | string
    label?: string
    recipientInfo: { firstName: string; lastName: string; country: string }
  }) {
    return this.safe.withdraw(params)
  }

  /**
   * Crée un IBAN Monerium
   */
  async createIban(safeAddress: string, chainId?: number) {
    return this.safe.createIban(safeAddress, chainId)
  }

  /**
   * Signe un message
   */
  async signMessage(params: { safeAddress: string; chainId?: number; message: string }) {
    return this.safe.signMessage(params)
  }

  // ========================================================================
  // SAFE OPERATIONS - RECOVERY
  // ========================================================================

  /**
   * Active la récupération
   */
  async enableRecovery(params: {
    safeAddress: string
    chainId?: number
    firstName: string
    lastName: string
    birthDate: string
    birthCity: string
    birthCountry: string
  }) {
    return this.safe.enableRecovery(params)
  }

  /**
   * Annule la récupération
   */
  async cancelRecovery(safeAddress: string, chainId?: number) {
    return this.safe.cancelRecovery(safeAddress, chainId)
  }

  /**
   * Récupère le statut de récupération (v1.1)
   */
  async getRecoveryStatus(safeAddress: string) {
    return this.recovery.getRecoveryStatus(safeAddress)
  }

  // ========================================================================
  // SAFE OPERATIONS - AAVE
  // ========================================================================

  /**
   * Dépose des tokens dans un pool AAVE
   */
  async aaveSupply(params: AaveSupplyParams) {
    return this.safe.aaveSupply(params)
  }

  /**
   * Retire des tokens d'un pool AAVE
   */
  async aaveWithdraw(params: AaveWithdrawParams) {
    return this.safe.aaveWithdraw(params)
  }

  // ========================================================================
  // SAFE OPERATIONS - SWAP
  // ========================================================================

  /**
   * Exécute un swap depuis une quote
   */
  async swapFromQuote(params: SwapFromQuoteParams) {
    return this.safe.swapFromQuote(params)
  }

  // ========================================================================
  // SAFE OPERATIONS - BATCH
  // ========================================================================

  /**
   * Prépare un batch d'opérations
   */
  async prepareBatch(request: BatchIntentRequest) {
    return this.safe.prepareBatch(request)
  }

  /**
   * Exécute un batch complet avec WebAuthn
   */
  async executeBatch(request: BatchIntentRequest) {
    return this.safe.executeBatchWithWebAuthn(request)
  }

  /**
   * Récupère le statut d'un batch
   */
  async getBatchStatus(batchId: string) {
    return this.safe.getBatchStatus(batchId)
  }

  // ========================================================================
  // SAFE OPERATIONS - STATUS
  // ========================================================================

  /**
   * Récupère le statut d'une opération par userOpHash
   */
  async getOperationStatus(userOpHash: string) {
    return this.safe.getOperationStatus(userOpHash)
  }

  /**
   * Attend qu'une opération soit confirmée ou échoue
   */
  async waitForOperation(
    userOpHash: string,
    options?: { pollInterval?: number; timeout?: number }
  ) {
    return this.safe.waitForOperation(userOpHash, options)
  }

  // ========================================================================
  // PRIVACY (IBEx Safe)
  // ========================================================================

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
  async confirmEmail(params: ConfirmEmailParams) {
    return this.privacy.confirmEmail(params)
  }

  // ========================================================================
  // HEALTH & KYC
  // ========================================================================

  /**
   * Vérifie la santé de l'API
   */
  async getHealth() {
    return this.health.getHealth()
  }

  /**
   * Démarre le processus KYC
   * 
   * @param language - Langue de l'interface KYC (défaut: 'fr')
   * @param returnUrl - URL de retour après KYC (défaut: location.origin)
   * @returns URL de redirection KYC complète
   * 
   * @example
   * ```typescript
   * const kycUrl = await sdk.startKyc('en', 'https://myapp.com/kyc-callback');
   * window.location.href = kycUrl;
   * ```
   */
  async startKyc(language: string = 'fr', returnUrl?: string) {
    return this.kyc.start(language, returnUrl)
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
