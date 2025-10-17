// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de gestion des opérations Safe IBEX
 *
 * @module features/safe
 */

import type { HttpClient } from '../../core/http'
import type {
  SafeOperationRequest,
  SafeOperationResponse,
  TransferParams,
  WithdrawParams,
  SignMessageParams,
  EnableRecoveryParams,
  UserOperationsResponse,
  SafeOperationInput,
} from './safe.types'
import { prepareWebAuthnAuthenticationOptions } from '../../utils/webauthn'

/**
 * Service de gestion des opérations Safe
 */
export class SafeService {
  constructor(private http: HttpClient) {}

  /**
   * Transfère des EURe vers une adresse
   */
  async transfer(params: TransferParams): Promise<{ userOpHash: string }> {
    const { safeAddress, chainId = 421614, to, amount } = params

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
   * Retire des EURe vers un IBAN
   */
  async withdraw(params: WithdrawParams): Promise<{ userOpHash: string }> {
    const { safeAddress, chainId = 421614, iban, amount, label, recipientInfo } = params

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
  async createIban(safeAddress: string, chainId: number = 421614): Promise<{ userOpHash: string }> {
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
  async signMessage(params: SignMessageParams): Promise<{ userOpHash: string }> {
    const { safeAddress, chainId = 421614, message } = params

    const operations: SafeOperationInput[] = [
      {
        type: 'SIGN_MESSAGE',
        message,
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Active la récupération du wallet
   */
  async enableRecovery(params: EnableRecoveryParams): Promise<{ userOpHash: string }> {
    const {
      safeAddress,
      chainId = 421614,
      firstName,
      lastName,
      birthDate,
      birthCity,
      birthCountry,
    } = params

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
    chainId: number = 421614
  ): Promise<{ userOpHash: string }> {
    const operations: SafeOperationInput[] = [
      {
        type: 'CANCEL_RECOVERY',
      },
    ]

    return this.executeOperation({ safeAddress, chainId, operations })
  }

  /**
   * Exécute une opération Safe générique
   */
  async executeOperation(request: SafeOperationRequest): Promise<{ userOpHash: string }> {
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
    return this.http.request<{ userOpHash: string }>('/v1/safes/operations', {
      method: 'PUT',
      body: { credential },
    })
  }

  /**
   * Récupère les opérations utilisateur
   */
  async getUserOperations(): Promise<UserOperationsResponse> {
    return this.http.request<UserOperationsResponse>('/v1/users/me/operations', {
      cache: true,
      cacheTTL: 30000, // 30 secondes
    })
  }
}
