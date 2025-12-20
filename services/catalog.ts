
import { Product, Category, CartItem, PurchaseOrder } from '../types';
import { supabase } from './supabase';
import { STORAGE_KEYS, DB, getLocalStorage, setLocalStorage, delay } from './storage';
import { createBill } from './finance/payables';

// Microservice: Product Catalog & Inventory (Supabase Implementation)
export const CatalogService = {
  
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*');
    
    if (error) {
        console.error("Error fetching products:", error);
        return []; 
    }

    // Map DB columns to Frontend Types if casing differs (snake_case to camelCase)
    return data.map((p: any) => ({
        ...p,
        wholesalePrice: p.wholesale_price,
        isSubscription: p.is_subscription,
        lowStockThreshold: p.low_stock_threshold || 5,
        nutritionalInfo: p.nutritional_info,
        itemType: p.item_type,
        hsnSacCode: p.hsn_sac_code,
        // Ensure arrays are initialized
        ingredients: p.ingredients || [],
        variations: p.variations || [],
        subscriptionPlans: p.subscription_plans || []
    }));
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    
    return {
        ...data,
        wholesalePrice: data.wholesale_price,
        isSubscription: data.is_subscription,
        lowStockThreshold: data.low_stock_threshold,
        nutritionalInfo: data.nutritional_info,
        itemType: data.item_type,
        hsnSacCode: data.hsn_sac_code
    };
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await supabase.from('products').select('category');
    if (!data) return [];
    
    const unique = Array.from(new Set(data.map(i => i.category)));
    return unique.map((c, idx) => ({ id: idx.toString(), name: c as string }));
  },

  addProduct: async (p: Product) => {
      const dbPayload = {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image: p.image,
          stock: p.stock,
          is_subscription: p.isSubscription,
          ingredients: p.ingredients,
          nutritional_info: p.nutritionalInfo,
          variations: p.variations,
          item_type: p.itemType,
          hsn_sac_code: p.hsnSacCode
      };
      
      const { error } = await supabase.from('products').insert(dbPayload);
      if (error) throw new Error(error.message);
  },

  updateProduct: async (p: Product) => {
      const { error } = await supabase.from('products').update({
          name: p.name,
          price: p.price,
          stock: p.stock,
          description: p.description,
          category: p.category,
          image: p.image,
          ingredients: p.ingredients,
          item_type: p.itemType,
          hsn_sac_code: p.hsnSacCode,
          is_subscription: p.isSubscription,
          nutritional_info: p.nutritionalInfo
      }).eq('id', p.id);
      if (error) throw new Error(error.message);
  },

  deleteProduct: async (id: string) => {
      await supabase.from('products').delete().eq('id', id);
  },

  // Procurement (Hybrid: Kept local for now, move to 'purchase_orders' table later)
  getPurchaseOrders: () => DB.getAll<PurchaseOrder>('dietanic_pos', []),
  createPurchaseOrder: (po: PurchaseOrder) => DB.add('dietanic_pos', po, []),
  
  receivePurchaseOrder: async (poId: string): Promise<void> => {
      const pos = getLocalStorage<PurchaseOrder[]>('dietanic_pos', []);
      const po = pos.find(p => p.id === poId);
      if (!po || po.status === 'received') return;

      po.status = 'received';
      setLocalStorage('dietanic_pos', pos);

      // Update Inventory in Supabase
      // Note: This is an inefficient loop, a stored procedure (RPC) is better for batch updates
      for (const item of po.items) {
          const { data: current } = await supabase.from('products').select('stock').eq('id', item.productId).single();
          if (current) {
              await supabase.from('products').update({ stock: current.stock + item.quantity }).eq('id', item.productId);
          }
      }

      await createBill({
          id: `bill_po_${po.id.slice(-6)}`, vendorId: po.vendorId, vendorName: po.vendorName,
          date: new Date().toISOString(), dueDate: new Date(Date.now() + 2592000000).toISOString(),
          amount: po.total, status: 'open', balanceDue: po.total, isRecurring: false, payments: [],
          items: po.items.map(i => ({ description: `${i.productName} x${i.quantity}`, amount: i.cost * i.quantity }))
      });
  },

  reserveStock: async (items: CartItem[]): Promise<void> => {
      // Optimistic reservation. Real implementation should use database transactions/functions.
      for (const item of items) {
          if(item.isGiftCard) continue;
          
          // RPC call would be safer here to prevent race conditions
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id).single();
          if (prod && prod.stock >= item.quantity) {
              await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.id);
          } else {
              throw new Error(`Insufficient stock for ${item.name}`);
          }
      }
  },

  restoreStock: async (items: CartItem[]): Promise<void> => {
      for (const item of items) {
          if(item.isGiftCard) continue;
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id).single();
          if (prod) {
              await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.id);
          }
      }
  }
};
