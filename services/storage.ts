
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_USERS, INITIAL_REVIEWS, INITIAL_DISCOUNTS, INITIAL_CUSTOMERS, MOCK_USER } from '../constants';

export const STORAGE_KEYS = {
  PRODUCTS: 'dietanic_products',
  CATEGORIES: 'dietanic_categories',
  ORDERS: 'dietanic_orders',
  CART: 'dietanic_cart',
  WISHLIST: 'dietanic_wishlist',
  USERS: 'dietanic_users',
  CUSTOMERS: 'dietanic_customers',
  REVIEWS: 'dietanic_reviews',
  DISCOUNTS: 'dietanic_discounts',
  CURRENT_USER_ID: 'dietanic_current_user_id',
  CHATS: 'dietanic_trackcomm_chats',
  MESSAGES: 'dietanic_trackcomm_messages',
  TAX_SETTINGS: 'dietanic_tax_settings',
};

// --- In-Memory Cache Implementation ---
class MemoryCache {
    private cache = new Map<string, any>();
    private ttls = new Map<string, number>();
    private readonly DEFAULT_TTL = 300000; // 5 minutes

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        const expiry = this.ttls.get(key);
        
        if (entry !== undefined && expiry && Date.now() < expiry) {
            console.debug(`[Cache] HIT: ${key}`);
            return entry as T;
        }
        
        if (entry !== undefined) {
            console.debug(`[Cache] EXPIRED: ${key}`);
            this.invalidate(key);
        }
        return null;
    }

    set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, value);
        this.ttls.set(key, Date.now() + ttl);
    }

    invalidate(key: string): void {
        this.cache.delete(key);
        this.ttls.delete(key);
    }

    clear(): void {
        this.cache.clear();
        this.ttls.clear();
    }
}

const cacheManager = new MemoryCache();

export const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const getLocalStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return defaultVal;
  }
};

export const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

// --- Augmented Data Access Layer with Cache Support ---
export const DB = {
    getAll: async <T>(key: string, def: T[] = []) => { 
        // 1. Check Memory Cache first
        const cached = cacheManager.get<T[]>(key);
        if (cached) return cached;

        // 2. Fallback to LocalStorage (Simulated HTTP Request)
        await delay(); 
        const data = getLocalStorage<T[]>(key, def);
        
        // 3. Hydrate Cache
        cacheManager.set(key, data);
        return data; 
    },
    
    getById: async <T extends {id:string}>(key: string, id: string, def: T[] = []) => { 
        // Logic: Get all (cached) then find
        const data = await DB.getAll<T>(key, def);
        return data.find(i => i.id === id);
    },
    
    add: async <T>(key: string, item: T, def: T[] = []) => { 
        await delay(); 
        const d = getLocalStorage<T[]>(key, def); 
        d.push(item); 
        setLocalStorage(key, d);
        // Invalidate cache to force refresh on next read
        cacheManager.invalidate(key);
    },
    
    update: async <T extends {id:string}>(key: string, item: T, def: T[] = []) => { 
        await delay(); 
        const d = getLocalStorage<T[]>(key, def); 
        const i = d.findIndex(x=>x.id===item.id); 
        if(i>-1) d[i]=item; 
        setLocalStorage(key, d);
        // Invalidate cache
        cacheManager.invalidate(key);
    },
    
    upsert: async <T extends {id:string}>(key: string, item: T, def: T[] = []) => { 
        await delay(); 
        const d = getLocalStorage<T[]>(key, def); 
        const i = d.findIndex(x=>x.id===item.id); 
        if(i>-1) d[i]=item; else d.push(item); 
        setLocalStorage(key, d);
        // Invalidate cache
        cacheManager.invalidate(key);
    },
    
    delete: async <T extends {id:string}>(key: string, id: string, def: T[] = []) => { 
        await delay(); 
        const d = getLocalStorage<T[]>(key, def); 
        const filtered = d.filter(x=>x.id!==id);
        setLocalStorage(key, filtered);
        // Invalidate cache
        cacheManager.invalidate(key);
    }
};

export const initStore = () => {
  const seeds = [
      [STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS],
      [STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES],
      [STORAGE_KEYS.USERS, INITIAL_USERS],
      [STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS],
      [STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS],
      [STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS],
      [STORAGE_KEYS.CURRENT_USER_ID, MOCK_USER.id]
  ] as const;
  seeds.forEach(([k, v]) => !localStorage.getItem(k) && setLocalStorage(k, v));
};
