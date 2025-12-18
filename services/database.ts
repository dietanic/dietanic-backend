
import { STORAGE_KEYS, delay, getLocalStorage, initStore, DB } from './storage';

export const DatabaseService = {
    getFullSnapshot: async () => {
        await delay(1000); // Heavy op
        return {
            products: getLocalStorage(STORAGE_KEYS.PRODUCTS, []),
            orders: getLocalStorage(STORAGE_KEYS.ORDERS, []),
            users: getLocalStorage(STORAGE_KEYS.USERS, []),
            reviews: getLocalStorage(STORAGE_KEYS.REVIEWS, []),
            categories: getLocalStorage(STORAGE_KEYS.CATEGORIES, []),
            discounts: getLocalStorage(STORAGE_KEYS.DISCOUNTS, []),
            timestamp: new Date().toISOString()
        };
    },

    resetDatabase: async () => {
        localStorage.clear();
        // The clear cache logic is handled automatically if we restart or reload,
        // but for a runtime reset we should ensure it's wiped.
        // We'll just rely on the page reload or clear logic if exposed,
        // but here we just re-init seeds.
        initStore();
        await delay(1000);
        window.location.reload(); // Hard reload is safest for full cache wipe
    }
};
