import { STORAGE_KEYS, delay, getLocalStorage, initStore } from './storage';

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
        initStore();
        await delay(1000);
    }
};
