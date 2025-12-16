
import { Product, Category, CartItem, PurchaseOrder } from '../types';
import { STORAGE_KEYS, DB, getLocalStorage, setLocalStorage, delay } from './storage';
import { FinanceService } from './finance';

// Helper exports for synchronous access (used by SEO/Audit tools)
export const getProducts = () => getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
export const getCategories = () => getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);

// Microservice: Product Catalog & Inventory
export const CatalogService = {
  getProducts: () => DB.getAll<Product>(STORAGE_KEYS.PRODUCTS, []),
  getProductById: (id: string) => DB.getById<Product>(STORAGE_KEYS.PRODUCTS, id, []),
  getCategories: () => DB.getAll<Category>(STORAGE_KEYS.CATEGORIES, []),
  addProduct: (p: Product) => DB.add(STORAGE_KEYS.PRODUCTS, p, []),
  updateProduct: (p: Product) => DB.update(STORAGE_KEYS.PRODUCTS, p, []),
  deleteProduct: (id: string) => DB.delete(STORAGE_KEYS.PRODUCTS, id, []),

  // Procurement
  getPurchaseOrders: () => DB.getAll<PurchaseOrder>('dietanic_pos', []),
  createPurchaseOrder: (po: PurchaseOrder) => DB.add('dietanic_pos', po, []),
  
  receivePurchaseOrder: async (poId: string): Promise<void> => {
      const pos = getLocalStorage<PurchaseOrder[]>('dietanic_pos', []);
      const po = pos.find(p => p.id === poId);
      if (!po || po.status === 'received') return;

      po.status = 'received';
      setLocalStorage('dietanic_pos', pos);

      // Update Inventory
      const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      po.items.forEach(i => {
          const p = products.find(prod => prod.id === i.productId);
          if (p) p.stock += i.quantity;
      });
      setLocalStorage(STORAGE_KEYS.PRODUCTS, products);

      // Trigger Finance (Payables)
      await FinanceService.createBill({
          id: `bill_po_${po.id.slice(-6)}`, vendorId: po.vendorId, vendorName: po.vendorName,
          date: new Date().toISOString(), dueDate: new Date(Date.now() + 2592000000).toISOString(),
          amount: po.total, status: 'open', balanceDue: po.total, isRecurring: false, payments: [],
          items: po.items.map(i => ({ description: `${i.productName} x${i.quantity}`, amount: i.cost * i.quantity }))
      });
  },

  // Saga: Inventory Reservation
  reserveStock: async (items: CartItem[]): Promise<void> => {
      await delay(300);
      const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const updates = [...products];

      for (const item of items) {
          const pIdx = updates.findIndex(p => p.id === item.id);
          if (pIdx === -1) throw new Error(`Product ${item.name} not found.`);
          
          const p = { ...updates[pIdx] };
          if (p.isGiftCard) continue;

          if (item.selectedVariation) {
              const v = p.variations?.find(v => v.id === item.selectedVariation?.id);
              if (!v || v.stock < item.quantity) throw new Error(`Insufficient stock: ${p.name} (${item.selectedVariation!.name})`);
              v.stock -= item.quantity;
          } else {
              if (p.stock < item.quantity) throw new Error(`Insufficient stock: ${p.name}`);
              p.stock -= item.quantity;
          }
          updates[pIdx] = p;
      }
      setLocalStorage(STORAGE_KEYS.PRODUCTS, updates);
      console.log('📦 Catalog: Stock reserved');
  },

  restoreStock: async (items: CartItem[]): Promise<void> => {
      const products = getLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      items.forEach(item => {
          const p = products.find(p => p.id === item.id);
          if (!p || p.isGiftCard) return;
          if (item.selectedVariation) {
              const v = p.variations?.find(v => v.id === item.selectedVariation?.id);
              if (v) v.stock += item.quantity;
          } else p.stock += item.quantity;
      });
      setLocalStorage(STORAGE_KEYS.PRODUCTS, products);
      console.log('📦 Catalog: Stock restored');
  }
};
