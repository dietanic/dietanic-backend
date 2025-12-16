
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

export const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const getLocalStorage = <T>(key: string, defaultVal: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultVal;
};

export const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Generic Data Access Layer for Microservices
export const DB = {
    getAll: async <T>(key: string, def: T[] = []) => { await delay(); return getLocalStorage<T[]>(key, def); },
    getById: async <T extends {id:string}>(key: string, id: string, def: T[] = []) => { await delay(); return getLocalStorage<T[]>(key, def).find(i => i.id === id); },
    add: async <T>(key: string, item: T, def: T[] = []) => { await delay(); const d = getLocalStorage<T[]>(key, def); d.push(item); setLocalStorage(key, d); },
    update: async <T extends {id:string}>(key: string, item: T, def: T[] = []) => { await delay(); const d = getLocalStorage<T[]>(key, def); const i = d.findIndex(x=>x.id===item.id); if(i>-1) d[i]=item; setLocalStorage(key, d); },
    upsert: async <T extends {id:string}>(key: string, item: T, def: T[] = []) => { await delay(); const d = getLocalStorage<T[]>(key, def); const i = d.findIndex(x=>x.id===item.id); if(i>-1) d[i]=item; else d.push(item); setLocalStorage(key, d); },
    delete: async <T extends {id:string}>(key: string, id: string, def: T[] = []) => { await delay(); const d = getLocalStorage<T[]>(key, def); setLocalStorage(key, d.filter(x=>x.id!==id)); }
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
