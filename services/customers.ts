
import { CustomerProfile, User } from '../types';
import { STORAGE_KEYS, DB, delay } from './storage';
import { GlobalEventBus, EVENTS } from './eventBus';

GlobalEventBus.on(EVENTS.USER_REGISTERED, async (u: User) => {
    if (u.role === 'customer') await CustomerService.ensureCustomerProfile(u);
});

// Microservice: CRM
export const CustomerService = {
  getCustomers: () => DB.getAll<CustomerProfile>(STORAGE_KEYS.CUSTOMERS, []),
  getCustomerByUserId: async (uid: string) => (await DB.getAll<CustomerProfile>(STORAGE_KEYS.CUSTOMERS)).find(c => c.userId === uid) || null,
  updateCustomer: (p: CustomerProfile) => DB.update(STORAGE_KEYS.CUSTOMERS, p, []),
  ensureCustomerProfile: async (u: User) => {
      let p = await CustomerService.getCustomerByUserId(u.id);
      if (!p) {
          p = { id: `cp_${Date.now()}`, userId: u.id, phone: '', shippingAddress: u.addresses[0]||{street:'',city:'',state:'',zip:''}, billing:{currentMonthAmount:0, invoices:[]}, walletBalance:0, walletHistory:[], consentToProcessPHI:false };
          await DB.add(STORAGE_KEYS.CUSTOMERS, p);
      }
      return p;
  }
};
