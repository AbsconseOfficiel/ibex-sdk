// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de gestion des opérations Safe IBEX - OpenAPI v1.1
 *
 * @module features/safe
 */

import type { HttpClient } from '../../core/http'
import type {
  SafeOperationRequest,
  SafeOperationResponse,
  SafeOperationExecuteResponse,
  TransferParams,
  TransferTokenParams,
  WithdrawParams,
  SignMessageParams,
  EnableRecoveryParams,
  AaveSupplyParams,
  AaveWithdrawParams,
  SwapFromQuoteParams,
  SafeOperationInput,
  BatchIntentRequest,
  BatchIntentResponse,
  BatchExecuteRequest,
  BatchStatusResponse,
  OperationStatusResponse,
} from './safe.types'
import { prepareWebAuthnAuthenticationOptions } from '../../utils/webauthn'

/**
 * Service de gestion des opérations Safe
 */
export class SafeService {
  constructor(private http: HttpClient) {}

  // ============================================================================
  // TRANSFER OPERATIONS
  // ============================================================================

  /**
   * Transfère des EURe vers une adresse
   * 
   * @deprecated Déprécié depuis v2.1, sera supprimé en v3.0
   * 
   * Utiliser transferToken() avec l'adresse du token EURe à la place.
   * 
   * @example
   * ```typescript
   * // Avant (deprecated)
   * await sdk.safe.transfer({ safeAddress, to, amount })
   * 
   * // Après
   * await sdk.safe.transferToken({ 
   *   safeAddress, 
   *   tokenAddress: '<EURe_ADDRESS>', 
   *   to, 
   *   amount: '10.50' 
   * })
   * ```
   */
  async transfer(params: TransferParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, to, amount } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'TRANSFER_EURe',
        to,
        amount: amount.toString(),
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Transfère des tokens ERC20 vers une adresse
   *
   * @param params - Paramètres de transfert
   * @returns Hash de l'opération utilisateur
   *
   * @example
   * ```typescript
   * const result = await safeService.transferToken({
   *   safeAddress: '0x...',
   *   tokenAddress: '0xEURe...',
   *   to: '0xRecipient...',
   *   amount: '10.50'
   * });
   * ```
   */
  async transferToken(params: TransferTokenParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, tokenAddress, to, amount } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'TRANSFER_TOKEN',
        tokenAddress,
        to,
        amount,
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Retire des EURe vers un IBAN
   */
  async withdraw(params: WithdrawParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, iban, amount, label, recipientInfo } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'MONERIUM_WITHDRAW_EURe',
        to: iban,
        amount: amount.toString(),
        label: label || 'Retrait IBEX',
        recipientInfo,
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Crée un IBAN Monerium
   */
  async createIban(safeAddress: string, chainId?: number): Promise<SafeOperationExecuteResponse> {
    const operations: SafeOperationInput[] = [
      {
        type: 'MONERIUM_CREATE_IBAN',
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Signe un message avec le wallet
   */
  async signMessage(params: SignMessageParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, message } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'SIGN_MESSAGE',
        message,
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  // ============================================================================
  // RECOVERY OPERATIONS
  // ============================================================================

  /**
   * Active la récupération du wallet
   */
  async enableRecovery(params: EnableRecoveryParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, firstName, lastName, birthDate, birthCity, birthCountry } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'ENABLE_RECOVERY',
        firstName,
        lastName,
        birthDate,
        birthCity,
        birthCountry,
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Annule la récupération du wallet
   */
  async cancelRecovery(
    safeAddress: string,
    chainId?: number
  ): Promise<SafeOperationExecuteResponse> {
    const operations: SafeOperationInput[] = [
      {
        type: 'CANCEL_RECOVERY',
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  // ============================================================================
  // AAVE OPERATIONS
  // ============================================================================

  /**
   * Dépose des tokens dans un pool AAVE
   *
   * @param params - Paramètres de dépôt AAVE
   * @returns Hash de l'opération utilisateur
   *
   * @example
   * ```typescript
   * // Avec assetTicker
   * const result = await safeService.aaveSupply({
   *   safeAddress: '0x...',
   *   amount: '100.00',
   *   assetTicker: 'EURe'
   * });
   *
   * // Avec tokenAddress
   * const result = await safeService.aaveSupply({
   *   safeAddress: '0x...',
   *   amount: '100.00',
   *   tokenAddress: '0xEURe...',
   *   decimals: 18
   * });
   * ```
   */
  async aaveSupply(params: AaveSupplyParams): Promise<SafeOperationExecuteResponse> {
    const {
      safeAddress,
      chainId,
      amount,
      assetTicker,
      tokenAddress,
      decimals,
      referralCode,
      poolAddress,
    } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'AAVE_SUPPLY',
        amount,
        ...(assetTicker && { assetTicker }),
        ...(tokenAddress && { tokenAddress }),
        ...(decimals !== undefined && { decimals }),
        ...(referralCode !== undefined && { referralCode }),
        ...(poolAddress && { poolAddress }),
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Retire des tokens d'un pool AAVE
   *
   * @param params - Paramètres de retrait AAVE
   * @returns Hash de l'opération utilisateur
   */
  async aaveWithdraw(params: AaveWithdrawParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, amount, assetTicker, tokenAddress, decimals, poolAddress } =
      params

    const operations: SafeOperationInput[] = [
      {
        type: 'AAVE_WITHDRAW',
        amount,
        ...(assetTicker && { assetTicker }),
        ...(tokenAddress && { tokenAddress }),
        ...(decimals !== undefined && { decimals }),
        ...(poolAddress && { poolAddress }),
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  // ============================================================================
  // SWAP OPERATIONS
  // ============================================================================

  /**
   * Exécute un swap depuis une quote précédemment obtenue
   *
   * @param params - Paramètres du swap
   * @returns Hash de l'opération utilisateur
   */
  async swapFromQuote(params: SwapFromQuoteParams): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, quoteId } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'SWAP_FROM_QUOTE',
        quoteId,
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Prépare un batch d'opérations pour exécution avec une seule authentification WebAuthn
   *
   * @param request - Requête de batch
   * @returns Options WebAuthn et batchId
   *
   * @example
   * ```typescript
   * const batch = await safeService.prepareBatch({
   *   safeAddress: '0x...',
   *   operations: [
   *     { type: 'TRANSFER_TOKEN', tokenAddress: '0x...', to: '0x...', amount: '10' },
   *     { type: 'SWAP_FROM_QUOTE', quoteId: 'quote-123' }
   *   ]
   * });
   * ```
   */
  async prepareBatch(request: BatchIntentRequest): Promise<BatchIntentResponse> {
    return this.http.request<BatchIntentResponse>('/v1/safes/operations/batch-intent', {
      method: 'POST',
      body: request,
    })
  }

  /**
   * Exécute un batch préparé avec les credentials WebAuthn
   *
   * @param request - batchId et credential WebAuthn
   * @returns Résultat de l'exécution
   */
  async executeBatch(request: BatchExecuteRequest): Promise<SafeOperationExecuteResponse> {
    return this.http.request<SafeOperationExecuteResponse>('/v1/safes/operations/batch-execute', {
      method: 'PUT',
      body: request,
    })
  }

  /**
   * Exécute un batch complet avec signature WebAuthn automatique
   *
   * @param request - Requête de batch
   * @returns Hash de l'opération utilisateur
   */
  async executeBatchWithWebAuthn(
    request: BatchIntentRequest
  ): Promise<SafeOperationExecuteResponse> {
    // 1. Préparer le batch
    const preparation = await this.prepareBatch(request)

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnAuthenticationOptions(preparation.credentialRequestOptions)

    // 3. Signer avec WebAuthn
    const credential = await navigator.credentials.get({
      publicKey: options as PublicKeyCredentialRequestOptions,
    })

    if (!credential) {
      throw new Error('Échec de la signature WebAuthn')
    }

    // 4. Exécuter le batch
    return this.executeBatch({
      batchId: preparation.batchId,
      credential,
    })
  }

  /**
   * Récupère le statut d'un batch
   *
   * @param batchId - ID du batch
   * @returns Statut du batch
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
    return this.http.request<BatchStatusResponse>(`/v1/safes/operations/batch/${batchId}/status`, {
      cache: true,
      cacheTTL: 5000, // 5 secondes
    })
  }

  // ============================================================================
  // OPERATION STATUS
  // ============================================================================

  /**
   * Récupère le statut d'une opération par son userOpHash
   *
   * @param userOpHash - Hash de l'opération utilisateur
   * @returns Statut de l'opération
   *
   * @example
   * ```typescript
   * const status = await safeService.getOperationStatus('0x123...');
   * if (status.status === 'CONFIRMED') {
   *   console.log('Transaction hash:', status.transactionHash);
   * }
   * ```
   */
  async getOperationStatus(userOpHash: string): Promise<OperationStatusResponse> {
    return this.http.request<OperationStatusResponse>(`/v1/safes/operations/${userOpHash}/status`, {
      cache: true,
      cacheTTL: 5000, // 5 secondes
    })
  }

  /**
   * Attend qu'une opération soit confirmée ou échoue
   *
   * @param userOpHash - Hash de l'opération utilisateur
   * @param options - Options d'attente
   * @returns Statut final de l'opération
   */
  async waitForOperation(
    userOpHash: string,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<OperationStatusResponse> {
    const { pollInterval = 3000, timeout = 120000 } = options
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const status = await this.getOperationStatus(userOpHash)

      if (status.status === 'CONFIRMED' || status.status === 'FAILED') {
        return status
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Timeout en attendant l'opération ${userOpHash}`)
  }

  // ============================================================================
  // GENERIC OPERATION EXECUTION
  // ============================================================================

  /**
   * Exécute une opération Safe générique avec signature WebAuthn automatique
   *
   * @param request - Requête d'opération
   * @returns Hash de l'opération utilisateur
   */
  async executeOperation(request: SafeOperationRequest): Promise<SafeOperationExecuteResponse> {
    const { safeAddress, chainId, operations } = request

    // 1. Préparer l'opération
    const preparation = await this.http.request<SafeOperationResponse>('/v1/safes/operations', {
      method: 'POST',
      body: { safeAddress, chainId, operations },
    })

    // 2. Préparer les options WebAuthn
    const options = prepareWebAuthnAuthenticationOptions(preparation.credentialRequestOptions)

    // 3. Signer avec WebAuthn
    const credential = await navigator.credentials.get({
      publicKey: options as PublicKeyCredentialRequestOptions,
    })

    if (!credential) {
      throw new Error('Échec de la signature WebAuthn')
    }

    // 4. Exécuter l'opération
    return this.http.request<SafeOperationExecuteResponse>('/v1/safes/operations', {
      method: 'PUT',
      body: { credential },
    })
  }

  /**
   * Prépare une opération Safe sans l'exécuter (pour usage manuel)
   *
   * @param request - Requête d'opération
   * @returns Options WebAuthn pour signature manuelle
   */
  async prepareOperation(request: SafeOperationRequest): Promise<SafeOperationResponse> {
    return this.http.request<SafeOperationResponse>('/v1/safes/operations', {
      method: 'POST',
      body: request,
    })
  }

  /**
   * Finalise une opération préparée avec les credentials WebAuthn
   *
   * @param credential - Credential WebAuthn
   * @returns Hash de l'opération utilisateur
   */
  async finalizeOperation(credential: unknown): Promise<SafeOperationExecuteResponse> {
    return this.http.request<SafeOperationExecuteResponse>('/v1/safes/operations', {
      method: 'PUT',
      body: { credential },
    })
  }
}
