
import { Order, ProofOfDelivery } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { SalesService } from './sales';

export const DeliveryService = {
    // Get orders assigned to specific driver (or unassigned pool for demo)
    getAssignedOrders: async (driverId: string): Promise<Order[]> => {
        await delay(300);
        const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
        // For demo, we just return all 'processing' or 'out_for_delivery' orders
        // In a real app, verify order.assignedDriverId === driverId
        return orders.filter(o => 
            (o.status === 'processing' || o.status === 'out_for_delivery') && 
            o.shippingMethod !== 'scheduled' // Just a sample filter
        );
    },

    startDeliveryRoute: async (orderIds: string[]): Promise<void> => {
        await delay(200);
        const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
        let updated = false;
        
        orderIds.forEach(id => {
            const idx = orders.findIndex(o => o.id === id);
            if (idx !== -1 && orders[idx].status === 'processing') {
                orders[idx].status = 'out_for_delivery';
                updated = true;
            }
        });

        if (updated) setLocalStorage(STORAGE_KEYS.ORDERS, orders);
    },

    completeDelivery: async (orderId: string, proof: ProofOfDelivery): Promise<void> => {
        await delay(500);
        const orders = getLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
        const idx = orders.findIndex(o => o.id === orderId);
        
        if (idx !== -1) {
            orders[idx].status = 'delivered';
            orders[idx].proofOfDelivery = proof;
            setLocalStorage(STORAGE_KEYS.ORDERS, orders);
            
            // Trigger SalesService Update Logic (Event Bus etc) via updating storage directly here for simplicity
            // ideally we call SalesService.updateOrder but that might create circular deps if not careful
        }
    },

    // Van Sales: Create order on the fly
    createVanSale: async (order: Order): Promise<void> => {
        // Reuse Sales Service logic but tag it specifically if needed
        await SalesService.createOrder(order);
    }
};
