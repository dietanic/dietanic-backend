import { Product, Category } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

// Synchronous getters for SEO service
export const getProducts = (): Product[] => getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
export const getCategories = (): Category[] => getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);

export const CatalogService = {
  getProducts: async (): Promise<Product[]> => {
    await delay();
    return getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    await delay(200);
    const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    return products.find(p => p.id === id);
  },

  getCategories: async (): Promise<Category[]> => {
    await delay(200);
    return getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },

  // Admin Ops
  addProduct: async (product: Product): Promise<void> => {
    await delay();
    const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    products.push(product);
    setLocalStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  updateProduct: async (updatedProduct: Product): Promise<void> => {
    await delay();
    const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      setLocalStorage(STORAGE_KEYS.PRODUCTS, products);
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay();
    let products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    products = products.filter(p => p.id !== id);
    setLocalStorage(STORAGE_KEYS.PRODUCTS, products);
  }
};
