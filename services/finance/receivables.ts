
import { Quote, SalesOrder, Invoice, JournalLine, User } from '../../types';
import { STORAGE_KEYS, DB, delay, getLocalStorage } from '../storage';
import { checkLock } from './utils';
import { createJournalEntry } from './ledger'; // Import from local finance microservice
import { sendPaymentReminderEmail } from '../notifications';
import { IdentityService } from '../identity';
import { CustomerService } from '../customers';

// Microservice: Finance Receivables
// Handles Quotes, Sales Orders, and Customer Invoices

export const getQuotes = () => DB.getAll<Quote>('dietanic_quotes', []);
export const saveQuote = (q: Quote) => DB.upsert('dietanic_quotes', q, []);

export const convertQuoteToSO = async (id: string) => {
    const q = (await DB.getAll<Quote>('dietanic_quotes')).find(x => x.id === id);
    if(!q) return;
    q.status = 'accepted'; await DB.update('dietanic_quotes', q);
    await saveSalesOrder({ id: `so_${Date.now()}`, date: new Date().toISOString(), customerName: q.customerName, items: q.items, total: q.total, status: 'pending_approval', approvalLevel: 1 });
};

export const getSalesOrders = () => DB.getAll<SalesOrder>('dietanic_sales_orders', []);
export const saveSalesOrder = (so: SalesOrder) => DB.upsert('dietanic_sales_orders', so, []);
export const approveSalesOrder = async (id: string) => {
    const so = (await DB.getAll<SalesOrder>('dietanic_sales_orders')).find(x => x.id === id);
    if(so) { so.status = 'approved'; await DB.update('dietanic_sales_orders', so); }
};

export const getInvoices = () => DB.getAll<Invoice>('dietanic_invoices', []);
export const saveInvoice = async (inv: Invoice) => { await checkLock(inv.date); await DB.upsert('dietanic_invoices', inv, []); };

export const recordInvoicePayment = async (id: string, amount: number, method: string) => {
    await delay(200); const date = new Date().toISOString(); await checkLock(date);
    const invs = await DB.getAll<Invoice>('dietanic_invoices');
    const inv = invs.find(i => i.id === id);
    if(!inv) return;
    inv.payments.push({ id: `pay_${Date.now()}`, date, amount, method });
    inv.balanceDue = Math.max(0, inv.balanceDue - amount);
    inv.status = inv.balanceDue === 0 ? 'paid' : 'partial';
    await DB.update('dietanic_invoices', inv);
    
    const bankAccount = method === 'Cash' ? '1000' : '1010';
    await createJournalEntry({ // Use the local ledger service
        date,
        description: `Payment for Inv #${id}`,
        referenceId: id,
        referenceType: 'Payment',
        lines: [
            { accountId: bankAccount, debit: amount, credit: 0 },
            { accountId: '1200', debit: 0, credit: amount } 
        ],
        status: 'posted'
    });
};

export const sendBatchPaymentReminders = async (): Promise<number> => {
    const invoices = await DB.getAll<Invoice>('dietanic_invoices');
    const customers = await CustomerService.getCustomers();
    const users = await IdentityService.getUsers();
    
    let sentCount = 0;
    
    // Find unpaid invoices
    const unpaid = invoices.filter(inv => inv.balanceDue > 0 && inv.status !== 'paid');
    
    for (const inv of unpaid) {
        // Find associated user. Invoice doesn't inherently link to userID in this simplified model, 
        // so we have to do a fuzzy match on name or check Customer Profiles invoices.
        // Better: Customer Profile links invoices to user.
        
        let targetUser: User | undefined;
        
        // Strategy: Look through all customer profiles to find this invoice ID
        const profile = customers.find(c => c.billing.invoices.some(i => i.id === inv.id));
        if (profile) {
            targetUser = users.find(u => u.id === profile.userId);
        }

        if (targetUser) {
            await sendPaymentReminderEmail(inv, targetUser);
            // Update last reminder date
            inv.lastPaymentReminder = new Date().toISOString();
            sentCount++;
        }
    }
    
    // Save updated invoice states (lastPaymentReminder)
    if (sentCount > 0) {
        // In a real DB we'd update individually, here we overwrite the collection
        // Re-merging the updated 'unpaid' into full list
        const updatedInvoices = invoices.map(i => unpaid.find(u => u.id === i.id) || i);
        // We can't use DB.upsert for batch easily in this mock, so we iterate
        for (const upInv of unpaid) {
            await DB.update('dietanic_invoices', upInv);
        }
    }
    
    return sentCount;
};
