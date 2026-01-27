// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Service Bitcoin IBEX - OpenAPI v1
 *
 * Fournit l'accès aux opérations Bitcoin via l'API IBEX.
 *
 * @module features/bitcoin
 */

import type { HttpClient } from '../../core/http'
import type {
  BitcoinNetwork,
  BitcoinNetworkInfo,
  BitcoinFeeRates,
  BitcoinUtxosResponse,
  BitcoinBuildPsbtParams,
  BitcoinBuildPsbtResponse,
  BitcoinBroadcastParams,
  BitcoinBroadcastResponse,
  BitcoinSendPrepareParams,
  BitcoinSendPrepareResponse,
} from './bitcoin.types'

/**
 * Service de gestion des opérations Bitcoin
 */
export class BitcoinService {
  constructor(private http: HttpClient) {}

  /**
   * Récupère les informations du réseau Bitcoin
   *
   * Proxy de `getblockchaininfo` via WEB3_URL /btc/rpc.
   *
   * @param network - Réseau Bitcoin (mainnet ou testnet)
   * @returns Informations sur le réseau Bitcoin
   *
   * @example
   * ```typescript
   * const info = await bitcoinService.getNetworkInfo('mainnet');
   * console.log(`Current block: ${info.blocks}`);
   * ```
   */
  async getNetworkInfo(network: BitcoinNetwork = 'mainnet'): Promise<BitcoinNetworkInfo> {
    return this.http.request<BitcoinNetworkInfo>('/v1/safes/bitcoin/info', {
      method: 'GET',
      queryParams: { network },
      cache: true,
      cacheTTL: 60000, // 1 minute
    })
  }

  /**
   * Récupère les estimations de frais Bitcoin (sat/vB)
   *
   * Estime les niveaux de frais simples en utilisant `estimatesmartfee` via WEB3_URL /btc/rpc.
   *
   * @param network - Réseau Bitcoin (mainnet ou testnet)
   * @returns Estimations de frais pour slow, standard et fast
   *
   * @example
   * ```typescript
   * const fees = await bitcoinService.getFeeRates('mainnet');
   * console.log(`Standard fee: ${fees.standard} sat/vB`);
   * ```
   */
  async getFeeRates(network: BitcoinNetwork = 'mainnet'): Promise<BitcoinFeeRates> {
    return this.http.request<BitcoinFeeRates>('/v1/safes/bitcoin/fees', {
      method: 'GET',
      queryParams: { network },
      cache: true,
      cacheTTL: 30000, // 30 secondes
    })
  }

  /**
   * Liste les UTXOs pour une adresse Bitcoin
   *
   * Utilise Core `scantxoutset` avec un descripteur `addr(<address>)` lorsque activé sur le nœud.
   *
   * @param address - Adresse Bitcoin
   * @param network - Réseau Bitcoin (mainnet ou testnet)
   * @returns Liste des UTXOs disponibles
   *
   * @example
   * ```typescript
   * const utxos = await bitcoinService.getUtxos('bc1q...', 'mainnet');
   * console.log(`Found ${utxos.unspents.length} UTXOs`);
   * ```
   */
  async getUtxos(address: string, network: BitcoinNetwork = 'mainnet'): Promise<BitcoinUtxosResponse> {
    return this.http.request<BitcoinUtxosResponse>('/v1/safes/bitcoin/utxos', {
      method: 'GET',
      queryParams: { address, network },
      cache: true,
      cacheTTL: 10000, // 10 secondes
    })
  }

  /**
   * Construit un PSBT (Partially Signed Bitcoin Transaction)
   *
   * **Note**: Cet endpoint retourne actuellement 501 (Not Implemented).
   * La construction PSBT côté client est recommandée.
   * Un builder côté serveur pourra être ajouté ultérieurement.
   *
   * @param params - Paramètres de construction du PSBT
   * @returns PSBT ou erreur 501
   *
   * @example
   * ```typescript
   * try {
   *   const psbt = await bitcoinService.buildPsbt({
   *     inputs: [{ txid: '...', vout: 0, value: 100000, scriptPubKey: '...' }],
   *     outputs: [{ address: 'bc1q...', value: 90000 }],
   *     changeAddress: 'bc1q...',
   *     feeProfile: 'standard'
   *   });
   * } catch (error) {
   *   // Attendez-vous à une erreur 501 pour l'instant
   *   console.log('PSBT building not yet supported server-side');
   * }
   * ```
   */
  async buildPsbt(params: BitcoinBuildPsbtParams): Promise<BitcoinBuildPsbtResponse> {
    return this.http.request<BitcoinBuildPsbtResponse>('/v1/safes/bitcoin/psbt/build', {
      method: 'POST',
      body: params,
      cache: false,
    })
  }

  /**
   * Broadcaste une transaction Bitcoin signée (hex)
   *
   * @param params - Transaction brute et réseau
   * @returns ID de transaction et statut de succès
   *
   * @example
   * ```typescript
   * const result = await bitcoinService.broadcast({
   *   rawtx: '0200000001...',
   *   network: 'mainnet'
   * });
   * console.log(`Transaction broadcasted: ${result.txid}`);
   * ```
   */
  async broadcast(params: BitcoinBroadcastParams): Promise<BitcoinBroadcastResponse> {
    return this.http.request<BitcoinBroadcastResponse>('/v1/safes/bitcoin/tx/broadcast', {
      method: 'POST',
      body: params,
      cache: false,
    })
  }

  /**
   * Prépare un envoi Bitcoin simple (sans signature)
   *
   * Sélectionne les UTXOs, estime les frais, calcule la monnaie.
   * Retourne une structure que le client peut transformer en PSBT.
   *
   * @param params - Paramètres de l'envoi
   * @returns UTXOs sélectionnés, outputs et frais estimés
   *
   * @example
   * ```typescript
   * const prepared = await bitcoinService.prepareSend({
   *   from: 'bc1q...',
   *   to: 'bc1q...',
   *   amountSat: 100000,
   *   feeProfile: 'standard',
   *   network: 'mainnet'
   * });
   * console.log(`Total fee: ${prepared.fee} sat`);
   * console.log(`Change output: ${prepared.changeOutput?.value} sat`);
   * ```
   */
  async prepareSend(params: BitcoinSendPrepareParams): Promise<BitcoinSendPrepareResponse> {
    return this.http.request<BitcoinSendPrepareResponse>('/v1/safes/bitcoin/send/prepare', {
      method: 'POST',
      body: params,
      cache: false,
    })
  }
}
