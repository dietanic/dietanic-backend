import { Order } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

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

  createOrder: async (order: Order): Promise<void> => {
    await delay(800); // Transaction time
    const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    orders.push(order);
    setLocalStorage(STORAGE_KEYS.ORDERS, orders);
  },

  updateOrder: async (updatedOrder: Order): Promise<void> => {
    await delay();
    const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
      orders[index] = updatedOrder;
      setLocalStorage(STORAGE_KEYS.ORDERS, orders);
    }
  }
};
