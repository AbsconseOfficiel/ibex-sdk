// Copyright 2025 Dylan Enjolvin
// Licensed under the Apache License, Version 2.0
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// GitHub: https://github.com/AbsconseOfficiel
// LinkedIn: https://www.linkedin.com/in/dylanenjolvin/

/**
 * Gestionnaire de stockage unifié pour IBEX SDK
 * Centralise localStorage, sessionStorage, cache mémoire et données serveur
 */

interface StorageEntry<T = unknown> {
  data: T
  timestamp: number
  ttl?: number
  type: 'memory' | 'session' | 'persistent' | 'server'
}

interface StorageConfig {
  enableMemoryCache: boolean
  enableSessionStorage: boolean
  enablePersistentStorage: boolean
  defaultTTL: number
  maxMemorySize: number
}

/**
 * Gestionnaire de stockage unifié avec TTL automatique et persistance
 */
export class StorageManager {
  private memoryCache = new Map<string, StorageEntry>()
  private timers = new Map<string, NodeJS.Timeout>()
  private config: StorageConfig

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      enableMemoryCache: true,
      enableSessionStorage: true,
      enablePersistentStorage: true,
      defaultTTL: 60000, // 1 minute
      maxMemorySize: 100, // 100 entrées max en mémoire
      ...config,
    }
  }

  // ========================================================================
  // STOCKAGE UNIFIÉ
  // ========================================================================

  /**
   * Stocker des données avec gestion automatique du type de stockage
   */
  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number
      type?: 'memory' | 'session' | 'persistent' | 'server'
    } = {}
  ): void {
    const { ttl = this.config.defaultTTL, type = 'memory' } = options

    // Nettoyer l'ancien timer s'il existe
    this.clearTimer(key)

    // Créer l'entrée
    const entry: StorageEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      type,
    }

    // Stocker selon le type
    switch (type) {
      case 'memory':
        this.setInMemory(key, entry)
        break
      case 'session':
        this.setInSession(key, entry)
        break
      case 'persistent':
        this.setInPersistent(key, entry)
        break
      case 'server':
        // Pour les données serveur, on stocke en mémoire avec TTL court
        this.setInMemory(key, { ...entry, ttl: Math.min(ttl, 30000) })
        break
    }

    // Programmer l'expiration
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key)
      }, ttl)
      this.timers.set(key, timer)
    }

    // Gestion de la taille mémoire
    if (type === 'memory' && this.memoryCache.size > this.config.maxMemorySize) {
      this.evictOldestEntries()
    }
  }

  /**
   * Récupérer des données depuis le stockage approprié
   */
  get<T>(key: string): T | null {
    // 1. Vérifier en mémoire d'abord (le plus rapide)
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T
    }

    // 2. Vérifier en sessionStorage
    if (this.config.enableSessionStorage) {
      const sessionEntry = this.getFromSession(key)
      if (sessionEntry && !this.isExpired(sessionEntry)) {
        // Remettre en mémoire pour les prochains accès
        this.memoryCache.set(key, sessionEntry)
        return sessionEntry.data as T
      }
    }

    // 3. Vérifier en localStorage
    if (this.config.enablePersistentStorage) {
      const persistentEntry = this.getFromPersistent(key)
      if (persistentEntry && !this.isExpired(persistentEntry)) {
        // Remettre en mémoire pour les prochains accès
        this.memoryCache.set(key, persistentEntry)
        return persistentEntry.data as T
      }
    }

    return null
  }

  /**
   * Supprimer des données de tous les stockages
   */
  delete(key: string): void {
    this.clearTimer(key)
    this.memoryCache.delete(key)

    if (this.config.enableSessionStorage) {
      const safeKey = key.startsWith('api_') ? key : `ibex_${key}`
      sessionStorage.removeItem(safeKey)
    }

    if (this.config.enablePersistentStorage) {
      localStorage.removeItem(`ibex_${key}`)
    }
  }

  /**
   * Vider tous les stockages
   */
  clear(): void {
    // Nettoyer tous les timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()

    // Vider la mémoire
    this.memoryCache.clear()

    // Vider les stockages navigateur
    if (this.config.enableSessionStorage) {
      this.clearStorageByPrefix(sessionStorage, 'ibex_')
      this.clearStorageByPrefix(sessionStorage, 'api_')
    }

    if (this.config.enablePersistentStorage) {
      this.clearStorageByPrefix(localStorage, 'ibex_')
    }
  }

  /**
   * Invalider par pattern
   */
  invalidate(pattern: string): void {
    const keysToDelete: string[] = []

    // Chercher dans la mémoire
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }

    // Chercher dans sessionStorage
    if (this.config.enableSessionStorage) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith('ibex_') || key.startsWith('api_')) && key.includes(pattern)) {
          const cleanKey = key.startsWith('ibex_') ? key.replace('ibex_', '') : key
          keysToDelete.push(cleanKey)
        }
      }
    }

    // Chercher dans localStorage
    if (this.config.enablePersistentStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ibex_') && key.includes(pattern)) {
          keysToDelete.push(key.replace('ibex_', ''))
        }
      }
    }

    // Supprimer toutes les clés trouvées
    keysToDelete.forEach(key => this.delete(key))
  }

  // ========================================================================
  // MÉTHODES SPÉCIALISÉES
  // ========================================================================

  /**
   * Stocker des tokens d'authentification (sessionStorage sécurisé)
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    this.set('access_token', accessToken, {
      type: 'session',
      ttl: 0, // Pas d'expiration automatique
    })

    if (refreshToken) {
      this.set('refresh_token', refreshToken, {
        type: 'session',
        ttl: 0,
      })
    }
  }

  /**
   * Récupérer les tokens d'authentification
   */
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.get<string>('access_token'),
      refreshToken: this.get<string>('refresh_token'),
    }
  }

  /**
   * Supprimer les tokens d'authentification
   */
  clearTokens(): void {
    this.delete('access_token')
    this.delete('refresh_token')
  }

  /**
   * Stocker des données utilisateur (persistant)
   */
  setUserData(userData: unknown): void {
    this.set('user_data', userData, {
      type: 'persistent',
      ttl: 0,
    })
  }

  /**
   * Récupérer les données utilisateur
   */
  getUserData<T>(): T | null {
    return this.get<T>('user_data')
  }

  /**
   * Stocker des données de cache (mémoire + session)
   */
  setCacheData<T>(key: string, data: T, ttl: number = 30000): void {
    this.set(key, data, {
      type: 'memory',
      ttl,
    })

    // Sauvegarder aussi en session pour la persistance
    if (this.config.enableSessionStorage) {
      this.set(`cache_${key}`, data, {
        type: 'session',
        ttl: ttl * 2, // TTL plus long en session
      })
    }
  }

  /**
   * Récupérer des données de cache
   */
  getCacheData<T>(key: string): T | null {
    // Essayer d'abord en mémoire
    const memoryData = this.get<T>(key)
    if (memoryData) return memoryData

    // Essayer en session
    if (this.config.enableSessionStorage) {
      const sessionData = this.get<T>(`cache_${key}`)
      if (sessionData) {
        // Remettre en mémoire
        this.set(key, sessionData, { type: 'memory', ttl: 30000 })
        return sessionData
      }
    }

    return null
  }

  // ========================================================================
  // MÉTHODES PRIVÉES
  // ========================================================================

  private setInMemory<T>(key: string, entry: StorageEntry<T>): void {
    if (!this.config.enableMemoryCache) return
    this.memoryCache.set(key, entry)
  }

  private setInSession<T>(key: string, entry: StorageEntry<T>): void {
    if (!this.config.enableSessionStorage || typeof window === 'undefined') return
    try {
      // Masquer les clés sensibles dans les DevTools
      const safeKey = key.startsWith('api_') ? key : `ibex_${key}`
      sessionStorage.setItem(safeKey, JSON.stringify(entry))
    } catch (error) {
      console.warn('SessionStorage full, falling back to memory only')
    }
  }

  private setInPersistent<T>(key: string, entry: StorageEntry<T>): void {
    if (!this.config.enablePersistentStorage || typeof window === 'undefined') return
    try {
      localStorage.setItem(`ibex_${key}`, JSON.stringify(entry))
    } catch (error) {
      console.warn('LocalStorage full, falling back to session only')
    }
  }

  private getFromSession<T>(key: string): StorageEntry<T> | null {
    if (!this.config.enableSessionStorage || typeof window === 'undefined') return null
    try {
      // Chercher avec le bon préfixe selon le type de clé
      const safeKey = key.startsWith('api_') ? key : `ibex_${key}`
      const data = sessionStorage.getItem(safeKey)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  private getFromPersistent<T>(key: string): StorageEntry<T> | null {
    if (!this.config.enablePersistentStorage || typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(`ibex_${key}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  private isExpired(entry: StorageEntry): boolean {
    if (!entry.ttl || entry.ttl === 0) return false
    return Date.now() - entry.timestamp > entry.ttl
  }

  private clearTimer(key: string): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.memoryCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    )

    // Supprimer les 20% les plus anciens
    const toDelete = Math.ceil(entries.length * 0.2)
    for (let i = 0; i < toDelete; i++) {
      const entry = entries[i]
      if (entry) {
        const [key] = entry
        this.delete(key)
      }
    }
  }

  private clearStorageByPrefix(storage: Storage, prefix: string): void {
    const keysToRemove: string[] = []

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key))
  }

  // ========================================================================
  // STATISTIQUES
  // ========================================================================

  /**
   * Obtenir les statistiques du stockage
   */
  getStats(): {
    memoryEntries: number
    sessionEntries: number
    persistentEntries: number
    totalSize: number
  } {
    let sessionEntries = 0
    let persistentEntries = 0

    if (this.config.enableSessionStorage && typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith('ibex_') || key.startsWith('api_'))) {
          sessionEntries++
        }
      }
    }

    if (this.config.enablePersistentStorage && typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ibex_')) {
          persistentEntries++
        }
      }
    }

    return {
      memoryEntries: this.memoryCache.size,
      sessionEntries,
      persistentEntries,
      totalSize: this.memoryCache.size + sessionEntries + persistentEntries,
    }
  }

  /**
   * Vérifier si une clé existe
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Obtenir toutes les clés
   */
  keys(): string[] {
    const allKeys = new Set<string>()

    // Clés en mémoire
    for (const key of this.memoryCache.keys()) {
      allKeys.add(key)
    }

    // Clés en sessionStorage
    if (this.config.enableSessionStorage && typeof window !== 'undefined') {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith('ibex_') || key.startsWith('api_'))) {
          const cleanKey = key.startsWith('ibex_') ? key.replace('ibex_', '') : key
          allKeys.add(cleanKey)
        }
      }
    }

    // Clés en localStorage
    if (this.config.enablePersistentStorage && typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ibex_')) {
          allKeys.add(key.replace('ibex_', ''))
        }
      }
    }

    return Array.from(allKeys)
  }
}
