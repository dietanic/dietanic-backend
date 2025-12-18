import { LedgerAccount, LedgerEntry, JournalLine, Order } from '../../types';
import { STORAGE_KEYS, DB, getLocalStorage, delay } from '../storage';
import { INITIAL_ACCOUNTS } from './constants';
import { checkLock } from './utils';
import { GlobalEventBus, EVENTS } from '../eventBus';

// Microservice: Finance Ledger
// Encapsulates Chart of Accounts, Journal Entries, and automated accounting listeners

GlobalEventBus.on(EVENTS.ORDER_CREATED, async (o: Order) => {
    const lines: JournalLine[] = [];
    
    // 1. Revenue Recognition
    lines.push({ accountId: '1200', debit: o.total, credit: 0 }); // AR
    lines.push({ accountId: '4000', debit: 0, credit: o.subtotal }); // Sales
    
    if (o.taxAmount && o.taxAmount > 0) {
        lines.push({ accountId: '2500', debit: 0, credit: o.taxAmount }); // Tax
    }
    
    if (o.shippingCost && o.shippingCost > 0) {
        lines.push({ accountId: '4100', debit: 0, credit: o.shippingCost }); // Shipping
    }

    const totalDr = lines.reduce((s, l) => s + l.debit, 0);
    const totalCr = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDr - totalCr) > 0.01) {
        lines.push({ accountId: '4200', debit: 0, credit: totalDr - totalCr });
    }

    await createJournalEntry({
        date: o.date,
        description: `Invoice for Order #${o.id.slice(-6)}`,
        referenceId: o.id,
        referenceType: 'Order',
        lines: lines,
        status: 'posted'
    });

    const cogsAmount = o.subtotal * 0.4; // Simplified COGS calculation
    await createJournalEntry({
        date: o.date,
        description: `COGS for Order #${o.id.slice(-6)}`,
        referenceId: o.id,
        referenceType: 'Order',
        lines: [
            { accountId: '5000', debit: cogsAmount, credit: 0 }, // Dr COGS
            { accountId: '1500', debit: 0, credit: cogsAmount }  // Cr Inventory
        ],
        status: 'posted'
    });

    if (o.paidWithWallet && o.paidWithWallet > 0) {
        await createJournalEntry({
            date: o.date,
            description: `Wallet Payment for #${o.id.slice(-6)}`,
            referenceId: o.id,
            referenceType: 'Payment',
            lines: [
                { accountId: '2600', debit: o.paidWithWallet, credit: 0 },
                { accountId: '1200', debit: 0, credit: o.paidWithWallet }
            ],
            status: 'posted'
        });
    }
});


export const getChartOfAccounts = async (): Promise<LedgerAccount[]> => {
    await delay(100);
    let accounts = getLocalStorage<LedgerAccount[]>(STORAGE_KEYS.PRODUCTS.replace('products', 'coa'), INITIAL_ACCOUNTS); // Using a unique key for COA
    const journals = getLocalStorage<LedgerEntry[]>(STORAGE_KEYS.PRODUCTS.replace('products', 'ledger'), []);

    accounts = accounts.map(acc => {
        let balance = 0;
        journals.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === acc.id) {
                    if (['Asset', 'Expense'].includes(acc.type)) {
                        balance += (line.debit - line.credit);
                    } else {
                        balance += (line.credit - line.debit);
                    }
                }
            });
        });
        return { ...acc, balance };
    });
    
    return accounts.sort((a,b) => a.code - b.code);
};

export const getLedgerEntries = async (): Promise<LedgerEntry[]> => {
    await delay(100);
    return getLocalStorage<LedgerEntry[]>(STORAGE_KEYS.PRODUCTS.replace('products', 'ledger'), []);
};

export const createJournalEntry = async (entry: Omit<LedgerEntry, 'id'|'createdAt'|'totalAmount'>) => {
    await checkLock(entry.date);
    
    const totalDr = entry.lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCr = entry.lines.reduce((acc, l) => acc + l.credit, 0);

    if (Math.abs(totalDr - totalCr) > 0.05) {
        throw new Error(`Journal Entry Unbalanced: Dr ${totalDr} != Cr ${totalCr}`);
    }

    const newEntry: LedgerEntry = {
        ...entry,
        id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        totalAmount: totalDr
    };

    await DB.add(STORAGE_KEYS.PRODUCTS.replace('products', 'ledger'), newEntry);
    return newEntry;
};

export const recordJournalEntry = async (e: {date: string, description: string, referenceId: string, debitAccountId: string, creditAccountId: string, amount: number}) => {
    return createJournalEntry({
        date: e.date,
        description: e.description,
        referenceId: e.referenceId,
        referenceType: 'Adjustment',
        status: 'posted',
        lines: [
            { accountId: e.debitAccountId, debit: e.amount, credit: 0 },
            { accountId: e.creditAccountId, debit: 0, credit: e.amount }
        ]
    });
};
