
import React, { useState, useEffect } from 'react';
import { FinanceService, SettingsService } from '../../services/storeService';
import { Expense } from '../../types';
import { DollarSign, TrendingUp, TrendingDown, PieChart, FileText, Plus, Trash2, Calendar, Download, RefreshCw, Layers, AlertTriangle } from 'lucide-react';
import { TaxSettingsPanel } from './TaxSettings'; // Reusing TaxSettings component

type Tab = 'overview' | 'expenses' | 'tax' | 'settings';

export const FinanceModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [financials, setFinancials] = useState<any>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [taxReport, setTaxReport] = useState<any>(null);
    
    // Date Range
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Start of month
        end: new Date().toISOString().split('T')[0]
    });

    // New Expense Form
    const [isAddExpense, setIsAddExpense] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        category: 'Utilities', amount: 0, description: '', paymentMethod: 'Bank Transfer', date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        const [fin, exp, tax] = await Promise.all([
            FinanceService.generateStatement(dateRange.start, dateRange.end),
            FinanceService.getExpenses(),
            FinanceService.getTaxReport()
        ]);
        setFinancials(fin);
        setExpenses(exp);
        setTaxReport(tax);
        setLoading(false);
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.amount || !newExpense.description) return;

        const exp: Expense = {
            id: `exp_${Date.now()}`,
            category: newExpense.category as any,
            amount: Number(newExpense.amount),
            description: newExpense.description || '',
            paymentMethod: newExpense.paymentMethod as any,
            date: newExpense.date || new Date().toISOString()
        };

        await FinanceService.addExpense(exp);
        setIsAddExpense(false);
        setNewExpense({ category: 'Utilities', amount: 0, description: '', paymentMethod: 'Bank Transfer', date: new Date().toISOString().split('T')[0] });
        loadData();
    };

    const handleDeleteExpense = async (id: string) => {
        if(confirm('Delete this expense record?')) {
            await FinanceService.deleteExpense(id);
            loadData();
        }
    };

    if (loading && !financials) return <div className="p-12 text-center text-gray-500">Calculating Financials...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header / Nav */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> Financial Center
                </h2>
                
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['overview', 'expenses', 'tax', 'settings'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t as Tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm">
                        <Calendar size={14} className="text-gray-500"/>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="outline-none w-24 text-xs"/>
                        <span className="text-gray-400">-</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="outline-none w-24 text-xs"/>
                    </div>
                    <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded text-gray-500"><RefreshCw size={16}/></button>
                </div>
            </div>

            {/* Overview / P&L */}
            {activeTab === 'overview' && financials && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{financials.revenue.toLocaleString()}</h3>
                            <p className="text-xs text-gray-400 mt-2">{financials.orderCount} Orders</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">COGS</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{financials.cogs.toLocaleString()}</h3>
                            <p className="text-xs text-gray-400 mt-2">Cost of Goods Sold</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{financials.expenses.toLocaleString()}</h3>
                            <p className="text-xs text-gray-400 mt-2">Operational Costs</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit</p>
                            <h3 className={`text-2xl font-bold mt-1 ${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{financials.netProfit.toLocaleString()}
                            </h3>
                            <p className="text-xs text-gray-400 mt-2">
                                Margin: {financials.revenue > 0 ? ((financials.netProfit / financials.revenue) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Detailed Statement */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={18}/> Profit & Loss Statement</h3>
                            <button className="text-xs text-brand-600 flex items-center gap-1 hover:underline"><Download size={14}/> Export PDF</button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium">Total Sales Revenue</span>
                                <span className="font-bold">₹{financials.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600 text-sm">
                                <span className="pl-4">- Cost of Goods Sold (Ingredients, Packaging)</span>
                                <span>(₹{financials.cogs.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between py-2 border-b-2 border-gray-200 bg-gray-50 font-bold">
                                <span className="pl-2">Gross Profit</span>
                                <span className="text-gray-900">₹{financials.grossProfit.toLocaleString()}</span>
                            </div>
                            
                            <div className="py-4 space-y-1">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Operating Expenses</p>
                                {financials.breakdown.expensesList.map((exp: Expense) => (
                                    <div key={exp.id} className="flex justify-between text-sm text-gray-600 pl-4">
                                        <span>{exp.category} - {exp.description}</span>
                                        <span>(₹{exp.amount.toLocaleString()})</span>
                                    </div>
                                ))}
                                {financials.breakdown.expensesList.length === 0 && <p className="text-xs text-gray-400 pl-4 italic">No expenses recorded for period.</p>}
                            </div>

                            <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg mt-2">
                                <span>Net Income</span>
                                <span className={financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>₹{financials.netProfit.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Management */}
            {activeTab === 'expenses' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Layers size={20} className="text-gray-500"/> Expense Journal
                        </h3>
                        <button onClick={() => setIsAddExpense(!isAddExpense)} className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-brand-700">
                            <Plus size={16}/> Add Expense
                        </button>
                    </div>

                    {isAddExpense && (
                        <form onSubmit={handleAddExpense} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                                    <input type="date" className="w-full border-gray-300 rounded p-2 text-sm" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                                    <select className="w-full border-gray-300 rounded p-2 text-sm" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}>
                                        <option>Rent</option>
                                        <option>Salaries</option>
                                        <option>Marketing</option>
                                        <option>Utilities</option>
                                        <option>Software</option>
                                        <option>Inventory</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                    <input type="text" className="w-full border-gray-300 rounded p-2 text-sm" placeholder="e.g. Monthly Rent" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Amount</label>
                                    <input type="number" className="w-full border-gray-300 rounded p-2 text-sm" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}/>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button type="submit" className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-green-700">Save Record</button>
                            </div>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">{exp.category}</span></td>
                                        <td className="px-4 py-3 text-gray-800">{exp.description}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{exp.paymentMethod}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{exp.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400 italic">No expenses recorded.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tax Reporting */}
            {activeTab === 'tax' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600"/> Tax Liability Report
                        </h3>
                        <div className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded font-medium">
                            Total Payable: ₹{taxReport?.totalTax.toLocaleString()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 uppercase font-bold">IGST (Inter-State)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">₹{taxReport?.igst.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 uppercase font-bold">CGST (Central)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">₹{taxReport?.cgst.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 uppercase font-bold">SGST (State)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">₹{taxReport?.sgst.toLocaleString()}</p>
                        </div>
                    </div>

                    {taxReport?.urSales > 0 && (
                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg flex gap-3 items-start mb-6">
                            <div className="mt-0.5 text-yellow-600"><AlertTriangle size={18}/></div>
                            <div>
                                <h4 className="text-sm font-bold text-yellow-800">Unregistered Sales Detected</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Total sales value of <strong>₹{taxReport?.urSales.toLocaleString()}</strong> was recorded without tax (UR mode). 
                                    Ensure this aligns with your composition scheme or registration status.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            This report is generated based on orders placed in the system. 
                            Consult with a chartered accountant for official filing.
                        </p>
                    </div>
                </div>
            )}

            {/* Settings Reuse */}
            {activeTab === 'settings' && (
                <TaxSettingsPanel />
            )}
        </div>
    );
};
