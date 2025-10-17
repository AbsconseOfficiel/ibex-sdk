// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service de gestion des utilisateurs IBEX
 *
 * Gère:
 * - Récupération des profils utilisateur
 * - Gestion des utilisateurs par ID externe
 * - Opérations utilisateur
 *
 * @module features/users
 */

import type { HttpClient } from '../../core/http'
import type {
  UserDetailsResponse,
  UserOperationsResponse,
  ChainIdsResponse,
  WalletAddressesResponse,
} from './user.types'

/**
 * Service de gestion des utilisateurs
 */
export class UserService {
  constructor(private http: HttpClient) {}

  /**
   * Récupère les profils de l'utilisateur authentifié
   * GET /v1/users/me
   *
   * @returns Détails de l'utilisateur avec statut KYC, signers et safes
   *
   * @example
   * ```typescript
   * const userDetails = await userService.getUserDetails();
   * console.log(userDetails.ky); // Statut KYC
   * ```
   */
  async getUserDetails(): Promise<UserDetailsResponse> {
    return this.http.request<UserDetailsResponse>('/v1/users/me', {
      cache: true,
      cacheTTL: 30000, // 30 secondes
    })
  }

  /**
   * Récupère les opérations de l'utilisateur authentifié
   * GET /v1/users/me/operations
   *
   * @returns Toutes les opérations onchain liées aux wallets de l'utilisateur
   *
   * @example
   * ```typescript
   * const operations = await userService.getUserOperations();
   * console.log(operations.data.length); // Nombre d'opérations
   * ```
   */
  async getUserOperations(): Promise<UserOperationsResponse> {
    return this.http.request<UserOperationsResponse>('/v1/users/me/operations', {
      cache: true,
      cacheTTL: 30000, // 30 secondes
    })
  }

  /**
   * Récupère les chain IDs configurés
   * GET /v1/users/me/chainid
   *
   * @returns Chain IDs actuellement disponibles pour les wallets de l'utilisateur
   *
   * @example
   * ```typescript
   * const chainIds = await userService.getSupportedChainIds();
   * console.log(chainIds.defaultChainId); // Chain ID par défaut
   * ```
   */
  async getSupportedChainIds(): Promise<ChainIdsResponse> {
    return this.http.request<ChainIdsResponse>('/v1/users/me/chainid', {
      cache: true,
      cacheTTL: 300000, // 5 minutes
    })
  }

  /**
   * Récupère les adresses de portefeuille de l'utilisateur
   * GET /v1/users/me/address
   *
   * @returns Toutes les adresses de portefeuille appartenant à l'utilisateur authentifié
   *
   * @example
   * ```typescript
   * const addresses = await userService.getWalletAddresses();
   * console.log(addresses.wallets.length); // Nombre de wallets
   * ```
   */
  async getWalletAddresses(): Promise<WalletAddressesResponse> {
    return this.http.request<WalletAddressesResponse>('/v1/users/me/address', {
      cache: true,
      cacheTTL: 300000, // 5 minutes
    })
  }

  /**
   * Récupère les informations d'un utilisateur par son ID externe
   * GET /v1/users/{id}
   *
   * @param externalUserId - ID externe de l'utilisateur
   * @returns Informations de l'utilisateur pour le rpId donné
   *
   * @example
   * ```typescript
   * const user = await userService.getUserById('user-123');
   * console.log(user.ky); // Statut KYC
   * ```
   */
  async getUserById(externalUserId: string): Promise<UserDetailsResponse> {
    return this.http.request<UserDetailsResponse>(`/v1/users/${externalUserId}`, {
      cache: true,
      cacheTTL: 300000, // 5 minutes
    })
  }
}
