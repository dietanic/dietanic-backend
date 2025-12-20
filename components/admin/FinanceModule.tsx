
import React, { useState, useEffect } from 'react';
import { APIGateway } from '../../services/storeService'; // Use APIGateway
import { Expense, LedgerEntry, LedgerAccount, BankTransaction, FinancialForecast, Quote, SalesOrder, Invoice, Vendor, Bill, Project, VendorCredit, JournalLine } from '../../types';
import { 
    DollarSign, TrendingUp, FileText, Plus, RefreshCw, Layers, Scale, 
    ArrowUpRight, ArrowDownRight, Briefcase, Users, FilePlus, Check, X, Clock, Calendar, CheckCircle,
    Receipt, Tag, AlertTriangle, Truck, Upload, Book, Table, Globe, Send
} from 'lucide-react';
import { TaxSettingsPanel } from './TaxSettings';
import { sendBatchPaymentReminders } from '../../services/finance/receivables';

// --- ACCOUNTING / LEDGER COMPONENTS ---

const AccountingTab: React.FC = () => {
    const [view, setView] = useState<'coa' | 'journal' | 'gl'>('coa');
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual Entry State
    const [newJournal, setNewJournal] = useState<{description: string, date: string, currency: string, exchangeRate: number, lines: {accountId: string, debit: number, credit: number}[]}>({
        description: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'INR',
        exchangeRate: 1,
        lines: [
            { accountId: '', debit: 0, credit: 0 },
            { accountId: '', debit: 0, credit: 0 }
        ]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [accs, ents] = await Promise.all([
            APIGateway.Finance.Ledger.getChartOfAccounts(), // Use APIGateway
            APIGateway.Finance.Ledger.getEntries() // Use APIGateway
        ]);
        setAccounts(accs);
        setEntries(ents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    };

    const handleLineChange = (index: number, field: string, value: any) => {
        const updatedLines = [...newJournal.lines];
        // @ts-ignore
        updatedLines[index][field] = value;
        setNewJournal({ ...newJournal, lines: updatedLines });
    };

    const addLine = () => {
        setNewJournal({ ...newJournal, lines: [...newJournal.lines, { accountId: '', debit: 0, credit: 0 }] });
    };

    const postJournal = async () => {
        const totalDr = newJournal.lines.reduce((s, l) => s + Number(l.debit), 0);
        const totalCr = newJournal.lines.reduce((s, l) => s + Number(l.credit), 0);

        if (Math.abs(totalDr - totalCr) > 0.05) {
            alert(`Entries must balance. Dr: ${totalDr} vs Cr: ${totalCr}`);
            return;
        }
        if (!newJournal.description) {
            alert("Description required");
            return;
        }

        try {
            await APIGateway.Finance.Ledger.createJournalEntry({ // Use APIGateway
                date: new Date(newJournal.date).toISOString(),
                description: newJournal.description,
                referenceType: 'Adjustment',
                lines: newJournal.lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
                status: 'posted',
                currency: newJournal.currency,
                exchangeRate: newJournal.exchangeRate
            });
            alert("Posted successfully");
            setNewJournal({ description: '', date: new Date().toISOString().split('T')[0], currency: 'INR', exchangeRate: 1, lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]});
            loadData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Accounting Data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button onClick={() => setView('coa')} className={`px-4 py-2 text-sm font-bold rounded ${view === 'coa' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}>Chart of Accounts</button>
                <button onClick={() => setView('journal')} className={`px-4 py-2 text-sm font-bold rounded ${view === 'journal' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}>New Journal Entry</button>
                <button onClick={() => setView('gl')} className={`px-4 py-2 text-sm font-bold rounded ${view === 'gl' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}>General Ledger</button>
            </div>

            {view === 'coa' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-bold text-gray-500">Code</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500">Account Name</th>
                                <th className="px-6 py-3 text-left font-bold text-gray-500">Type</th>
                                <th className="px-6 py-3 text-right font-bold text-gray-500">Balance (Base)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {accounts.map(acc => (
                                <tr key={acc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-mono text-xs">{acc.code}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{acc.name}</td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                                            acc.type === 'Asset' ? 'bg-blue-100 text-blue-700' :
                                            acc.type === 'Liability' ? 'bg-red-100 text-red-700' :
                                            acc.type === 'Equity' ? 'bg-purple-100 text-purple-700' :
                                            acc.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                        }`}>{acc.type}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono font-bold">
                                        ₹{Math.abs(acc.balance).toLocaleString()} {acc.balance < 0 ? 'Cr' : 'Dr'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'journal' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-4xl">
                    <h3 className="text-lg font-bold mb-4">Manual Journal Entry</h3>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                            <input type="date" className="w-full border rounded p-2" value={newJournal.date} onChange={e => setNewJournal({...newJournal, date: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                            <input type="text" className="w-full border rounded p-2" placeholder="e.g. Monthly Depreciation" value={newJournal.description} onChange={e => setNewJournal({...newJournal, description: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Currency</label>
                            <div className="flex gap-1">
                                <select className="border rounded p-2 text-sm w-20" value={newJournal.currency} onChange={e => setNewJournal({...newJournal, currency: e.target.value, exchangeRate: e.target.value === 'INR' ? 1 : newJournal.exchangeRate})}>
                                    <option>INR</option><option>USD</option><option>EUR</option><option>AED</option>
                                </select>
                                <input type="number" className="border rounded p-2 text-sm w-20" disabled={newJournal.currency === 'INR'} value={newJournal.exchangeRate} onChange={e => setNewJournal({...newJournal, exchangeRate: Number(e.target.value)})} placeholder="Rate"/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                            <div className="col-span-6">Account</div>
                            <div className="col-span-2 text-right">Debit</div>
                            <div className="col-span-2 text-right">Credit</div>
                            <div className="col-span-2"></div>
                        </div>
                        {newJournal.lines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                <div className="col-span-6">
                                    <select className="w-full border rounded p-2 text-sm" value={line.accountId} onChange={e => handleLineChange(idx, 'accountId', e.target.value)}>
                                        <option value="">Select Account</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input type="number" className="w-full border rounded p-2 text-sm text-right" placeholder="0.00" value={line.debit} onChange={e => handleLineChange(idx, 'debit', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" className="w-full border rounded p-2 text-sm text-right" placeholder="0.00" value={line.credit} onChange={e => handleLineChange(idx, 'credit', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    {newJournal.lines.length > 2 && (
                                        <button onClick={() => setNewJournal({...newJournal, lines: newJournal.lines.filter((_, i) => i !== idx)})} className="text-red-500 p-2"><X size={16}/></button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button onClick={addLine} className="text-xs text-brand-600 font-bold flex items-center gap-1 mt-2"><Plus size={12}/> Add Line</button>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <div className="text-sm font-mono text-gray-500">
                            Total Dr: {newJournal.lines.reduce((s,l)=>s+Number(l.debit),0).toFixed(2)} | Total Cr: {newJournal.lines.reduce((s,l)=>s+Number(l.credit),0).toFixed(2)}
                        </div>
                        <button onClick={postJournal} className="bg-brand-600 text-white px-6 py-2 rounded font-bold hover:bg-brand-700">Post Entry</button>
                    </div>
                </div>
            )}

            {view === 'gl' && (
                <div className="space-y-4">
                    {entries.map(entry => (
                        <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900">{entry.description}</h4>
                                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()} • Ref: {entry.referenceType} #{entry.referenceId?.slice(-6)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-sm font-bold block">₹{entry.totalAmount.toLocaleString()}</span>
                                    {entry.currency && entry.currency !== 'INR' && (
                                        <span className="text-xs text-gray-400">({entry.currency} @ {entry.exchangeRate})</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                {entry.lines.map((line, idx) => {
                                    const acc = accounts.find(a => a.id === line.accountId);
                                    return (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{acc?.name || line.accountId}</span>
                                            <div className="flex gap-4 font-mono text-xs">
                                                <span className={line.debit > 0 ? "text-gray-900" : "text-gray-300"}>{line.debit > 0 ? `Dr ${line.debit.toFixed(2)}` : '-'}</span>
                                                <span className={line.credit > 0 ? "text-gray-900" : "text-gray-300"}>{line.credit > 0 ? `Cr ${line.credit.toFixed(2)}` : '-'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- RECEIVABLES TAB ---

const ReceivablesTab: React.FC<{ quotes: Quote[], salesOrders: SalesOrder[], invoices: Invoice[], refresh: () => void }> = ({ quotes, salesOrders, invoices, refresh }) => {
    const [paymentModal, setPaymentModal] = useState<string | null>(null); 
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [isAutomating, setIsAutomating] = useState(false);

    const handleRecordPayment = async () => {
        if (paymentModal && paymentAmount > 0) {
            await APIGateway.Finance.Receivables.recordInvoicePayment(paymentModal, paymentAmount, 'Bank Transfer'); // Use APIGateway
            setPaymentModal(null);
            setPaymentAmount(0);
            refresh();
        }
    };

    const handleBatchReminders = async () => {
        setIsAutomating(true);
        try {
            const sent = await sendBatchPaymentReminders();
            alert(`Sent ${sent} payment reminder emails.`);
            refresh();
        } catch (e: any) {
            alert("Error sending reminders: " + e.message);
        } finally {
            setIsAutomating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Unpaid Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">₹{invoices.reduce((acc, i) => acc + (i.status !== 'paid' ? i.balanceDue : 0), 0).toLocaleString()}</p>
                    </div>
                    <FileText className="text-blue-500" size={24}/>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Invoices & Collections</h3>
                    <button 
                        onClick={handleBatchReminders}
                        disabled={isAutomating}
                        className="bg-brand-600 text-white text-xs px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50"
                    >
                        {isAutomating ? 'Processing...' : <><Send size={14}/> Run Auto-Reminders</>}
                    </button>
                </div>
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Customer</th>
                            <th className="px-4 py-3 text-right">Balance</th>
                            <th className="px-4 py-3 text-right">Status</th>
                            <th className="px-4 py-3 text-right">Last Reminder</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono text-xs">{inv.id.slice(-6)}</td>
                                <td className="px-4 py-3">{inv.customerName}</td>
                                <td className="px-4 py-3 text-right font-bold">₹{inv.balanceDue.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                                        inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>{inv.status}</span>
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-gray-500">
                                    {inv.lastPaymentReminder ? new Date(inv.lastPaymentReminder).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {inv.balanceDue > 0 && (
                                        <button onClick={() => { setPaymentModal(inv.id); setPaymentAmount(inv.balanceDue); }} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100">Record Pay</button>
                                    )}
                                    {inv.balanceDue === 0 && (
                                        <CheckCircle size={16} className="text-green-500 inline-block"/>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {paymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Record Payment</h3>
                        <input type="number" className="w-full border rounded-lg p-2 mb-4" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))}/>
                        <div className="flex gap-2">
                            <button onClick={() => setPaymentModal(null)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handleRecordPayment} className="flex-1 py-2 bg-green-600 text-white rounded-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PAYABLES TAB ---

const PayablesTab: React.FC<{ vendors: Vendor[], bills: Bill[], refresh: () => void }> = ({ vendors, bills, refresh }) => {
    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Payables</p>
                    <p className="text-2xl font-bold text-red-600">₹{vendors.reduce((acc, v) => acc + v.balanceDue, 0).toLocaleString()}</p>
                </div>
             </div>
             <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                 <div className="p-4 bg-gray-50 font-bold border-b">Active Vendors</div>
                 {vendors.map(v => (
                     <div key={v.id} className="p-4 flex justify-between border-b last:border-0">
                         <span>{v.name}</span>
                         <span className="font-bold text-red-600">₹{v.balanceDue}</span>
                     </div>
                 ))}
             </div>
        </div>
    );
};

// --- COMPLIANCE TAB ---

const ComplianceTab: React.FC<{ taxReport: any }> = ({ taxReport }) => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-2">GST Summary</h3>
            <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-brand-600">₹{taxReport?.totalTax?.toLocaleString() || '0'}</span>
                <button className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded">View Report</button>
            </div>
        </div>
        <TaxSettingsPanel />
    </div>
);

// --- MAIN MODULE EXPORT ---

export const FinanceModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'accounting' | 'receivables' | 'payables' | 'compliance'>('dashboard');
    const [loading, setLoading] = useState(true);
    
    // Data State
    const [financials, setFinancials] = useState<any>(null);
    const [taxReport, setTaxReport] = useState<any>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [fin, tax, qs, sos, invs, vends, bs] = await Promise.all([
            APIGateway.Finance.Reporting.generateStatement(),
            APIGateway.Finance.Reporting.getTaxReport(),
            APIGateway.Finance.Receivables.getQuotes(),
            APIGateway.Finance.Receivables.getSalesOrders(),
            APIGateway.Finance.Receivables.getInvoices(),
            APIGateway.Finance.Payables.getVendors(),
            APIGateway.Finance.Payables.getBills()
        ]);
        
        setFinancials(fin);
        setTaxReport(tax);
        setQuotes(qs);
        setSalesOrders(sos);
        setInvoices(invs);
        setVendors(vends);
        setBills(bs);
        setLoading(false);
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Financial Suite...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header / Nav */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="text-green-600" /> ERP Finance Suite
                </h2>
                
                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                    {[
                        { id: 'dashboard', label: 'Reports' },
                        { id: 'accounting', label: 'Accounting' },
                        { id: 'receivables', label: 'Receivables' },
                        { id: 'payables', label: 'Payables' },
                        { id: 'compliance', label: 'Tax' }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded text-gray-500"><RefreshCw size={16}/></button>
            </div>

            {/* Content Switcher */}
            {activeTab === 'dashboard' && financials && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{financials.revenue?.total?.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Expenses</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{financials.expenses?.total?.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit</p>
                            <h3 className={`text-2xl font-bold mt-1 ${financials.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ₹{financials.netProfit?.toLocaleString() || '0'}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit Margin</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">{financials.netProfitMargin || '0'}%</h3>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'accounting' && <AccountingTab />}
            {activeTab === 'receivables' && <ReceivablesTab quotes={quotes} salesOrders={salesOrders} invoices={invoices} refresh={loadData} />}
            {activeTab === 'payables' && <PayablesTab vendors={vendors} bills={bills} refresh={loadData} />}
            {activeTab === 'compliance' && <ComplianceTab taxReport={taxReport} />}
        </div>
    );
};
