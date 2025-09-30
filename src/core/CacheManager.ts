// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Gestionnaire de cache intelligent pour IBEX SDK
 * Cache optimisé avec TTL et invalidation intelligente
 */

/**
 * Entrée de cache avec métadonnées
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

/**
 * Gestionnaire de cache avec TTL et invalidation par tags
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>();

  // ========================================================================
  // GESTION DU CACHE
  // ========================================================================

  /**
   * Stocker des données dans le cache
   */
  set<T>(key: string, data: T, ttl: number = 60000, tags: string[] = []): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    });

    // Indexer par tags
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)?.add(key);
    });
  }

  /**
   * Récupérer des données du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry?.tags) {
      // Nettoyer l'index des tags
      entry.tags.forEach(tag => {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }
    this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  // ========================================================================
  // INVALIDATION PAR TAGS
  // ========================================================================

  /**
   * Invalider le cache par tag
   */
  invalidateByTag(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      keys.forEach(key => this.delete(key));
    }
  }

  /**
   * Invalider le cache par pattern
   */
  invalidateByPattern(pattern: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }

  // ========================================================================
  // NETTOYAGE AUTOMATIQUE
  // ========================================================================

  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
      }
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    tags: string[];
  } {
    const now = Date.now();
    let expiredEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      tags: Array.from(this.tagIndex.keys()),
    };
  }

  // ========================================================================
  // TAGS PRÉDÉFINIS POUR IBEX
  // ========================================================================

  static readonly TAGS = {
    USER: 'user',
    WALLET: 'wallet',
    BALANCE: 'balance',
    TRANSACTIONS: 'transactions',
    OPERATIONS: 'operations',
    KYC: 'kyc',
    IBEX_SAFE: 'ibex_safe',
  } as const;
}
