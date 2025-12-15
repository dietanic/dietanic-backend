
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

export const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const getLocalStorage = <T>(key: string, defaultVal: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultVal;
};

export const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const initStore = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) setLocalStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) setLocalStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) setLocalStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) setLocalStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) setLocalStorage(STORAGE_KEYS.ORDERS, []);
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) setLocalStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  if (!localStorage.getItem(STORAGE_KEYS.DISCOUNTS)) setLocalStorage(STORAGE_KEYS.DISCOUNTS, INITIAL_DISCOUNTS);
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) setLocalStorage(STORAGE_KEYS.CURRENT_USER_ID, MOCK_USER.id);
  if (!localStorage.getItem(STORAGE_KEYS.CHATS)) setLocalStorage(STORAGE_KEYS.CHATS, []);
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) setLocalStorage(STORAGE_KEYS.MESSAGES, []);
  // Note: TAX_SETTINGS defaults are handled in the service level
};
