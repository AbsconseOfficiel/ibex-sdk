// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Types pour le module Bitcoin - OpenAPI v1
 *
 * @module features/bitcoin/types
 */

// ============================================================================
// BITCOIN TYPES
// ============================================================================

/**
 * Réseau Bitcoin
 */
export type BitcoinNetwork = 'mainnet' | 'testnet'

/**
 * Profil de frais Bitcoin
 */
export type BitcoinFeeProfile = 'slow' | 'standard' | 'fast'

// ============================================================================
// BITCOIN INFO
// ============================================================================

/**
 * Informations sur le réseau Bitcoin
 * Proxy de getblockchaininfo via WEB3_URL /btc/rpc
 */
export interface BitcoinNetworkInfo {
  chain: string
  blocks: number
  headers: number
  bestblockhash: string
  difficulty: number
  mediantime: number
  verificationprogress: number
  chainwork: string
  pruned: boolean
  [key: string]: unknown
}

// ============================================================================
// BITCOIN FEES
// ============================================================================

/**
 * Estimations des frais Bitcoin (sat/vB)
 */
export interface BitcoinFeeRates {
  slow: number
  standard: number
  fast: number
}

// ============================================================================
// BITCOIN UTXOS
// ============================================================================

/**
 * UTXO Bitcoin
 */
export interface BitcoinUTXO {
  txid: string
  vout: number
  address: string
  scriptPubKey: string
  amount: number
  confirmations: number
  spendable: boolean
  solvable: boolean
}

/**
 * Réponse de liste d'UTXOs
 */
export interface BitcoinUtxosResponse {
  success: boolean
  unspents: BitcoinUTXO[]
  total_amount: number
}

// ============================================================================
// BITCOIN PSBT
// ============================================================================

/**
 * Input PSBT
 */
export interface BitcoinPsbtInput {
  txid: string
  vout: number
  value: number
  scriptPubKey: string
}

/**
 * Output PSBT
 */
export interface BitcoinPsbtOutput {
  address: string
  value: number
}

/**
 * Paramètres pour construire un PSBT
 */
export interface BitcoinBuildPsbtParams {
  inputs: BitcoinPsbtInput[]
  outputs: BitcoinPsbtOutput[]
  changeAddress?: string
  sendAll?: boolean
  feeProfile?: BitcoinFeeProfile
  network?: BitcoinNetwork
}

/**
 * Réponse de construction de PSBT
 * Note: L'endpoint retourne 501 (Not Implemented) pour l'instant
 */
export interface BitcoinBuildPsbtResponse {
  psbt?: string
  error?: string
  message?: string
}

// ============================================================================
// BITCOIN BROADCAST
// ============================================================================

/**
 * Paramètres pour broadcaster une transaction
 */
export interface BitcoinBroadcastParams {
  rawtx: string
  network?: BitcoinNetwork
}

/**
 * Réponse de broadcast de transaction
 */
export interface BitcoinBroadcastResponse {
  txid: string
  success: boolean
}

// ============================================================================
// BITCOIN SEND PREPARE
// ============================================================================

/**
 * Paramètres pour préparer un envoi Bitcoin
 */
export interface BitcoinSendPrepareParams {
  from: string
  to: string
  amountSat?: number
  sendAll?: boolean
  feeProfile?: BitcoinFeeProfile
  network?: BitcoinNetwork
  externalFeeSponsor?: boolean
}

/**
 * UTXO sélectionné pour l'envoi
 */
export interface SelectedUTXO {
  txid: string
  vout: number
  value: number
  scriptPubKey: string
}

/**
 * Réponse de préparation d'envoi Bitcoin
 */
export interface BitcoinSendPrepareResponse {
  inputs: SelectedUTXO[]
  outputs: BitcoinPsbtOutput[]
  changeOutput?: BitcoinPsbtOutput
  fee: number
  totalInput: number
  totalOutput: number
  network: BitcoinNetwork
}
