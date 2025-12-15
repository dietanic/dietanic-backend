
import { Discount } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

export const DiscountService = {
  getDiscounts: async (): Promise<Discount[]> => {
    await delay();
    return getLocalStorage<Discount[]>(STORAGE_KEYS.DISCOUNTS, []);
  },

  validateDiscount: async (code: string, cartTotal: number, cartCategories: string[]): Promise<Discount | null> => {
    await delay(300);
    const discounts = getLocalStorage<Discount[]>(STORAGE_KEYS.DISCOUNTS, []);
    const discount = discounts.find(d => d.code === code && d.isActive);

    if (!discount) return null;

    // Check Minimum Purchase
    if (discount.minPurchaseAmount && cartTotal < discount.minPurchaseAmount) {
        throw new Error(`Minimum purchase of ₹${discount.minPurchaseAmount} required.`);
    }

    // Check Category Restriction
    if (discount.applicableCategory && discount.applicableCategory !== 'All') {
        const hasCategory = cartCategories.includes(discount.applicableCategory);
        if (!hasCategory) {
            throw new Error(`Discount valid only for ${discount.applicableCategory} items.`);
        }
    }

    return discount;
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
