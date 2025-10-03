// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Cache pour IBEX SDK
 */

interface CacheEntry {
  data: unknown;
  timer: NodeJS.Timeout;
}

/**
 * Gestionnaire de cache avec TTL automatique
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry>();

  /**
   * Stocker des données dans le cache avec TTL automatique
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    // Supprimer l'ancien timer s'il existe
    const existing = this.cache.get(key);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // Créer un nouveau timer pour l'expiration automatique
    const timer = setTimeout(() => {
      this.cache.delete(key);
    }, ttl);

    // Stocker avec le timer
    this.cache.set(key, { data, timer });
  }

  /**
   * Récupérer des données du cache
   * Plus besoin de vérifier l'expiration - gérée automatiquement
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : null;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.cache.delete(key);
    }
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    // Nettoyer tous les timers pour éviter les fuites mémoire
    for (const entry of this.cache.values()) {
      clearTimeout(entry.timer);
    }
    this.cache.clear();
  }

  /**
   * Invalider le cache par pattern (remplace le système de tags complexe)
   */
  invalidate(pattern: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(pattern)) {
        clearTimeout(entry.timer);
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): { size: number } {
    return { size: this.cache.size };
  }

  /**
   * Vérifier si une clé existe dans le cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Obtenir toutes les clés du cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
