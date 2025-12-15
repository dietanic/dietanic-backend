
import { CustomerProfile, User } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { GlobalEventBus, EVENTS } from './eventBus';

// --- CRM Microservice Logic ---
GlobalEventBus.on(EVENTS.USER_REGISTERED, async (user: User) => {
    // Only create profiles for customers
    if (user.role === 'customer') {
        console.log(`👥 Customer Microservice: Provisioning profile for ${user.name}`);
        await CustomerService.ensureCustomerProfile(user);
    }
});

export const CustomerService = {
  getCustomers: async (): Promise<CustomerProfile[]> => {
    await delay();
    return getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
  },

  getCustomerByUserId: async (userId: string): Promise<CustomerProfile | null> => {
    await delay();
    const customers = getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
    return customers.find(c => c.userId === userId) || null;
  },

  // Helper to ensure a customer profile exists for a given user
  ensureCustomerProfile: async (user: User): Promise<CustomerProfile> => {
      const customers = getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
      let profile = customers.find(c => c.userId === user.id);
      
      if (!profile) {
          profile = {
              id: `cust_prof_${Date.now()}`,
              userId: user.id,
              phone: '',
              shippingAddress: user.addresses[0] || { street: '', city: '', state: '', zip: '' },
              billing: {
                  currentMonthAmount: 0,
                  invoices: []
              },
              walletBalance: 0,
              walletHistory: []
          };
          customers.push(profile);
          setLocalStorage(STORAGE_KEYS.CUSTOMERS, customers);
      }
      return profile;
  },

  updateCustomer: async (profile: CustomerProfile): Promise<void> => {
      await delay();
      const customers = getLocalStorage<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, []);
      const index = customers.findIndex(c => c.id === profile.id);
      if (index !== -1) {
          customers[index] = profile;
          setLocalStorage(STORAGE_KEYS.CUSTOMERS, customers);
      }
  }
};
