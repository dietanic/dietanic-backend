
import { Order } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { CatalogService } from './catalog';
import { WalletService } from './wallet';
import { GlobalEventBus, EVENTS } from './eventBus';

export const SalesService = {
  getOrders: async (): Promise<Order[]> => {
    await delay();
    return getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  getOrdersByUser: async (userId: string): Promise<Order[]> => {
    await delay();
    const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    return orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * SAGA ORCHESTRATOR for Order Creation.
   * Coordinates Inventory (Catalog) and Payment (Wallet) services.
   * Implements Rollback mechanism (Compensating Transactions) on failure.
   */
  createOrder: async (order: Order): Promise<void> => {
    console.group(`🚀 SAGA START: Order ${order.id}`);
    GlobalEventBus.emit(EVENTS.SAGA_STARTED, { orderId: order.id });

    try {
        // STEP 1: Reserve Stock (Catalog Service)
        // This is a "hard" reservation. If it passes, stock is deducted.
        console.log('Step 1: Reserving Stock...');
        await CatalogService.reserveStock(order.items);

        try {
            // STEP 2: Charge Payment (Wallet Service)
            // If wallet is used, we attempt to charge it.
            if (order.paidWithWallet && order.paidWithWallet > 0) {
                console.log('Step 2: Charging Wallet...');
                await WalletService.charge(order.userId, order.paidWithWallet, order.id);
            }
        } catch (paymentError: any) {
            console.error('❌ Payment Failed:', paymentError.message);
            // COMPENSATION: Restore Stock if payment fails
            console.log('↺ Compensating: Rolling back stock...');
            await CatalogService.restoreStock(order.items);
            throw paymentError; // Re-throw to UI
        }

        // STEP 3: Persist Order (Local Commit)
        // If we reached here, Stock is reserved and Payment is captured.
        console.log('Step 3: Persisting Order...');
        const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
        orders.push(order);
        setLocalStorage(STORAGE_KEYS.ORDERS, orders);

        // STEP 4: Publish Events (Side Effects)
        // Triggers Emails, Analytics, Finance Ledger
        console.log('✅ SAGA COMPLETE. Emitting Events.');
        await GlobalEventBus.emit(EVENTS.ORDER_CREATED, order);
        GlobalEventBus.emit(EVENTS.SAGA_COMPLETED, { orderId: order.id });

    } catch (error: any) {
        console.error(`💥 SAGA FAILED: ${error.message}`);
        GlobalEventBus.emit(EVENTS.SAGA_FAILED, { orderId: order.id, reason: error.message });
        throw error;
    } finally {
        console.groupEnd();
    }
  },

  updateOrder: async (updatedOrder: Order): Promise<void> => {
    await delay();
    const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      orders[index] = updatedOrder;
      setLocalStorage(STORAGE_KEYS.ORDERS, orders);
      GlobalEventBus.emit(EVENTS.ORDER_UPDATED, updatedOrder);
    }
  }
};
