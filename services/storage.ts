
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_USERS, INITIAL_REVIEWS, INITIAL_DISCOUNTS, INITIAL_CUSTOMERS, MOCK_USER, INITIAL_WAREHOUSES, INITIAL_ORG_STRUCTURE } from '../constants';

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
  WAREHOUSES: 'dietanic_warehouses',
  BATCHES: 'dietanic_batches',
  SERIALS: 'dietanic_serials',
  ORG_STRUCTURE: 'dietanic_org_structure'
};

// --- Low-Level IndexedDB Wrapper ---
const DB_NAME = 'DietanicDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyvalue_store';

const idb = {
    db: null as IDBDatabase | null,
    
    init: (): Promise<void> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event) => {
                idb.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event) => {
                console.error("IndexedDB Error:", event);
                reject("Failed to open DB");
            };
        });
    },

    get: <T>(key: string): Promise<T | null> => {
        return new Promise((resolve) => {
            if (!idb.db) return resolve(null);
            const tx = idb.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    },

    set: <T>(key: string, value: T): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!idb.db) return reject("DB not initialized");
            const tx = idb.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject("Write failed");
        });
    },

    del: (key: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!idb.db) return resolve();
            const tx = idb.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(key);
            resolve();
        });
    }
};

// --- High-Speed Memory Layer ---
// We load everything into memory on boot. Reads are instant. Writes sync to IDB.
class HybridStore {
    private memory = new Map<string, any>();
    private initialized = false;

    async init() {
        if (this.initialized) return;
        
        await idb.init();
        
        // Hydrate from IDB
        const keys = Object.values(STORAGE_KEYS);
        await Promise.all(keys.map(async (key) => {
            const val = await idb.get(key);
            if (val) this.memory.set(key, val);
        }));

        this.initialized = true;
        console.log("⚡ Dietanic High-Speed DB Initialized");
    }

    // Sync Read (Instant)
    get<T>(key: string, defaultVal: T): T {
        return this.memory.has(key) ? this.memory.get(key) as T : defaultVal;
    }

    // Async Write (Non-blocking UI)
    async set<T>(key: string, value: T): Promise<void> {
        this.memory.set(key, value); // Instant update in memory
        await idb.set(key, value);   // Persist in background
    }
}

const store = new HybridStore();

export const delay = (ms: number = 50) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for Legacy Sync calls (fallback to localStorage if needed, but we try to use memory)
export const getLocalStorage = <T>(key: string, defaultVal: T): T => {
    // If it's a simple string key like user_id, use localStorage for simplicity across tabs
    if (key === STORAGE_KEYS.CURRENT_USER_ID) {
        return localStorage.getItem(key) as unknown as T || defaultVal;
    }
    // Otherwise use our high-speed store
    return store.get<T>(key, defaultVal);
};

export const setLocalStorage = <T>(key: string, value: T): void => {
    if (key === STORAGE_KEYS.CURRENT_USER_ID) {
        localStorage.setItem(key, value as unknown as string);
    } else {
        store.set(key, value);
    }
};

// --- Data Access Layer ---
export const DB = {
    getAll: async <T>(key: string, def: T[] = []) => { 
        return store.get<T[]>(key, def);
    },
    
    getById: async <T extends {id:string}>(key: string, id: string, def: T[] = []) => { 
        const data = store.get<T[]>(key, def);
        return data.find(i => i.id === id);
    },
    
    add: async <T>(key: string, item: T, def: T[] = []) => { 
        const d = store.get<T[]>(key, def);
        const newData = [...d, item];
        await store.set(key, newData);
    },
    
    update: async <T extends {id:string}>(key: string, item: T, def: T[] = []) => { 
        const d = store.get<T[]>(key, def);
        const i = d.findIndex(x=>x.id===item.id); 
        if(i>-1) {
            d[i] = item;
            await store.set(key, [...d]); // Create new ref for React
        }
    },
    
    upsert: async <T extends {id:string}>(key: string, item: T, def: T[] = []) => { 
        const d = store.get<T[]>(key, def);
        const i = d.findIndex(x=>x.id===item.id); 
        if(i>-1) d[i]=item; else d.push(item); 
        await store.set(key, [...d]);
    },
    
    delete: async <T extends {id:string}>(key: string, id: string, def: T[] = []) => { 
        const d = store.get<T[]>(key, def); 
        const filtered = d.filter(x=>x.id!==id);
        await store.set(key, filtered);
    }
};

export const initStore = async () => {
    // 1. Initialize the Hybrid DB Engine
    await store.init();

    // 2. Seed Data if empty
    const seeds = [
        [STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS],
        [STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES],
        [STORAGE_KEYS.USERS, INITIAL_USERS],
        [STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS],
        [STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS],
        [STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS],
        [STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES],
        [STORAGE_KEYS.ORG_STRUCTURE, INITIAL_ORG_STRUCTURE]
    ] as const;

    for (const [key, val] of seeds) {
        const existing = store.get(key, null);
        if (!existing) {
            console.log(`🌱 Seeding ${key}...`);
            await store.set(key, val);
        }
    }

    // Legacy support for user ID
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, MOCK_USER.id);
    }
};
