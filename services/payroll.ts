
import { Payslip, SalaryStructure } from '../types';
import { DB, delay } from './storage';
import { FinanceService } from './finance';
import { IdentityService } from './identity';

const KEY = 'dietanic_payslips';

export const PayrollService = {
    getPayslips: () => DB.getAll<Payslip>(KEY, []),
    savePayslip: async (p: Payslip) => {
        await DB.add(KEY, p);
        await FinanceService.addExpense({ id: `exp_${p.id}`, category: 'Salaries', amount: p.netSalary, description: `Sal ${p.userName}`, paymentMethod: 'Bank', date: new Date().toISOString(), status: 'approved' });
    },
    updateUserSalaryStructure: async (uid: string, s: SalaryStructure) => {
        const u = await IdentityService.getUserById(uid);
        if(u) { u.salaryStructure = s; await IdentityService.updateUser(u); }
    },
    generateDraftPayslip: async (uid: string, month: string): Promise<Payslip> => {
        await delay();
        const u = await IdentityService.getUserById(uid);
        if (!u?.salaryStructure) throw new Error("No salary struct");
        const s = u.salaryStructure;
        const totalEarn = s.baseSalary + s.hra + s.transportAllowance + s.customAllowances.reduce((a,b)=>a+b.amount,0);
        const totalDed = s.pfDeduction + s.taxDeduction + s.customDeductions.reduce((a,b)=>a+b.amount,0);
        return {
            id: `pay_${Date.now()}`, userId: u.id, userName: u.name, month, generatedDate: new Date().toISOString(), status: 'draft',
            earnings: { basic: s.baseSalary, hra: s.hra, transport: s.transportAllowance, bonus: 0, reimbursements: 0, totalEarnings: totalEarn },
            deductions: { pf: s.pfDeduction, tax: s.taxDeduction, unpaidLeave: 0, totalDeductions: totalDed },
            netSalary: totalEarn - totalDed
        };
    }
};
