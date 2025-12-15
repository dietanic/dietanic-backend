import { Discount } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

export const DiscountService = {
  getDiscounts: async (): Promise<Discount[]> => {
    await delay();
    return getLocalStorage<Discount[]>(STORAGE_KEYS.DISCOUNTS, []);
  },

  validateDiscount: async (code: string): Promise<Discount | null> => {
    await delay(300);
    const discounts = getLocalStorage<Discount[]>(STORAGE_KEYS.DISCOUNTS, []);
    return discounts.find(d => d.code === code && d.isActive) || null;
  },

  addDiscount: async (discount: Discount): Promise<void> => {
    await delay();
    const discounts = getLocalStorage<Discount[]>(STORAGE_KEYS.DISCOUNTS, []);
    discounts.push(discount);
    setLocalStorage(STORAGE_KEYS.DISCOUNTS, discounts);
  },

  deleteDiscount: async (id: string): Promise<void> => {
    await delay();
    let discounts = getLocalStorage<Discount[]>(STORAGE_KEYS.DISCOUNTS, []);
    discounts = discounts.filter(d => d.id !== id);
    setLocalStorage(STORAGE_KEYS.DISCOUNTS, discounts);
  }
};
