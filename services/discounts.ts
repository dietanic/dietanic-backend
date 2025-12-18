
import { Discount } from '../types';
import { STORAGE_KEYS, DB, delay } from './storage';

export const DiscountService = {
  getDiscounts: () => DB.getAll<Discount>(STORAGE_KEYS.DISCOUNTS, []),
  addDiscount: (d: Discount) => DB.add(STORAGE_KEYS.DISCOUNTS, d, []),
  updateDiscount: (d: Discount) => DB.update(STORAGE_KEYS.DISCOUNTS, d, []),
  deleteDiscount: (id: string) => DB.delete(STORAGE_KEYS.DISCOUNTS, id, []),
  validateDiscount: async (code: string, total: number, cats: string[]) => {
    await delay();
    const d = (await DB.getAll<Discount>(STORAGE_KEYS.DISCOUNTS)).find(x => x.code === code && x.isActive);
    if (!d) return null;
    if (d.minPurchaseAmount && total < d.minPurchaseAmount) throw new Error(`Min purchase ₹${d.minPurchaseAmount}`);
    if (d.applicableCategory && d.applicableCategory !== 'All' && !cats.includes(d.applicableCategory)) throw new Error(`Only for ${d.applicableCategory}`);
    return d;
  }
};
