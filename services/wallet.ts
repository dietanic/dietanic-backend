
import { GiftCard, CustomerProfile, WalletTransaction, Order } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { GlobalEventBus, EVENTS } from './eventBus';

// Listener purely for side-effects (Gift Card Generation), NOT for payments anymore.
// Payments are handled by the Saga Orchestrator.
GlobalEventBus.on(EVENTS.ORDER_CREATED, async (order: Order) => {
    // Generate Gift Cards if bought
    const giftCardItems = order.items.filter(i => i.isGiftCard);
    if (giftCardItems.length > 0) {
        for (const item of giftCardItems) {
            for (let i = 0; i < item.quantity; i++) {
                const card = await WalletService.createGiftCard(item.price, order.userId);
                console.log(`💳 Wallet Microservice: Generated GC ${card.code}`);
            }
        }
    }
});

export const WalletService = {
    getGiftCards: async (): Promise<GiftCard[]> => {
        await delay();
        return getLocalStorage<GiftCard[]>('dietanic_gift_cards', []);
    },

    // --- Transactional Methods for Saga Pattern ---

    /**
     * Charges the wallet. Throws error if insufficient funds.
     */
    charge: async (userId: string, amount: number, orderId: string): Promise<void> => {
        await delay(300); // Simulate network
        const customers = getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
        const profileIdx = customers.findIndex(c => c.userId === userId);

        if (profileIdx === -1) throw new Error("Wallet not found.");
        
        const profile = customers[profileIdx];
        if ((profile.walletBalance || 0) < amount) {
            throw new Error(`Insufficient wallet balance. Available: ₹${profile.walletBalance}, Required: ₹${amount}`);
        }

        // Deduct
        profile.walletBalance -= amount;
        profile.walletHistory = [...(profile.walletHistory || []), {
            id: `txn_${Date.now()}`,
            date: new Date().toISOString(),
            amount: -amount,
            type: 'payment',
            description: `Payment for Order #${orderId.slice(-6)}`
        }];

        customers[profileIdx] = profile;
        setLocalStorage(STORAGE_KEYS.CUSTOMERS, customers);
        console.log(`💳 Wallet Microservice: Charged ₹${amount}`);
    },

    /**
     * Refunds the wallet (Compensation).
     */
    refund: async (userId: string, amount: number, orderId: string): Promise<void> => {
        const customers = getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
        const profileIdx = customers.findIndex(c => c.userId === userId);
        if (profileIdx === -1) return;

        const profile = customers[profileIdx];
        profile.walletBalance += amount;
        profile.walletHistory = [...(profile.walletHistory || []), {
            id: `txn_${Date.now()}_ref`,
            date: new Date().toISOString(),
            amount: amount,
            type: 'refund',
            description: `Refund for failed Order #${orderId.slice(-6)}`
        }];

        customers[profileIdx] = profile;
        setLocalStorage(STORAGE_KEYS.CUSTOMERS, customers);
        console.log(`💳 Wallet Microservice: Refunded ₹${amount}`);
    },

    // --- Standard Methods ---

    createGiftCard: async (amount: number, purchaserId: string): Promise<GiftCard> => {
        const cards = getLocalStorage<GiftCard[]>('dietanic_gift_cards', []);
        
        const code = `GC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const newCard: GiftCard = {
            id: `gc_${Date.now()}_${Math.random()}`,
            code,
            initialValue: amount,
            currentValue: amount,
            status: 'active',
            purchasedByUserId: purchaserId,
            createdAt: new Date().toISOString()
        };

        cards.push(newCard);
        setLocalStorage('dietanic_gift_cards', cards);
        return newCard;
    },

    redeemGiftCard: async (code: string, userId: string): Promise<number> => {
        await delay(500);
        const cards = getLocalStorage<GiftCard[]>('dietanic_gift_cards', []);
        const cardIndex = cards.findIndex(c => c.code === code && c.status === 'active');

        if (cardIndex === -1) {
            throw new Error('Invalid or inactive gift card code.');
        }

        const card = cards[cardIndex];
        const amount = card.currentValue;

        cards[cardIndex].status = 'redeemed';
        cards[cardIndex].currentValue = 0;
        setLocalStorage('dietanic_gift_cards', cards);

        await WalletService.addWalletFunds(userId, amount, `Redeemed Gift Card: ${code}`);

        return amount;
    },

    addWalletFunds: async (userId: string, amount: number, description: string): Promise<void> => {
        const customers = getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
        let profileIdx = customers.findIndex(c => c.userId === userId);

        if (profileIdx === -1) {
             throw new Error("Customer profile not found for wallet deposit.");
        }

        const transaction: WalletTransaction = {
            id: `txn_${Date.now()}`,
            date: new Date().toISOString(),
            amount: amount,
            type: 'deposit',
            description
        };

        const profile = customers[profileIdx];
        profile.walletBalance = (profile.walletBalance || 0) + amount;
        profile.walletHistory = [...(profile.walletHistory || []), transaction];

        customers[profileIdx] = profile;
        setLocalStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }
};
