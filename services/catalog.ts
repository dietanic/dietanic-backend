
import { Product, Category, CartItem } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { GlobalEventBus, EVENTS } from './eventBus';

// Note: Removed the GlobalEventBus.on(ORDER_CREATED) listener.
// Stock deduction is now handled transactionally by the SalesService Saga Orchestrator
// to ensure consistency with payment services.

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

  // --- Transactional Methods for Saga Pattern ---

  /**
   * Reserves stock for an order. 
   * Throws an error if stock is insufficient.
   * This acts as the "Prepare" phase of a transaction.
   */
  reserveStock: async (items: CartItem[]): Promise<void> => {
      // Simulate network latency for a write operation
      await delay(300);
      
      const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const updatedProducts = [...products]; // Create copy for atomic-like update

      for (const item of items) {
          const productIndex = updatedProducts.findIndex(p => p.id === item.id);
          if (productIndex === -1) throw new Error(`Product ${item.name} not found.`);
          
          const product = { ...updatedProducts[productIndex] }; // Shallow copy product

          // Skip stock check for gift cards (infinite)
          if (product.isGiftCard) continue;

          if (item.selectedVariation) {
              const vIdx = product.variations?.findIndex(v => v.id === item.selectedVariation?.id);
              if (vIdx === undefined || vIdx === -1 || !product.variations) {
                  throw new Error(`Variation ${item.selectedVariation.name} not found.`);
              }
              
              if (product.variations[vIdx].stock < item.quantity) {
                  throw new Error(`Insufficient stock for ${product.name} (${item.selectedVariation.name}).`);
              }
              
              // Deduct
              product.variations[vIdx].stock -= item.quantity;
          } else {
              if (product.stock < item.quantity) {
                  throw new Error(`Insufficient stock for ${product.name}.`);
              }
              // Deduct
              product.stock -= item.quantity;
          }
          
          updatedProducts[productIndex] = product;
      }

      // Commit changes
      setLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
      console.log('📦 Catalog Microservice: Stock reserved.');
  },

  /**
   * Compensating Transaction.
   * Restores stock if the order process fails at a later stage (e.g. Payment failed).
   */
  restoreStock: async (items: CartItem[]): Promise<void> => {
      console.warn('📦 Catalog Microservice: Rolling back stock reservation...');
      const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      
      items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (!product || product.isGiftCard) return;

          if (item.selectedVariation) {
              const variant = product.variations?.find(v => v.id === item.selectedVariation?.id);
              if (variant) variant.stock += item.quantity;
          } else {
              product.stock += item.quantity;
          }
      });

      setLocalStorage(STORAGE_KEYS.PRODUCTS, products);
      console.log('📦 Catalog Microservice: Stock restored.');
  },

  // --- Admin Ops ---
  
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
