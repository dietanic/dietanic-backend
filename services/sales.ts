
import { Order } from '../types';
import { STORAGE_KEYS, DB, delay } from './storage';
import { CatalogService } from './catalog';
import { WalletService } from './wallet';
import { GlobalEventBus, EVENTS } from './eventBus';

// Microservice: Sales & Order Management
export const SalesService = {
  getOrders: () => DB.getAll<Order>(STORAGE_KEYS.ORDERS, []),
  getOrdersByUser: async (uid: string) => (await DB.getAll<Order>(STORAGE_KEYS.ORDERS)).filter(o => o.userId === uid).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()),
  updateOrder: async (o: Order) => { await DB.update(STORAGE_KEYS.ORDERS, o); GlobalEventBus.emit(EVENTS.ORDER_UPDATED, o); },

  // Saga: Distributed Transaction
  createOrder: async (order: Order) => {
    console.log(`🚀 Saga: Order ${order.id}`);
    try {
        await CatalogService.reserveStock(order.items);
        try {
            if (order.paidWithWallet) await WalletService.charge(order.userId, order.paidWithWallet, order.id);
        } catch (e) {
            await CatalogService.restoreStock(order.items);
            throw e;
        }
        await DB.add(STORAGE_KEYS.ORDERS, order);
        GlobalEventBus.emit(EVENTS.ORDER_CREATED, order);
    } catch (e: any) {
        console.error(`💥 Saga Failed: ${e.message}`);
        throw e;
    }
  }
};
