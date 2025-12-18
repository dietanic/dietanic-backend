import React, { useState, useEffect } from 'react';
import { PayrollService, IdentityService, APIGateway } from '../../services/storeService';
import { User, Payslip, SalaryStructure, Expense } from '../../types';
import { DollarSign, User as UserIcon, FileText, Settings, Download, CheckCircle, Calculator, Plus, Trash2, X } from 'lucide-react';

export const PayrollModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'process' | 'history' | 'employees'>('process');
    const [users, setUsers] = useState<User[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Salary Config State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [salaryForm, setSalaryForm] = useState<SalaryStructure>({
        baseSalary: 0, hra: 0, transportAllowance: 0, pfDeduction: 0, taxDeduction: 0,
        customAllowances: [], customDeductions: []
    });

    // Payslip Generation State
    const [generatedSlip, setGeneratedSlip] = useState<Payslip | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [u, p] = await Promise.all([
            IdentityService.getUsers(),
            PayrollService.getPayslips()
        ]);
        // Filter only staff (admin/editor)
        setUsers(u.filter(user => user.role === 'admin' || user.role === 'editor'));
        setPayslips(p);
        setLoading(false);
    };

    const handleEditStructure = (user: User) => {
        setEditingUser(user);
        setSalaryForm(user.salaryStructure || {
            baseSalary: 30000, hra: 12000, transportAllowance: 2000, pfDeduction: 1800, taxDeduction: 1500,
            customAllowances: [], customDeductions: []
        });
    };

    const handleSaveStructure = async () => {
        if (!editingUser) return;
        await PayrollService.updateUserSalaryStructure(editingUser.id, salaryForm);
        setEditingUser(null);
        loadData();
    };

    const handleGenerateSlip = async (userId: string) => {
        try {
            const slip = await PayrollService.generateDraftPayslip(userId, selectedMonth);
            setGeneratedSlip(slip);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleConfirmSlip = async () => {
        if (!generatedSlip) return;
        const finalized = { ...generatedSlip, status: 'processed' as const };
        await PayrollService.savePayslip(finalized);
        setGeneratedSlip(null);
        loadData();
        setActiveTab('history');
    };

    // Helper for adding custom items to salary structure
    const addCustomItem = (type: 'allowance' | 'deduction') => {
        const item = { name: '', amount: 0 };
        if (type === 'allowance') {
            setSalaryForm({...salaryForm, customAllowances: [...salaryForm.customAllowances, item]});
        } else {
            setSalaryForm({...salaryForm, customDeductions: [...salaryForm.customDeductions, item]});
        }
    };

    const updateCustomItem = (type: 'allowance' | 'deduction', index: number, field: 'name' | 'amount', value: any) => {
        const list = type === 'allowance' ? [...salaryForm.customAllowances] : [...salaryForm.customDeductions];
        // @ts-ignore
        list[index][field] = value;
        if (type === 'allowance') setSalaryForm({...salaryForm, customAllowances: list});
        else setSalaryForm({...salaryForm, customDeductions: list});
    };

    const removeCustomItem = (type: 'allowance' | 'deduction', index: number) => {
        const list = type === 'allowance' ? [...salaryForm.customAllowances] : [...salaryForm.customDeductions];
        list.splice(index, 1);
        if (type === 'allowance') setSalaryForm({...salaryForm, customAllowances: list});
        else setSalaryForm({...salaryForm, customDeductions: list});
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Payroll Data...</div>;

    return (
        <div className="bg-white shadow rounded-lg animate-fade-in min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="text-green-600"/> Payroll & Salary
                    </h2>
                    <p className="text-sm text-gray-500">Automate staff payments and slips.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => setActiveTab('process')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'process' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Process Salary</button>
                    <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'employees' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Staff Config</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'history' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Payslip History</button>
                </div>
            </div>

            <div className="p-6 flex-1">
                {activeTab === 'process' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <label className="text-sm font-bold text-gray-700">Select Payroll Month:</label>
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border border-gray-300 rounded p-2 text-sm" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map(u => {
                                const hasSlip = payslips.some(p => p.userId === u.id && p.month === selectedMonth);
                                return (
                                    <div key={u.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{u.name}</h3>
                                                    <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                                                </div>
                                            </div>
                                            {hasSlip ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Paid</span> : <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">Pending</span>}
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <div className="text-xs text-gray-500">
                                                Base: ₹{u.salaryStructure?.baseSalary.toLocaleString() || 'N/A'}
                                            </div>
                                            {!hasSlip ? (
                                                <button onClick={() => handleGenerateSlip(u.id)} disabled={!u.salaryStructure} className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                                    {u.salaryStructure ? 'Generate Slip' : 'Configure First'}
                                                </button>
                                            ) : (
                                                <button className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50">View</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'employees' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Allowances</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">{u.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">₹{u.salaryStructure?.baseSalary.toLocaleString() || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">₹{((u.salaryStructure?.hra||0) + (u.salaryStructure?.transportAllowance||0)).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button onClick={() => handleEditStructure(u)} className="text-brand-600 hover:text-brand-900 flex items-center justify-end gap-1 ml-auto">
                                                <Settings size={16} /> Configure
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {payslips.length === 0 && <p className="text-center text-gray-500 py-12">No payslips generated yet.</p>}
                        {payslips.slice().reverse().map(slip => (
                            <div key={slip.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-green-100 text-green-600 rounded">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{slip.userName}</h4>
                                        <p className="text-xs text-gray-500">{slip.month} • Generated {new Date(slip.generatedDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase">Net Pay</p>
                                        <p className="font-bold text-gray-900">₹{slip.netSalary.toLocaleString()}</p>
                                    </div>
                                    <button className="text-gray-400 hover:text-brand-600">
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {/* 1. Structure Editor */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between">
                            <h3 className="font-bold text-lg">Salary Configuration: {editingUser.name}</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Base Salary</label><input type="number" className="w-full border rounded p-2" value={salaryForm.baseSalary} onChange={e=>setSalaryForm({...salaryForm, baseSalary: Number(e.target.value)})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">HRA (Allowance)</label><input type="number" className="w-full border rounded p-2" value={salaryForm.hra} onChange={e=>setSalaryForm({...salaryForm, hra: Number(e.target.value)})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Transport (Allowance)</label><input type="number" className="w-full border rounded p-2" value={salaryForm.transportAllowance} onChange={e=>setSalaryForm({...salaryForm, transportAllowance: Number(e.target.value)})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">PF (Deduction)</label><input type="number" className="w-full border rounded p-2" value={salaryForm.pfDeduction} onChange={e=>setSalaryForm({...salaryForm, pfDeduction: Number(e.target.value)})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Tax / TDS (Deduction)</label><input type="number" className="w-full border rounded p-2" value={salaryForm.taxDeduction} onChange={e=>setSalaryForm({...salaryForm, taxDeduction: Number(e.target.value)})}/></div>
                            </div>

                            {/* Custom Components */}
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="font-bold text-sm mb-2">Custom Allowances</h4>
                                {salaryForm.customAllowances.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input placeholder="Name" className="flex-1 border rounded p-1 text-sm" value={item.name} onChange={e=>updateCustomItem('allowance', idx, 'name', e.target.value)} />
                                        <input type="number" placeholder="Amount" className="w-24 border rounded p-1 text-sm" value={item.amount} onChange={e=>updateCustomItem('allowance', idx, 'amount', Number(e.target.value))} />
                                        <button onClick={()=>removeCustomItem('allowance', idx)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                <button onClick={()=>addCustomItem('allowance')} className="text-xs text-brand-600 flex items-center gap-1 font-bold mt-2"><Plus size={12}/> Add Allowance</button>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onClick={handleSaveStructure} className="px-6 py-2 bg-brand-600 text-white rounded font-bold hover:bg-brand-700">Save Structure</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Payslip Preview */}
            {generatedSlip && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="bg-brand-600 text-white p-6 text-center">
                            <h2 className="text-2xl font-bold">Salary Slip</h2>
                            <p className="opacity-90">{generatedSlip.month}</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between border-b pb-4">
                                <div>
                                    <p className="text-xs text-gray-500">Employee Name</p>
                                    <p className="font-bold text-lg">{generatedSlip.userName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Date Generated</p>
                                    <p className="font-bold">{new Date(generatedSlip.generatedDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-green-600 font-bold uppercase text-xs mb-2">Earnings</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between"><span>Basic</span><span>{generatedSlip.earnings.basic}</span></div>
                                        <div className="flex justify-between"><span>HRA</span><span>{generatedSlip.earnings.hra}</span></div>
                                        <div className="flex justify-between"><span>Transport</span><span>{generatedSlip.earnings.transport}</span></div>
                                        <div className="flex justify-between"><span>Bonus/Other</span><span>{generatedSlip.earnings.bonus}</span></div>
                                        <div className="flex justify-between text-blue-600"><span>Reimbursements</span><span>{generatedSlip.earnings.reimbursements}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-red-600 font-bold uppercase text-xs mb-2">Deductions</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between"><span>PF</span><span>{generatedSlip.deductions.pf}</span></div>
                                        <div className="flex justify-between"><span>Tax (TDS)</span><span>{generatedSlip.deductions.tax}</span></div>
                                        <div className="flex justify-between"><span>Unpaid Leave</span><span>{generatedSlip.deductions.unpaidLeave}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                                <span className="font-bold text-gray-700">Net Payable Salary</span>
                                <span className="text-2xl font-bold text-brand-600">₹{generatedSlip.netSalary.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                            <button onClick={() => setGeneratedSlip(null)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded">Cancel</button>
                            <button onClick={handleConfirmSlip} className="flex-[2] py-3 bg-brand-600 text-white font-bold rounded hover:bg-brand-700 flex justify-center items-center gap-2">
                                <CheckCircle size={18}/> Approve & Process
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};