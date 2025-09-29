// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Utilitaires de validation pour le SDK IBEX
 * Validation des données utilisateur et blockchain
 */

// ============================================================================
// VALIDATION DES ADRESSES
// ============================================================================

/**
 * Valide une adresse Ethereum
 * @param address - Adresse à valider
 * @returns True si l'adresse est valide
 *
 * @example
 * isValidAddress("0x1234567890abcdef1234567890abcdef12345678") // true
 * isValidAddress("invalid") // false
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Valide un IBAN
 * @param iban - IBAN à valider
 * @returns True si l'IBAN est valide
 *
 * @example
 * isValidIban("FR1420041010050500013M02606") // true
 * isValidIban("invalid") // false
 */
export function isValidIban(iban: string): boolean {
  // Validation basique d'IBAN (format général)
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(iban.replace(/\s/g, ''));
}

// ============================================================================
// VALIDATION DES MONTANTS
// ============================================================================

/**
 * Valide un montant numérique
 * @param amount - Montant à valider
 * @param options - Options de validation
 * @returns True si le montant est valide
 *
 * @example
 * isValidAmount(100) // true
 * isValidAmount(-50) // false (si min: 0)
 */
export function isValidAmount(
  amount: number,
  options: { min?: number; max?: number } = {}
): boolean {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = options;
  return !isNaN(amount) && amount >= min && amount <= max;
}

/**
 * Valide un montant en string
 * @param amount - Montant à valider
 * @param options - Options de validation
 * @returns True si le montant est valide
 */
export function isValidAmountString(
  amount: string,
  options: { min?: number; max?: number } = {}
): boolean {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && isValidAmount(numAmount, options);
}

// ============================================================================
// VALIDATION DES EMAILS
// ============================================================================

/**
 * Valide un email
 * @param email - Email à valider
 * @returns True si l'email est valide
 *
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid") // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// VALIDATION DES CONFIGURATIONS
// ============================================================================

/**
 * Valide une configuration IBEX
 * @param config - Configuration à valider
 * @returns True si la configuration est valide
 */
export function isValidConfig(config: any): config is {
  baseURL: string;
  domain: string;
  rpId?: string;
  defaultChainId?: number;
  timeout?: number;
  retries?: number;
} {
  if (!config || typeof config !== 'object') return false;

  if (!config.baseURL || typeof config.baseURL !== 'string') return false;
  if (!config.domain || typeof config.domain !== 'string') return false;

  // Vérifier que l'URL est valide
  try {
    new URL(config.baseURL);
  } catch {
    return false;
  }

  return true;
}

// ============================================================================
// VALIDATION DES DONNÉES UTILISATEUR
// ============================================================================

/**
 * Valide les données utilisateur privées
 * @param data - Données à valider
 * @returns True si les données sont valides
 */
export function isValidUserData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Vérifier qu'il n'y a pas de clés vides
  for (const key in data) {
    if (key.trim() === '') return false;
  }

  return true;
}

// ============================================================================
// VALIDATION DES OPÉRATIONS SAFE
// ============================================================================

/**
 * Valide une opération Safe
 * @param operation - Opération à valider
 * @returns True si l'opération est valide
 */
export function isValidSafeOperation(operation: any): boolean {
  if (!operation || typeof operation !== 'object') return false;

  const validTypes = [
    'TRANSFER_EURe',
    'MONERIUM_CREATE_IBAN',
    'MONERIUM_WITHDRAW_EURe',
    'SIGN_MESSAGE',
    'ENABLE_RECOVERY',
    'CANCEL_RECOVERY',
  ];

  if (!validTypes.includes(operation.type)) return false;

  // Vérifier les champs requis selon le type
  switch (operation.type) {
    case 'TRANSFER_EURe':
      return operation.to && operation.amount;
    case 'MONERIUM_WITHDRAW_EURe':
      return operation.amount && operation.to; // 'to' contient l'IBAN
    case 'SIGN_MESSAGE':
      return operation.message;
    case 'ENABLE_RECOVERY':
      return operation.firstName && operation.lastName && operation.birthDate;
    default:
      return true;
  }
}

// ============================================================================
// VALIDATION DES PARAMÈTRES DE TRANSACTION
// ============================================================================

/**
 * Valide les paramètres de transaction
 * @param params - Paramètres à valider
 * @returns True si les paramètres sont valides
 */
export function isValidTransactionParams(params: any): boolean {
  if (!params || typeof params !== 'object') return false;

  // Vérifier les dates si présentes
  if (params.startDate && !isValidDate(params.startDate)) return false;
  if (params.endDate && !isValidDate(params.endDate)) return false;

  // Vérifier la pagination
  if (params.limit && (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 100))
    return false;
  if (params.page && (!Number.isInteger(params.page) || params.page < 1)) return false;

  return true;
}

/**
 * Valide une date au format YYYY-MM-DD
 * @param date - Date à valider
 * @returns True si la date est valide
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}
