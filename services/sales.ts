
import { Order } from '../types';
import { supabase } from './supabase';
import { CatalogService } from './catalog';
import { WalletService } from './wallet';
import { GlobalEventBus, EVENTS } from './eventBus';

// Helper to map DB row to Order Type
const mapDbOrder = (db: any): Order => ({
    id: db.id,
    userId: db.user_id,
    items: db.items || [],
    total: db.total,
    status: db.status,
    date: db.created_at,
    shippingAddress: db.shipping_address,
    // Defaulting non-persisted fields for MVP schema
    subtotal: db.total, 
    taxAmount: 0,
    paidWithWallet: 0,
    taxType: 'UR'
});

// Microservice: Sales & Order Management
export const SalesService = {
  getOrders: async (): Promise<Order[]> => {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) {
          console.error("Failed to fetch orders", error);
          return [];
      }
      return (data || []).map(mapDbOrder);
  },

  getOrdersByUser: async (uid: string): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return (data || []).map(mapDbOrder);
  },

  updateOrder: async (o: Order) => { 
      const { error } = await supabase.from('orders').update({
          status: o.status
      }).eq('id', o.id);
      
      if (!error) {
          GlobalEventBus.emit(EVENTS.ORDER_UPDATED, o);
      } else {
          console.error("Failed to update order", error);
      }
  },

  // Saga: Distributed Transaction
  createOrder: async (order: Order) => {
    console.log(`🚀 Saga: Order ${order.id}`);
    try {
        // 1. Reserve Stock (Supabase)
        await CatalogService.reserveStock(order.items);
        
        // 2. Charge Wallet (Local/Profile)
        try {
            if (order.paidWithWallet) await WalletService.charge(order.userId, order.paidWithWallet, order.id);
        } catch (e) {
            await CatalogService.restoreStock(order.items);
            throw e;
        }
        
        // 3. Persist Order (Supabase)
        const { error } = await supabase.from('orders').insert({
            id: order.id,
            user_id: order.userId,
            total: order.total,
            status: order.status,
            items: order.items,
            shipping_address: order.shippingAddress,
            created_at: order.date
        });

        if (error) {
            // Compensation: Refund wallet if DB insert fails
            if (order.paidWithWallet) await WalletService.refund(order.userId, order.paidWithWallet, order.id);
            await CatalogService.restoreStock(order.items);
            throw new Error(error.message);
        }
        
        GlobalEventBus.emit(EVENTS.ORDER_CREATED, order);
    } catch (e: any) {
        console.error(`💥 Saga Failed: ${e.message}`);
        // Ensure we throw a proper Error object so UI displays message, not [object Object]
        if (e instanceof Error) throw e;
        throw new Error(e.message || JSON.stringify(e));
    }
  }
};
