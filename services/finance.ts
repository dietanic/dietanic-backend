
import { Order, Expense, LedgerEntry, LedgerAccount, BankTransaction, Quote, SalesOrder, Invoice, Vendor, Bill, Project, VendorCredit } from '../types';
import { STORAGE_KEYS, DB, getLocalStorage, setLocalStorage, delay } from './storage';
import { SalesService } from './sales';
import { CatalogService } from './catalog';
import { GlobalEventBus, EVENTS } from './eventBus';
import { SettingsService } from './settings';

const ACCOUNTS: LedgerAccount[] = [
    { id: '1000', code: '1000', name: 'Cash', type: 'Asset', balance: 0 },
    { id: '1010', code: '1010', name: 'Bank', type: 'Asset', balance: 0 },
    { id: '1200', code: '1200', name: 'AR', type: 'Asset', balance: 0 },
    { id: '1500', code: '1500', name: 'Inventory', type: 'Asset', balance: 0 },
    { id: '2000', code: '2000', name: 'AP', type: 'Liability', balance: 0 },
    { id: '2500', code: '2500', name: 'Tax Payable', type: 'Liability', balance: 0 },
    { id: '3000', code: '3000', name: 'Equity', type: 'Equity', balance: 0 },
    { id: '4000', code: '4000', name: 'Revenue', type: 'Revenue', balance: 0 },
    { id: '5000', code: '5000', name: 'COGS', type: 'Expense', balance: 0 },
    { id: '6000', code: '6000', name: 'Expenses', type: 'Expense', balance: 0 },
];

const INITIAL_VENDORS: Vendor[] = [
    { id: 'v1', name: 'Fresh Farms', contactPerson: 'Mr. Green', email: 'orders@fresh.co', category: 'Ingred.', balanceDue: 4500 },
    { id: 'v2', name: 'EcoPack', contactPerson: 'Sarah', email: 'sales@eco.com', category: 'Pkg', balanceDue: 1200 },
];

const checkLock = async (date: string) => {
    const s = await SettingsService.getTaxSettings();
    if (s.lockDate && new Date(date) <= new Date(s.lockDate)) throw new Error(`Period Locked: ${s.lockDate}`);
};

// Event: Order to Ledger
GlobalEventBus.on(EVENTS.ORDER_CREATED, async (o: Order) => {
    await FinanceService.recordJournalEntry({ date: o.date, description: `Rev Order ${o.id}`, referenceId: o.id, debitAccountId: '1200', creditAccountId: '4000', amount: o.subtotal });
    if (o.taxAmount) await FinanceService.recordJournalEntry({ date: o.date, description: `Tax Order ${o.id}`, referenceId: o.id, debitAccountId: '1200', creditAccountId: '2500', amount: o.taxAmount });
    await FinanceService.recordJournalEntry({ date: o.date, description: `COGS Order ${o.id}`, referenceId: o.id, debitAccountId: '5000', creditAccountId: '1500', amount: o.subtotal * 0.4 });
});

// Microservice: Finance ERP
export const FinanceService = {
    // Core Ledger
    getLedgerEntries: () => DB.getAll<LedgerEntry>('dietanic_ledger', []),
    getChartOfAccounts: async () => {
        const accs = [...ACCOUNTS];
        (await FinanceService.getLedgerEntries()).forEach(e => {
            const dr = accs.find(a => a.id === e.debitAccountId);
            const cr = accs.find(a => a.id === e.creditAccountId);
            if(dr) ['Asset','Expense'].includes(dr.type) ? dr.balance+=e.amount : dr.balance-=e.amount;
            if(cr) ['Liability','Equity','Revenue'].includes(cr.type) ? cr.balance+=e.amount : cr.balance-=e.amount;
        });
        return accs;
    },
    recordJournalEntry: async (e: Omit<LedgerEntry, 'id'|'status'>) => {
        await checkLock(e.date);
        await DB.add('dietanic_ledger', { ...e, id: `je_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, status: 'posted' });
    },

    // Receivables
    getQuotes: () => DB.getAll<Quote>('dietanic_quotes', []),
    saveQuote: (q: Quote) => DB.upsert('dietanic_quotes', q, []),
    convertQuoteToSO: async (id: string) => {
        const q = (await DB.getAll<Quote>('dietanic_quotes')).find(x => x.id === id);
        if(!q) return;
        q.status = 'accepted'; await DB.update('dietanic_quotes', q);
        await FinanceService.saveSalesOrder({ id: `so_${Date.now()}`, date: new Date().toISOString(), customerName: q.customerName, items: q.items, total: q.total, status: 'pending_approval', approvalLevel: 1 });
    },
    getSalesOrders: () => DB.getAll<SalesOrder>('dietanic_sales_orders', []),
    saveSalesOrder: (so: SalesOrder) => DB.upsert('dietanic_sales_orders', so, []),
    approveSalesOrder: async (id: string) => {
        const so = (await DB.getAll<SalesOrder>('dietanic_sales_orders')).find(x => x.id === id);
        if(so) { so.status = 'approved'; await DB.update('dietanic_sales_orders', so); }
    },
    getInvoices: () => DB.getAll<Invoice>('dietanic_invoices', []),
    saveInvoice: async (inv: Invoice) => { await checkLock(inv.date); await DB.upsert('dietanic_invoices', inv, []); },
    
    recordInvoicePayment: async (id: string, amount: number, method: string) => {
        await delay(200); const date = new Date().toISOString(); await checkLock(date);
        const invs = await DB.getAll<Invoice>('dietanic_invoices');
        const inv = invs.find(i => i.id === id);
        if(!inv) return;
        inv.payments.push({ id: `pay_${Date.now()}`, date, amount, method });
        inv.balanceDue = Math.max(0, inv.balanceDue - amount);
        inv.status = inv.balanceDue === 0 ? 'paid' : 'partial';
        await DB.update('dietanic_invoices', inv);
        await FinanceService.recordJournalEntry({ date, description: `Pay Inv ${id}`, referenceId: id, debitAccountId: method==='Cash'?'1000':'1010', creditAccountId: '1200', amount });
    },

    // Payables
    getVendors: () => DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS),
    getBills: () => DB.getAll<Bill>('dietanic_bills', []),
    createBill: async (bill: Bill) => {
        await checkLock(bill.date);
        if (bill.amount < 1000) { bill.approvalStatus = 'approved'; bill.status = 'open'; } 
        else { bill.approvalStatus = 'pending'; bill.status = 'pending_approval'; }
        await DB.add('dietanic_bills', bill);
        if (bill.approvalStatus === 'approved') await FinanceService.approveBill(bill.id);
    },
    approveBill: async (id: string) => {
        const bills = await DB.getAll<Bill>('dietanic_bills');
        const b = bills.find(x => x.id === id);
        if (!b) return;
        b.approvalStatus = 'approved'; b.status = 'open';
        await DB.update('dietanic_bills', b);
        
        const vends = await DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS);
        const v = vends.find(x => x.id === b.vendorId);
        if(v) { v.balanceDue += b.amount; await DB.update('dietanic_vendors', v); }
        await FinanceService.recordJournalEntry({ date: b.date, description: `Bill ${b.vendorName}`, referenceId: b.id, debitAccountId: '6000', creditAccountId: '2000', amount: b.amount });
    },
    payBill: async (id: string, amount: number) => {
        const date = new Date().toISOString(); await checkLock(date);
        const bills = await DB.getAll<Bill>('dietanic_bills');
        const b = bills.find(x => x.id === id);
        if(!b) return;
        const paid = Math.min(amount, b.balanceDue);
        b.balanceDue -= paid; b.payments.push({ id: `pay_${Date.now()}`, date, amount: paid, method: 'Bank' });
        b.status = b.balanceDue <= 0 ? 'paid' : 'partial';
        await DB.update('dietanic_bills', b);

        const vends = await DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS);
        const v = vends.find(x => x.id === b.vendorId);
        if(v) { v.balanceDue -= paid; await DB.update('dietanic_vendors', v); }
        await FinanceService.recordJournalEntry({ date, description: `Pay Bill ${b.id}`, referenceId: b.id, debitAccountId: '2000', creditAccountId: '1010', amount: paid });
    },

    // Misc
    getVendorCredits: () => DB.getAll<VendorCredit>('dietanic_vendor_credits', []),
    createVendorCredit: async (vc: VendorCredit) => {
        await checkLock(vc.date); await DB.add('dietanic_vendor_credits', vc);
        const vends = await DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS);
        const v = vends.find(x => x.id === vc.vendorId);
        if(v) { v.balanceDue -= vc.amount; await DB.update('dietanic_vendors', v); }
        await FinanceService.recordJournalEntry({ date: vc.date, description: `Credit ${vc.vendorName}`, referenceId: vc.id, debitAccountId: '2000', creditAccountId: '6000', amount: vc.amount });
    },
    getProjects: () => DB.getAll<Project>('dietanic_projects', []),
    saveProject: (p: Project) => DB.upsert('dietanic_projects', p, []),
    getExpenses: () => DB.getAll<Expense>('dietanic_expenses', []),
    addExpense: async (e: Expense) => {
        await checkLock(e.date); await DB.add('dietanic_expenses', e);
        await FinanceService.recordJournalEntry({ date: e.date, description: e.description, referenceId: e.id, debitAccountId: '6000', creditAccountId: '1010', amount: e.amount });
    },
    deleteExpense: (id: string) => DB.delete('dietanic_expenses', id),

    // Reports
    getForecast: async () => {
        await delay();
        const base = 45000;
        return Array.from({length: 6}, (_, i) => ({
            month: new Date(new Date().setMonth(new Date().getMonth()+i)).toLocaleString('default', {month:'short'}),
            projectedRevenue: Math.round(base * (1 + i*0.05)),
            projectedExpenses: Math.round(base * 0.7),
            cashPosition: 120000 + (i * 5000)
        }));
    },
    getBankFeed: async () => DB.getAll<BankTransaction>('dietanic_bank', [
        { id: 'bk1', date: new Date().toISOString(), description: 'STRIPE', amount: 4500, status: 'unreconciled' },
        { id: 'bk2', date: new Date().toISOString(), description: 'AWS', amount: -200, status: 'unreconciled' }
    ]),
    autoReconcile: async () => { await delay(500); return 2; },
    
    generateStatement: async (start?: string, end?: string) => {
        await delay();
        const [orders, products, expenses] = await Promise.all([SalesService.getOrders(), CatalogService.getProducts(), FinanceService.getExpenses()]);
        // Filter Logic ...
        const rev = orders.reduce((sum, o) => sum + o.subtotal, 0);
        const exp = expenses.reduce((sum, e) => sum + e.amount, 0);
        const tax = orders.reduce((sum, o) => sum + (o.taxAmount||0), 0);
        return { revenue: rev, cogs: rev*0.4, grossProfit: rev*0.6, expenses: exp, netProfit: (rev*0.6)-exp, taxLiability: tax };
    },
    getTaxReport: async () => {
        const orders = await SalesService.getOrders();
        return { totalTax: orders.reduce((s,o)=>s+(o.taxAmount||0),0), igst: 0, cgst: 0, sgst: 0, urSales: 0 };
    }
};
