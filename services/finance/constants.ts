import { LedgerAccount, Vendor } from '../../types';

// AKAUNTING INSPIRED CHART OF ACCOUNTS
export const INITIAL_ACCOUNTS: LedgerAccount[] = [
    // Assets (1xxx)
    { id: '1000', code: 1000, name: 'Cash on Hand', type: 'Asset', subtype: 'Cash', balance: 0, isSystem: true },
    { id: '1010', code: 1010, name: 'Bank Account (HDFC)', type: 'Asset', subtype: 'Bank', balance: 0, isSystem: true },
    { id: '1200', code: 1200, name: 'Accounts Receivable', type: 'Asset', subtype: 'Current', balance: 0, isSystem: true },
    { id: '1500', code: 1500, name: 'Inventory Asset', type: 'Asset', subtype: 'Current', balance: 0, isSystem: true },
    { id: '1600', code: 1600, name: 'Kitchen Equipment', type: 'Asset', subtype: 'Fixed', balance: 0 },
    
    // Liabilities (2xxx)
    { id: '2000', code: 2000, name: 'Accounts Payable', type: 'Liability', subtype: 'Current', balance: 0, isSystem: true },
    { id: '2500', code: 2500, name: 'GST Payable', type: 'Liability', subtype: 'Current', balance: 0, isSystem: true },
    { id: '2600', code: 2600, name: 'Customer Wallet Credits', type: 'Liability', subtype: 'Current', balance: 0, isSystem: true },

    // Equity (3xxx)
    { id: '3000', code: 3000, name: "Owner's Equity", type: 'Equity', subtype: 'Equity', balance: 0, isSystem: true },
    
    // Income (4xxx)
    { id: '4000', code: 4000, name: 'Sales Revenue', type: 'Income', subtype: 'Operating', balance: 0, isSystem: true },
    { id: '4100', code: 4100, name: 'Delivery Fee Income', type: 'Income', subtype: 'Operating', balance: 0 },
    { id: '4200', code: 4200, name: 'Other Income', type: 'Income', subtype: 'Non-Operating', balance: 0 },

    // Expenses (5xxx - 6xxx)
    { id: '5000', code: 5000, name: 'Cost of Goods Sold (COGS)', type: 'Expense', subtype: 'COS', balance: 0, isSystem: true },
    { id: '6000', code: 6000, name: 'Payroll Expense', type: 'Expense', subtype: 'Operating', balance: 0 },
    { id: '6100', code: 6100, name: 'Rent Expense', type: 'Expense', subtype: 'Operating', balance: 0 },
    { id: '6200', code: 6200, name: 'Advertising & Marketing', type: 'Expense', subtype: 'Operating', balance: 0 },
    { id: '6300', code: 6300, name: 'Software & IT', type: 'Expense', subtype: 'Operating', balance: 0 }
];

export const INITIAL_VENDORS: Vendor[] = [
    { id: 'v1', name: 'Fresh Farms', contactPerson: 'Mr. Green', email: 'orders@fresh.co', category: 'Ingred.', balanceDue: 4500 },
    { id: 'v2', name: 'EcoPack', contactPerson: 'Sarah', email: 'sales@eco.com', category: 'Pkg', balanceDue: 1200 }
];