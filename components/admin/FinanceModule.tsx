
import React, { useState, useEffect } from 'react';
import { FinanceService } from '../../services/storeService';
import { Expense, LedgerEntry, LedgerAccount, BankTransaction, FinancialForecast, Quote, SalesOrder, Invoice, Vendor, Bill, Project, VendorCredit } from '../../types';
import { 
    DollarSign, TrendingUp, FileText, Plus, RefreshCw, Layers, Scale, 
    ArrowUpRight, ArrowDownRight, Briefcase, Users, FilePlus, Check, X, Clock, Calendar, CheckCircle,
    Receipt, Tag, AlertTriangle, Truck, Upload
} from 'lucide-react';
import { TaxSettingsPanel } from './TaxSettings';

// Sub-components defined inline for simplicity within file constraints

// --- RECEIVABLES ---
const ReceivablesTab: React.FC<{ quotes: Quote[], salesOrders: SalesOrder[], invoices: Invoice[], refresh: () => void }> = ({ quotes, salesOrders, invoices, refresh }) => {
    const [paymentModal, setPaymentModal] = useState<string | null>(null); // Invoice ID
    const [paymentAmount, setPaymentAmount] = useState(0);

    const handleRecordPayment = async () => {
        if (paymentModal && paymentAmount > 0) {
            await FinanceService.recordInvoicePayment(paymentModal, paymentAmount, 'Bank Transfer');
            setPaymentModal(null);
            setPaymentAmount(0);
            refresh();
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Unpaid Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">₹{invoices.reduce((acc, i) => acc + (i.status !== 'paid' ? i.balanceDue : 0), 0).toLocaleString()}</p>
                    </div>
                    <FileText className="text-blue-500" size={24}/>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Pending Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{salesOrders.filter(so => so.status === 'pending_approval').length}</p>
                    </div>
                    <Clock className="text-orange-500" size={24}/>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                    <span className="font-bold text-gray-700 flex items-center gap-2"><Plus/> Create Quote</span>
                </div>
            </div>

            {/* Invoices */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Invoices & Payments</h3>
                </div>
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">#</th>
                            <th className="px-4 py-3 text-left font-medium">Customer</th>
                            <th className="px-4 py-3 text-left font-medium">Due Date</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Progress</th>
                            <th className="px-4 py-3 text-right font-medium">Balance Due</th>
                            <th className="px-4 py-3 text-right font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {invoices.map(inv => {
                            const paidPercent = Math.round(((inv.amount - inv.balanceDue) / inv.amount) * 100);
                            return (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.id.slice(-6)}</td>
                                    <td className="px-4 py-3">{inv.customerName}</td>
                                    <td className="px-4 py-3">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                                            inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                            inv.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                                            inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 w-32">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{width: `${paidPercent}%`}}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">{paidPercent}% Paid</p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">₹{inv.balanceDue.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        {inv.balanceDue > 0 && (
                                            <button onClick={() => { setPaymentModal(inv.id); setPaymentAmount(inv.balanceDue); }} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100">
                                                Record Pay
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Record Partial Payment</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter amount received for Invoice #{paymentModal.slice(-6)}.</p>
                        <input 
                            type="number" 
                            className="w-full border rounded-lg p-2 mb-4 text-lg font-bold" 
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setPaymentModal(null)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleRecordPayment} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales Orders & Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckCircle size={16} className="text-purple-500"/> Sales Approvals
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {salesOrders.filter(so => so.status === 'pending_approval').length === 0 && <p className="text-sm text-gray-400 italic">No orders pending approval.</p>}
                        {salesOrders.filter(so => so.status === 'pending_approval').map(so => (
                            <div key={so.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{so.customerName}</p>
                                    <p className="text-xs text-gray-500">Amount: ₹{so.total.toLocaleString()}</p>
                                </div>
                                <button onClick={async () => { await FinanceService.approveSalesOrder(so.id); refresh(); }} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-800 mb-4">Quotes</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {quotes.map(q => (
                            <div key={q.id} className="flex justify-between items-center text-sm border-b pb-2">
                                <span>{q.customerName}</span>
                                <div className="flex gap-2 items-center">
                                    <span className="font-mono">₹{q.total}</span>
                                    <span className={`text-[10px] px-1.5 rounded uppercase ${q.status==='accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{q.status}</span>
                                    {q.status !== 'accepted' && <button onClick={async () => { await FinanceService.convertQuoteToSO(q.id); refresh(); }} className="text-blue-600 hover:underline text-xs">Convert</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PAYABLES ---
const PayablesTab: React.FC<{ vendors: Vendor[], bills: Bill[], refresh: () => void }> = ({ vendors, bills, refresh }) => {
    const [credits, setCredits] = useState<VendorCredit[]>([]);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [newCredit, setNewCredit] = useState<Partial<VendorCredit>>({ amount: 0, reason: '' });

    useEffect(() => {
        FinanceService.getVendorCredits().then(setCredits);
    }, [bills]); // Refresh credits when bills change (payment might happen)

    const handleApproveBill = async (billId: string) => {
        await FinanceService.approveBill(billId);
        refresh();
    };

    const handleCreateCredit = async () => {
        if (!newCredit.vendorId || !newCredit.amount) return;
        const vendor = vendors.find(v => v.id === newCredit.vendorId);
        if(!vendor) return;

        await FinanceService.createVendorCredit({
            id: `vc_${Date.now()}`,
            vendorId: newCredit.vendorId,
            vendorName: vendor.name,
            date: new Date().toISOString(),
            amount: newCredit.amount,
            remainingAmount: newCredit.amount,
            reason: newCredit.reason || 'Goods Return',
            status: 'open'
        });
        setShowCreditModal(false);
        setNewCredit({ amount: 0, reason: '' });
        // Refresh credits local state
        FinanceService.getVendorCredits().then(setCredits);
        refresh(); // Refresh vendor balances
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Payables</p>
                    <p className="text-2xl font-bold text-red-600">₹{vendors.reduce((acc, v) => acc + v.balanceDue, 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold">Vendor Credits</p>
                    <p className="text-2xl font-bold text-green-600">₹{credits.reduce((acc, c) => acc + (c.status === 'open' ? c.remainingAmount : 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold">Pending Approvals</p>
                    <p className="text-2xl font-bold text-orange-600">{bills.filter(b => b.status === 'pending_approval').length}</p>
                </div>
                <button onClick={() => setShowCreditModal(true)} className="bg-white p-4 rounded-lg border border-dashed border-gray-300 flex items-center justify-center gap-2 hover:border-brand-500 hover:text-brand-600 transition-colors">
                    <Plus/> Add Vendor Credit
                </button>
            </div>

            {/* Vendor List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Vendors</h3></div>
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {vendors.map(v => (
                            <div key={v.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{v.name}</p>
                                    <p className="text-xs text-gray-500">{v.category}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-red-600">₹{v.balanceDue.toLocaleString()}</span>
                                    <span className="text-[10px] text-gray-400">Balance</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Bills & Approvals</h3></div>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">Vendor</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Approval</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bills.map(bill => (
                                <tr key={bill.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{bill.vendorName}</div>
                                        <div className="text-xs text-gray-500">{new Date(bill.date).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                                            bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            bill.status === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                        }`}>{bill.status.replace('_', ' ')}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {bill.approvalStatus === 'pending' ? (
                                            <span className="flex items-center gap-1 text-orange-600 font-bold text-xs"><AlertTriangle size={12}/> Pending</span>
                                        ) : (
                                            <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={12}/> Approved</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">₹{bill.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        {/* Attachments Icon Mock */}
                                        <button className="text-gray-400 hover:text-gray-600" title="View Attachments"><Receipt size={16}/></button>
                                        
                                        {bill.approvalStatus === 'pending' && (
                                            <button onClick={() => handleApproveBill(bill.id)} className="bg-brand-600 text-white px-2 py-1 rounded text-xs hover:bg-brand-700">Approve</button>
                                        )}
                                        {bill.status !== 'paid' && bill.approvalStatus === 'approved' && (
                                            <button onClick={() => FinanceService.payBill(bill.id, bill.balanceDue).then(refresh)} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">Pay</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vendor Credit Modal */}
            {showCreditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Issue Vendor Credit</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                                <select className="w-full border rounded-md p-2" onChange={e=>setNewCredit({...newCredit, vendorId: e.target.value})}>
                                    <option value="">Select Vendor</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
                                <input type="number" className="w-full border rounded-md p-2" value={newCredit.amount} onChange={e=>setNewCredit({...newCredit, amount: Number(e.target.value)})}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <input type="text" className="w-full border rounded-md p-2" placeholder="e.g. Returned damaged goods" value={newCredit.reason} onChange={e=>setNewCredit({...newCredit, reason: e.target.value})}/>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setShowCreditModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleCreateCredit} className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold">Create Credit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COMPLIANCE (TAX) ---
const ComplianceTab: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">GSTR-1 (Sales)</h3>
                    <p className="text-xs text-gray-500 mb-4">Outward supplies of goods or services</p>
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-brand-600">₹45,200</span>
                        <button className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded">View Summary</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">GSTR-3B (Summary)</h3>
                    <p className="text-xs text-gray-500 mb-4">Monthly self-declaration return</p>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-orange-500 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Due in 5 Days</span>
                        <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">File Now</button>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">ITC Available</h3>
                    <p className="text-xs text-gray-500 mb-4">Input Tax Credit from purchases</p>
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-blue-600">₹12,450</span>
                        <button className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded">Reconcile</button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Truck size={20} className="text-gray-500" /> E-Way Bill Generation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded border border-gray-200 text-sm">
                            <p className="mb-2">Generate E-Way Bill for consignments value exceeding ₹50,000.</p>
                            <button className="bg-gray-900 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-800">
                                <Plus size={14}/> Create New E-Way Bill
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3">Recent E-Way Bills</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="font-mono text-gray-600">EB-491203</span>
                                <span className="text-green-600 text-xs font-bold uppercase">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                                <span className="font-mono text-gray-600">EB-491188</span>
                                <span className="text-gray-400 text-xs font-bold uppercase">Expired</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TaxSettingsPanel />
        </div>
    );
};

const ProjectsTab: React.FC<{ projects: Project[], refresh: () => void }> = ({ projects, refresh }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Catering & Corporate Projects</h3>
                <button className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                    <Plus size={16} /> New Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                    <div key={p.id} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{p.name}</h4>
                                <p className="text-sm text-gray-500">{p.clientName}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${p.status==='active'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Budget</span>
                                <span className="font-medium">₹{p.budget.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Expenses</span>
                                <span className="font-medium text-red-600">₹{p.totalExpenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Billable Hours</span>
                                <span className="font-medium">{p.totalBillableTime} hrs</span>
                            </div>
                        </div>

                        <div className="border-t pt-4 flex gap-2">
                            <button className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 py-2 rounded text-gray-700 flex justify-center items-center gap-1"><Clock size={14}/> Log Time</button>
                            <button className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 py-2 rounded text-gray-700 flex justify-center items-center gap-1"><DollarSign size={14}/> Add Expense</button>
                            <button className="flex-1 text-xs bg-brand-50 hover:bg-brand-100 py-2 rounded text-brand-700 font-bold">Generate Invoice</button>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && <p className="col-span-2 text-center py-12 text-gray-500">No active catering projects.</p>}
            </div>
        </div>
    );
};

export const FinanceModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'receivables' | 'payables' | 'projects' | 'compliance'>('dashboard');
    const [loading, setLoading] = useState(true);
    
    // Data State
    const [financials, setFinancials] = useState<any>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [fin, qs, sos, invs, vends, bs, projs] = await Promise.all([
            FinanceService.generateStatement(),
            FinanceService.getQuotes(),
            FinanceService.getSalesOrders(),
            FinanceService.getInvoices(),
            FinanceService.getVendors(),
            FinanceService.getBills(),
            FinanceService.getProjects()
        ]);
        
        setFinancials(fin);
        setQuotes(qs);
        setSalesOrders(sos);
        setInvoices(invs);
        setVendors(vends);
        setBills(bs);
        setProjects(projs);
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
                        { id: 'receivables', label: 'Receivables' },
                        { id: 'payables', label: 'Payables' },
                        { id: 'compliance', label: 'Tax & GST' },
                        { id: 'projects', label: 'Projects' }
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
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{financials.revenue.toLocaleString()}</h3>
                            <div className="flex items-center text-xs text-green-600 mt-2 gap-1"><ArrowUpRight size={12}/> Inflow</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Expenses</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{financials.expenses.toLocaleString()}</h3>
                            <div className="flex items-center text-xs text-red-600 mt-2 gap-1"><ArrowDownRight size={12}/> Outflow</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit</p>
                            <h3 className={`text-2xl font-bold mt-1 ${financials.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ₹{financials.netProfit.toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tax Liability</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{financials.taxLiability.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Cash Flow Chart (Visual) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-6">Cash Flow Analysis</h3>
                        <div className="h-64 flex items-end justify-around gap-4 px-4">
                            {[1,2,3,4,5,6].map(m => {
                                const inflow = Math.random() * 80 + 20;
                                const outflow = Math.random() * 50 + 10;
                                return (
                                    <div key={m} className="flex flex-col items-center gap-2 h-full justify-end w-full">
                                        <div className="w-full flex gap-1 items-end justify-center h-full">
                                            <div className="w-4 bg-green-500 rounded-t-sm transition-all duration-1000" style={{height: `${inflow}%`}}></div>
                                            <div className="w-4 bg-red-400 rounded-t-sm transition-all duration-1000" style={{height: `${outflow}%`}}></div>
                                        </div>
                                        <span className="text-xs text-gray-400">M{m}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-xs">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500"></div> Income</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400"></div> Expense</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'receivables' && <ReceivablesTab quotes={quotes} salesOrders={salesOrders} invoices={invoices} refresh={loadData} />}
            
            {activeTab === 'payables' && <PayablesTab vendors={vendors} bills={bills} refresh={loadData} />}
            
            {activeTab === 'projects' && <ProjectsTab projects={projects} refresh={loadData} />}

            {activeTab === 'compliance' && <ComplianceTab />}
        </div>
    );
};
