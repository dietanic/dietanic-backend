
import React, { useState, useEffect } from 'react';
import { User, CustomerProfile, Order } from '../../types';
import { SalesService, CustomerService, SecurityService } from '../../services/storeService';
import { ArrowLeft, User as UserIcon, Phone, MapPin, CreditCard, Calendar, Truck, Pause, Play, FileText, CheckCircle, Clock, Wallet, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../App';

interface CustomerDetailProps {
    user: User;
    onBack: () => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ user, onBack }) => {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Privacy State
    const [revealSensitive, setRevealSensitive] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [prof, ords] = await Promise.all([
                CustomerService.ensureCustomerProfile(user),
                SalesService.getOrdersByUser(user.id)
            ]);
            setProfile(prof);
            setOrders(ords);
            setLoading(false);
        };
        loadData();
    }, [user]);

    const handleToggleSubscription = async () => {
        if (!profile || !profile.subscription) return;
        const newStatus = profile.subscription.status === 'active' ? 'paused' : 'active';
        
        // Mock update logic
        const updatedSub = { ...profile.subscription, status: newStatus as any };
        if (newStatus === 'paused') {
            updatedSub.pauseHistory = [...updatedSub.pauseHistory, { startDate: new Date().toISOString(), endDate: '', reason: 'User requested' }];
        } else {
             // Close last pause period
             const lastPause = updatedSub.pauseHistory[updatedSub.pauseHistory.length - 1];
             if(lastPause && !lastPause.endDate) lastPause.endDate = new Date().toISOString();
        }

        const updatedProfile = { ...profile, subscription: updatedSub };
        await CustomerService.updateCustomer(updatedProfile);
        setProfile(updatedProfile);
    };

    const handleTogglePrivacy = () => {
        if (!revealSensitive) {
            // Log access to PHI/PII as per HIPAA requirements
            const hasPermission = SecurityService.hasPermission(currentUser, 'view_phi');
            
            if (hasPermission) {
                if (confirm("You are about to access Protected Health Information (PHI/PII). This action will be logged in the audit trail. Continue?")) {
                    SecurityService.logAction(
                        currentUser,
                        'VIEW_PHI',
                        `Customer: ${user.name} (${user.id})`,
                        'Accessed unmasked profile data.',
                        'warning'
                    );
                    setRevealSensitive(true);
                }
            } else {
                alert("Access Denied: You do not have permission to view Protected Health Information.");
            }
        } else {
            setRevealSensitive(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Customer Profile...</div>;
    if (!profile) return <div className="p-8 text-center text-red-500">Profile not found.</div>;

    const displayPhone = revealSensitive ? (profile.phone || 'N/A') : SecurityService.maskPHI(profile.phone || '');
    const displayAddress = revealSensitive ? (
        <>
            {profile.shippingAddress.street}<br/>
            {profile.shippingAddress.city}, {profile.shippingAddress.state} {profile.shippingAddress.zip}
        </>
    ) : (
        <span className="italic text-gray-400">Address Masked for Privacy</span>
    );

    return (
        <div className="bg-white shadow rounded-lg animate-fade-in relative">
            {/* Privacy Banner */}
            {!revealSensitive && (
                <div className="bg-blue-50 text-blue-800 text-xs px-6 py-2 flex items-center justify-center gap-2 border-b border-blue-100">
                    <ShieldAlert size={14} /> Data Masking Active (HIPAA Compliance Mode)
                </div>
            )}

            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50 rounded-t-lg">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-300 text-gray-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Customer ID: <span className="font-mono">{user.id}</span>
                    </div>
                    <button 
                        onClick={handleTogglePrivacy}
                        className={`text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 border transition-colors ${
                            revealSensitive 
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        {revealSensitive ? <EyeOff size={14}/> : <Eye size={14}/>}
                        {revealSensitive ? 'Hide Sensitive Data' : 'Reveal Sensitive Data'}
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Profile Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <UserIcon size={16} className="text-brand-600"/> Personal Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="block text-gray-500 text-xs">Email</label>
                                <div className="font-medium">{user.email}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs">Phone</label>
                                <div className="font-medium">{displayPhone}</div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs flex items-center gap-1"><MapPin size={10}/> Shipping Address</label>
                                <div className="font-medium">{displayAddress}</div>
                            </div>
                            {/* HIPAA Medical Notes Placeholder */}
                            <div>
                                <label className="block text-gray-500 text-xs flex items-center gap-1 text-red-500"><ShieldAlert size={10}/> Medical/Dietary Notes</label>
                                {revealSensitive ? (
                                    <div className="font-medium bg-red-50 p-2 rounded text-red-800 text-xs border border-red-100 mt-1">
                                        {profile.medicalNotes || 'No specific medical alerts on file.'}
                                    </div>
                                ) : (
                                    <div className="italic text-gray-400 text-xs bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                                        Protected Health Information Hidden
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-brand-600"/> Billing Summary
                        </h3>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 text-sm">Current Month</span>
                            <span className="text-2xl font-bold text-gray-900">₹{profile.billing.currentMonthAmount}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">Recent Invoices</h4>
                        <div className="space-y-2">
                            {profile.billing.invoices.length > 0 ? profile.billing.invoices.map(inv => (
                                <div key={inv.id} className="flex justify-between text-sm border-b border-gray-100 pb-1 last:border-0">
                                    <span>{new Date(inv.date).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">₹{inv.amount}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${inv.status==='paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                                    </div>
                                </div>
                            )) : <p className="text-xs text-gray-400 italic">No invoices found</p>}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Wallet size={16} className="text-brand-600"/> Digital Wallet
                        </h3>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 text-sm">Current Balance</span>
                            <span className="text-2xl font-bold text-gray-900">₹{profile.walletBalance?.toFixed(2) || '0.00'}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">Recent Transactions</h4>
                        <div className="space-y-2">
                            {profile.walletHistory && profile.walletHistory.length > 0 ? (
                                profile.walletHistory.slice().reverse().slice(0, 3).map(txn => (
                                    <div key={txn.id} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0 mb-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-600">{new Date(txn.date).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-gray-400 truncate w-32" title={txn.description}>{txn.description}</span>
                                        </div>
                                        <span className={`font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {txn.amount > 0 ? '+' : ''}₹{txn.amount.toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic">No transactions found</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Subscription & Orders */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Subscription Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Calendar size={16} className="text-brand-600"/> Active Subscription
                            </h3>
                            {profile.subscription && (
                                <button onClick={handleToggleSubscription} className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 transition-colors ${profile.subscription.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                    {profile.subscription.status === 'active' ? <Pause size={12}/> : <Play size={12}/>}
                                    {profile.subscription.status === 'active' ? 'Pause Plan' : 'Resume Plan'}
                                </button>
                            )}
                         </div>
                         
                         {profile.subscription ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <div className="mb-4">
                                         <label className="text-xs text-gray-500">Plan Name</label>
                                         <p className="font-semibold text-lg text-brand-700">{profile.subscription.planName}</p>
                                     </div>
                                     <div className="flex gap-4">
                                         <div>
                                            <label className="text-xs text-gray-500">Start Date</label>
                                            <p className="text-sm font-medium">{new Date(profile.subscription.startDate).toLocaleDateString()}</p>
                                         </div>
                                         <div>
                                            <label className="text-xs text-gray-500">Renewal</label>
                                            <p className="text-sm font-medium">{new Date(profile.subscription.endDate).toLocaleDateString()}</p>
                                         </div>
                                     </div>
                                 </div>
                                 <div>
                                     <div className="mb-4">
                                        <label className="text-xs text-gray-500 flex items-center gap-1"><Truck size={12}/> Delivery Slot</label>
                                        <p className="text-sm font-medium bg-gray-50 p-2 rounded border border-gray-200 mt-1">{profile.subscription.deliverySlot}</p>
                                     </div>
                                     <div>
                                         <label className="text-xs text-gray-500">Status</label>
                                         <div className="mt-1 flex items-center gap-2">
                                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${profile.subscription.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <span className="text-sm font-medium capitalize">{profile.subscription.status}</span>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {profile.subscription.pauseHistory.length > 0 && (
                                     <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                         <h4 className="text-xs font-semibold text-gray-500 mb-2">Pause History</h4>
                                         <div className="flex flex-wrap gap-2">
                                             {profile.subscription.pauseHistory.map((h, i) => (
                                                 <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                                     {new Date(h.startDate).toLocaleDateString()} - {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'Ongoing'}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300">
                                 <p className="text-gray-500 text-sm">No active subscription plan.</p>
                             </div>
                         )}
                    </div>

                    {/* Orders Card */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-brand-600"/> Order History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Order ID</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Items</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map(o => (
                                        <tr key={o.id}>
                                            <td className="px-3 py-3 font-mono text-xs">#{o.id.slice(-6)}</td>
                                            <td className="px-3 py-3 text-gray-600">{new Date(o.date).toLocaleDateString()}</td>
                                            <td className="px-3 py-3 text-gray-600 max-w-xs truncate">{o.items.map(i=>i.name).join(', ')}</td>
                                            <td className="px-3 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                                                    o.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                                    o.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {o.status === 'delivered' && <CheckCircle size={10}/>}
                                                    {o.status === 'pending' && <Clock size={10}/>}
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium">₹{o.total}</td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500 italic">No orders found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
