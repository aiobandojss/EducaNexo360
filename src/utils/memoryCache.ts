interface CacheItem<T> {
  value: T;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>>;
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 300000) {
    // 5 minutos por defecto
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.startCleanupInterval();
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== null) return cachedValue;

    const freshValue = await callback();
    this.set(key, freshValue, ttl);
    return freshValue;
  }

  delete(pattern: string | RegExp): void {
    if (pattern instanceof RegExp) {
      // Si es una expresión regular, eliminar todas las claves que coincidan
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Si es una cadena, eliminar la clave exacta
      this.cache.delete(pattern);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Limpiar cada minuto
  }
}

export const memoryCache = new MemoryCache();
