import { Vendor, Bill, VendorCredit, JournalLine } from '../../types';
import { DB, delay, getLocalStorage } from '../storage';
import { INITIAL_VENDORS } from './constants';
import { checkLock } from './utils';
import { createJournalEntry } from './ledger'; // Import from local finance microservice

// Microservice: Finance Payables
// Handles Vendors, Bills, and Vendor Credits

export const getVendors = () => DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS);
export const getBills = () => DB.getAll<Bill>('dietanic_bills', []);

export const createBill = async (bill: Bill) => {
    await checkLock(bill.date);
    if (bill.amount < 1000) { bill.approvalStatus = 'approved'; bill.status = 'open'; } 
    else { bill.approvalStatus = 'pending'; bill.status = 'pending_approval'; }
    await DB.add('dietanic_bills', bill);
    if (bill.approvalStatus === 'approved') await approveBill(bill.id);
};

export const approveBill = async (id: string) => {
    const bills = await DB.getAll<Bill>('dietanic_bills');
    const b = bills.find(x => x.id === id);
    if (!b) return;
    b.approvalStatus = 'approved'; b.status = 'open';
    await DB.update('dietanic_bills', b);
    
    const vends = await DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS);
    const v = vends.find(x => x.id === b.vendorId);
    if(v) { v.balanceDue += b.amount; await DB.update('dietanic_vendors', v); }
    
    await createJournalEntry({ // Use the local ledger service
        date: b.date,
        description: `Bill from ${b.vendorName}`,
        referenceId: b.id,
        referenceType: 'Bill',
        lines: [
            { accountId: '5000', debit: b.amount, credit: 0 },
            { accountId: '2000', debit: 0, credit: b.amount }
        ],
        status: 'posted'
    });
};

export const payBill = async (id: string, amount: number) => {
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
    
    await createJournalEntry({ // Use the local ledger service
        date,
        description: `Payment for Bill #${b.id}`,
        referenceId: b.id,
        referenceType: 'Payment',
        lines: [
            { accountId: '2000', debit: paid, credit: 0 },
            { accountId: '1010', debit: 0, credit: paid }
        ],
        status: 'posted'
    });
};

export const getVendorCredits = () => DB.getAll<VendorCredit>('dietanic_vendor_credits', []);

export const createVendorCredit = async (vc: VendorCredit) => {
    await checkLock(vc.date); await DB.add('dietanic_vendor_credits', vc);
    const vends = await DB.getAll<Vendor>('dietanic_vendors', INITIAL_VENDORS);
    const v = vends.find(x => x.id === vc.vendorId);
    if(v) { v.balanceDue -= vc.amount; await DB.update('dietanic_vendors', v); }
    
    await createJournalEntry({ // Use the local ledger service
        date: vc.date,
        description: `Credit from ${vc.vendorName}`,
        referenceId: vc.id,
        referenceType: 'Adjustment',
        lines: [
            { accountId: '2000', debit: vc.amount, credit: 0 },
            { accountId: '5000', debit: 0, credit: vc.amount }
        ],
        status: 'posted'
    });
};