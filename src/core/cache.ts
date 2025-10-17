// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

/**
 * Système de cache multi-niveaux intelligent pour IBEX SDK
 *
 * Niveaux de cache:
 * - L1: Memory cache (le plus rapide, volatile)
 * - L2: SessionStorage (persistant pendant la session)
 * - L3: LocalStorage (persistant entre sessions)
 *
 * Features:
 * - TTL automatique par entrée
 * - LRU eviction pour memory cache
 * - Stratégies de cache par type de donnée
 * - Invalidation par pattern
 * - Compression pour données volumineuses
 * - Metrics détaillées
 *
 * @module core/cache
 */

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

type CacheLevel = 'memory' | 'session' | 'persistent';

interface CacheStrategy {
  ttl: number;
  level: CacheLevel;
  compress?: boolean;
}

export interface CacheMetrics {
  memorySize: number;
  sessionSize: number;
  persistentSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

// ============================================================================
// CACHE STRATEGIES
// ============================================================================

/**
 * Stratégies de cache pré-configurées par type de donnée
 */
export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  // Données utilisateur - Session, 1 minute
  user: { ttl: 60000, level: 'session' },

  // Balance - Memory, 10 secondes
  balance: { ttl: 10000, level: 'memory' },

  // Transactions - Memory, 30 secondes
  transactions: { ttl: 30000, level: 'memory' },

  // Opérations - Memory, 30 secondes
  operations: { ttl: 30000, level: 'memory' },

  // Chain IDs - Persistent, 1 heure
  chainIds: { ttl: 3600000, level: 'persistent' },

  // Recovery status - Session, 1 minute
  recovery: { ttl: 60000, level: 'session' },

  // Données privées - Session, 5 minutes
  privateData: { ttl: 300000, level: 'session' },

  // Configuration - Persistent, 24 heures
  config: { ttl: 86400000, level: 'persistent' },

  // Adresses wallet - Persistent, 5 minutes
  addresses: { ttl: 300000, level: 'persistent' },
};

// ============================================================================
// CACHE MANAGER
// ============================================================================

/**
 * Gestionnaire de cache multi-niveaux
 */
export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private maxMemorySize = 100; // Nombre max d'entrées en mémoire
  private timers = new Map<string, NodeJS.Timeout>();

  // Metrics
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxMemorySize?: number) {
    if (maxMemorySize) {
      this.maxMemorySize = maxMemorySize;
    }
  }

  // ========================================================================
  // GET/SET
  // ========================================================================

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    // L1: Memory cache
    const memoryEntry = this.getFromMemory<T>(key);
    if (memoryEntry) {
      this.metrics.hits++;
      return memoryEntry;
    }

    // L2: Session storage
    const sessionEntry = this.getFromSession<T>(key);
    if (sessionEntry) {
      // Promouvoir en memory cache
      this.setInMemory(key, sessionEntry, CACHE_STRATEGIES.user.ttl);
      this.metrics.hits++;
      return sessionEntry;
    }

    // L3: Local storage
    const persistentEntry = this.getFromPersistent<T>(key);
    if (persistentEntry) {
      // Promouvoir en memory cache
      this.setInMemory(key, persistentEntry, CACHE_STRATEGIES.user.ttl);
      this.metrics.hits++;
      return persistentEntry;
    }

    this.metrics.misses++;
    return null;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, options: { ttl?: number; level?: CacheLevel } = {}): void {
    const { ttl = 60000, level = 'memory' } = options;

    switch (level) {
      case 'memory':
        this.setInMemory(key, data, ttl);
        break;
      case 'session':
        this.setInSession(key, data, ttl);
        // Aussi en memory pour accès rapide
        this.setInMemory(key, data, Math.min(ttl, 30000));
        break;
      case 'persistent':
        this.setInPersistent(key, data, ttl);
        // Aussi en memory pour accès rapide
        this.setInMemory(key, data, Math.min(ttl, 30000));
        break;
    }
  }

  /**
   * Stocke selon une stratégie pré-définie
   */
  setWithStrategy<T>(key: string, data: T, strategyName: string): void {
    const strategy = CACHE_STRATEGIES[strategyName];
    if (!strategy) {
      // Fallback sur stratégie par défaut
      this.set(key, data);
      return;
    }

    this.set(key, data, { ttl: strategy.ttl, level: strategy.level });
  }

  // ========================================================================
  // MEMORY CACHE
  // ========================================================================

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    // Nettoyer l'ancien timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Créer l'entrée
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now(),
    };

    this.memoryCache.set(key, entry);

    // Programmer l'expiration
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.memoryCache.delete(key);
        this.timers.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    // Éviction LRU si trop d'entrées
    if (this.memoryCache.size > this.maxMemorySize) {
      this.evictLRU();
    }
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    // Vérifier l'expiration
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
      return null;
    }

    // Mettre à jour les stats d'accès
    entry.accessCount++;
    entry.lastAccess = Date.now();

    return entry.data as T;
  }

  /**
   * Éviction LRU (Least Recently Used)
   */
  private evictLRU(): void {
    // Trouver l'entrée la moins récemment utilisée
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey);
      const timer = this.timers.get(lruKey);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(lruKey);
      }
      this.metrics.evictions++;
    }
  }

  // ========================================================================
  // SESSION STORAGE
  // ========================================================================

  private setInSession<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccess: Date.now(),
      };
      sessionStorage.setItem(`ibex_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      // Storage plein, ignorer silencieusement
    }
  }

  private getFromSession<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = sessionStorage.getItem(`ibex_cache_${key}`);
      if (!data) return null;

      const entry: CacheEntry<T> = JSON.parse(data);

      // Vérifier l'expiration
      if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
        sessionStorage.removeItem(`ibex_cache_${key}`);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  // ========================================================================
  // PERSISTENT STORAGE
  // ========================================================================

  private setInPersistent<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccess: Date.now(),
      };
      localStorage.setItem(`ibex_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      // Storage plein, ignorer silencieusement
    }
  }

  private getFromPersistent<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(`ibex_cache_${key}`);
      if (!data) return null;

      const entry: CacheEntry<T> = JSON.parse(data);

      // Vérifier l'expiration
      if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(`ibex_cache_${key}`);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  // ========================================================================
  // DELETE & CLEAR
  // ========================================================================

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    // Memory
    this.memoryCache.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    // Session
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`ibex_cache_${key}`);
      localStorage.removeItem(`ibex_cache_${key}`);
    }
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    // Nettoyer les timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Vider memory cache
    this.memoryCache.clear();

    // Vider les storages navigateur
    if (typeof window !== 'undefined') {
      this.clearStorageByPrefix(sessionStorage, 'ibex_cache_');
      this.clearStorageByPrefix(localStorage, 'ibex_cache_');
    }
  }

  /**
   * Invalide le cache par pattern
   */
  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];

    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    // Session storage
    if (typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('ibex_cache_') && key.includes(pattern)) {
          keysToDelete.push(key.replace('ibex_cache_', ''));
        }
      }

      // Local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ibex_cache_') && key.includes(pattern)) {
          keysToDelete.push(key.replace('ibex_cache_', ''));
        }
      }
    }

    // Supprimer toutes les clés trouvées
    keysToDelete.forEach(key => this.delete(key));
  }

  private clearStorageByPrefix(storage: Storage, prefix: string): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));
  }

  // ========================================================================
  // METRICS
  // ========================================================================

  /**
   * Récupère les métriques du cache
   */
  getMetrics(): CacheMetrics {
    let sessionSize = 0;
    let persistentSize = 0;

    if (typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('ibex_cache_')) {
          sessionSize++;
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ibex_cache_')) {
          persistentSize++;
        }
      }
    }

    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    return {
      memorySize: this.memoryCache.size,
      sessionSize,
      persistentSize,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      evictions: this.metrics.evictions,
      hitRate,
    };
  }

  /**
   * Réinitialise les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Vérifie si une clé existe
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Récupère toutes les clés du cache
   */
  keys(): string[] {
    const allKeys = new Set<string>();

    // Memory
    for (const key of this.memoryCache.keys()) {
      allKeys.add(key);
    }

    // Session & Persistent
    if (typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('ibex_cache_')) {
          allKeys.add(key.replace('ibex_cache_', ''));
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ibex_cache_')) {
          allKeys.add(key.replace('ibex_cache_', ''));
        }
      }
    }

    return Array.from(allKeys);
  }
}
