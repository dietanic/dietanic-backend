import { Expense } from '../../types';
import { STORAGE_KEYS, DB } from '../storage';
import { checkLock } from './utils';
import { createJournalEntry, getChartOfAccounts } from './ledger'; // Import from local finance microservices

// Microservice: Finance Expenses
// Handles tracking and recording of business expenses

export const getExpenses = () => DB.getAll<Expense>(STORAGE_KEYS.PRODUCTS.replace('products', 'expenses'), []);

export const addExpense = async (e: Expense) => {
    await checkLock(e.date); await DB.add(STORAGE_KEYS.PRODUCTS.replace('products', 'expenses'), e);
    const accounts = await getChartOfAccounts(); // Use local ledger service
    const expenseAcc = accounts.find(a => a.name.includes(e.category) && a.type === 'Expense') || { id: '6000' }; // Default to 'Payroll Expense' if category not found

    await createJournalEntry({ // Use local ledger service
        date: e.date,
        description: e.description,
        referenceId: e.id,
        referenceType: 'Adjustment',
        lines: [
            { accountId: expenseAcc.id, debit: e.amount, credit: 0 },
            { accountId: '1010', debit: 0, credit: e.amount } // Credit Bank Account
        ],
        status: 'posted'
    });
};

export const deleteExpense = (id: string) => DB.delete(STORAGE_KEYS.PRODUCTS.replace('products', 'expenses'), id);
