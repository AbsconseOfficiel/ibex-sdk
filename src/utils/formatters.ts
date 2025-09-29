// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Utilitaires de formatage simplifiés pour le SDK IBEX
 * Fonctions essentielles pour l'affichage des données
 */

// ============================================================================
// FORMATAGE DES MONNAIES
// ============================================================================

/**
 * Formate un montant en euros
 * @param amount - Montant à formater
 * @param options - Options de formatage
 * @returns Montant formaté avec le symbole €
 *
 * @example
 * formatCurrency(1234.56) // "1 234,56 €"
 * formatCurrency(1234.56, { precision: 0 }) // "1 235 €"
 */
export function formatCurrency(
  amount: number,
  options: { precision?: number; showSymbol?: boolean } = {}
): string {
  const { precision = 2, showSymbol = true } = options;

  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return showSymbol ? formatter.format(amount) : formatter.format(amount).replace('€', '').trim();
}

/**
 * Formate un montant en USD
 * @param amount - Montant à formater
 * @param options - Options de formatage
 * @returns Montant formaté avec le symbole $
 *
 * @example
 * formatUsd(1234.56) // "$1,234.56"
 */
export function formatUsd(amount: number, options: { precision?: number } = {}): string {
  const { precision = 2 } = options;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return formatter.format(amount);
}

// ============================================================================
// FORMATAGE DES ADRESSES
// ============================================================================

/**
 * Formate une adresse blockchain pour l'affichage
 * @param address - Adresse complète
 * @param options - Options de formatage
 * @returns Adresse formatée
 *
 * @example
 * formatAddress("0x1234567890abcdef1234567890abcdef12345678") // "0x12345678...12345678"
 */
export function formatAddress(
  address: string,
  options: { startLength?: number; endLength?: number } = {}
): string {
  const { startLength = 8, endLength = 6 } = options;

  if (!address) return 'Adresse inconnue';
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Formate un hash de transaction pour l'affichage
 * @param hash - Hash complet
 * @param options - Options de formatage
 * @returns Hash formaté
 *
 * @example
 * formatHash("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")
 * // "0xabcdef12...34567890"
 */
export function formatHash(
  hash: string,
  options: { startLength?: number; endLength?: number } = {}
): string {
  const { startLength = 10, endLength = 8 } = options;

  if (!hash) return 'Hash inconnu';
  if (hash.length <= startLength + endLength) return hash;

  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

// ============================================================================
// FORMATAGE DES DATES
// ============================================================================

/**
 * Formate une date pour l'affichage
 * @param date - Date à formater
 * @param options - Options de formatage
 * @returns Date formatée
 *
 * @example
 * formatDate("2025-01-15T10:30:00Z") // "15 janv. 2025, 10:30"
 * formatDate("2025-01-15T10:30:00Z", { style: "short" }) // "15/01/2025"
 */
export function formatDate(
  date: string | Date,
  options: {
    style?: 'short' | 'medium' | 'long';
    showTime?: boolean;
    locale?: string;
  } = {}
): string {
  const { style = 'medium', showTime = true, locale = 'fr-FR' } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: style === 'short' ? '2-digit' : 'short',
    day: '2-digit',
  };

  if (showTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }

  return dateObj.toLocaleDateString(locale, formatOptions);
}

/**
 * Formate une date relative (il y a X temps)
 * @param date - Date à formater
 * @param locale - Locale (défaut: 'fr-FR')
 * @returns Date relative formatée
 *
 * @example
 * formatRelativeDate("2025-01-15T10:30:00Z") // "il y a 2 heures"
 */
export function formatRelativeDate(date: string | Date, locale: string = 'fr-FR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const diffInSeconds = (dateObj.getTime() - now.getTime()) / 1000;
  const absDiff = Math.abs(diffInSeconds);

  if (absDiff < 60) return rtf.format(Math.round(diffInSeconds), 'second');
  if (absDiff < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  if (absDiff < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  if (absDiff < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), 'day');
  if (absDiff < 31536000) return rtf.format(Math.round(diffInSeconds / 2592000), 'month');

  return rtf.format(Math.round(diffInSeconds / 31536000), 'year');
}

// ============================================================================
// UTILITAIRES DE STATUT
// ============================================================================

/**
 * Obtient les classes CSS pour le statut d'une transaction
 * @param status - Statut de la transaction
 * @returns Classes CSS Tailwind
 *
 * @example
 * getStatusClasses("confirmed") // "text-green-800 bg-green-100"
 */
export function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
    case 'success':
      return 'text-green-800 bg-green-100';
    case 'pending':
      return 'text-yellow-800 bg-yellow-100';
    case 'failed':
    case 'error':
      return 'text-red-800 bg-red-100';
    default:
      return 'text-gray-800 bg-gray-100';
  }
}

/**
 * Obtient l'icône d'un type de transaction
 * @param type - Type de transaction
 * @returns Icône Unicode
 *
 * @example
 * getTransactionIcon("IN") // "⬇️"
 * getTransactionIcon("OUT") // "⬆️"
 */
export function getTransactionIcon(type: string): string {
  switch (type.toUpperCase()) {
    case 'IN':
      return '⬇️';
    case 'OUT':
      return '⬆️';
    default:
      return '💱';
  }
}

/**
 * Obtient l'icône d'un type d'opération
 * @param type - Type d'opération
 * @returns Icône Unicode
 *
 * @example
 * getOperationIcon("TRANSFER") // "💸"
 * getOperationIcon("WITHDRAW") // "🏦"
 */
export function getOperationIcon(type: string): string {
  switch (type.toUpperCase()) {
    case 'TRANSFER':
      return '💸';
    case 'WITHDRAW':
      return '🏦';
    case 'KYC':
      return '✅';
    case 'IBAN_CREATE':
      return '🏦';
    default:
      return '📋';
  }
}
