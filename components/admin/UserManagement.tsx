
import React, { useState, useEffect } from 'react';
import { IdentityService, CustomerService } from '../../services/storeService';
import { sendPasswordResetEmail, sendTestimonialRequestEmail, sendPaymentReminderEmail } from '../../services/notifications'; // Direct import for actions
import { User, Permission, Order } from '../../types';
import { User as UserIcon, Mail, Trash2, Plus, Shield, CheckCircle, Ban, Users, Eye, Phone, ShieldCheck, X, ChevronDown, Check, ClipboardCheck, Briefcase, Activity, AlertCircle, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../../App';
import { CustomerDetail } from './CustomerDetail';
import { SalesService } from '../../services/storeService';

interface UserManagementProps {
    viewMode: 'internal' | 'customer';
}

const AVAILABLE_TASKS: {id: Permission, label: string, desc: string, color: string}[] = [
    { id: 'manage_inventory', label: 'Inventory Control', desc: 'Add/Update products and stock levels', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { id: 'manage_orders', label: 'Order Fulfillment', desc: 'Pick, pack and process customer orders', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { id: 'access_pos', label: 'Point of Sale', desc: 'Access terminal and table billing systems', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { id: 'view_financials', label: 'Finance Reports', desc: 'Access P&L, tax reports and forecasts', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { id: 'manage_users', label: 'User Admin', desc: 'Manage other staff members and customers', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { id: 'view_phi', label: 'Privacy Access', desc: 'View unmasked health/PII data for customers', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { id: 'process_refunds', label: 'Payment Ops', desc: 'Handle wallet and invoice credit processing', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' }
];

export const UserManagement: React.FC<UserManagementProps> = ({ viewMode }) => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [permissionsModal, setPermissionsModal] = useState<User | null>(null);
    
    const defaultRole = viewMode === 'internal' ? 'editor' : 'customer';
    const [newUser, setNewUser] = useState<Partial<User> & { countryCode?: string, phoneNumber?: string }>({ 
        name: '', 
        email: '', 
        role: defaultRole, 
        status: 'active',
        priceTier: 'standard',
        countryCode: '+91',
        phoneNumber: ''
    });

    useEffect(() => {
        loadUsers();
        setNewUser({ 
            name: '', 
            email: '', 
            role: viewMode === 'internal' ? 'editor' : 'customer', 
            status: 'active',
            priceTier: 'standard',
            countryCode: '+91',
            phoneNumber: ''
        });
        setIsAdding(false);
        setSelectedUser(null);
        setPermissionsModal(null);
    }, [viewMode]);

    const loadUsers = async () => {
        const data = await IdentityService.getUsers();
        if (viewMode === 'internal') {
            setUsers(data.filter(u => u.role === 'admin' || u.role === 'editor'));
        } else {
            setUsers(data.filter(u => u.role === 'customer'));
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newUser.name || !newUser.email) return;
        
        const fullPhone = newUser.phoneNumber ? `${newUser.countryCode || '+91'} ${newUser.phoneNumber}` : '';

        const u: User = {
            id: (viewMode === 'internal' ? 'emp_' : 'cust_') + Date.now(),
            name: newUser.name,
            email: newUser.email,
            phone: fullPhone,
            role: newUser.role || defaultRole,
            status: newUser.status || 'active',
            addresses: [],
            wishlist: [],
            priceTier: newUser.priceTier || 'standard',
            customPermissions: []
        };
        await IdentityService.addUser(u);
        setIsAdding(false);
        setNewUser({ name: '', email: '', role: defaultRole, status: 'active', priceTier: 'standard', countryCode: '+91', phoneNumber: '' });
        loadUsers();
    };

    const handleDelete = async (id: string) => {
        if(confirm('Delete user?')) {
            await IdentityService.deleteUser(id);
            loadUsers();
        }
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        await IdentityService.updateUser({...user, status: newStatus});
        loadUsers();
    };

    const handleTogglePermission = async (user: User, perm: Permission) => {
        const currentPerms = user.customPermissions || [];
        const newPerms = currentPerms.includes(perm)
            ? currentPerms.filter(p => p !== perm)
            : [...currentPerms, perm];
        
        const updated = { ...user, customPermissions: newPerms };
        await IdentityService.updateUser(updated);
        setPermissionsModal(updated);
        loadUsers();
    };

    const handleResetPassword = async (user: User) => {
        await sendPasswordResetEmail(user);
        alert(`Reset link sent to ${user.email}`);
    };

    const handleTierChange = async (user: User, newTier: 'standard' | 'wholesale') => {
        await IdentityService.updateUser({...user, priceTier: newTier});
        loadUsers();
    };

    // Client Management Action: Request Testimonial
    const handleRequestTestimonial = async (user: User) => {
        const orders = await SalesService.getOrdersByUser(user.id);
        const lastDelivered = orders.find(o => o.status === 'delivered');
        
        if (lastDelivered) {
            await sendTestimonialRequestEmail(lastDelivered, user);
            alert(`Review request sent to ${user.name} for Order #${lastDelivered.id.slice(-6)}`);
        } else {
            alert("No delivered orders found for this user.");
        }
    };

    // Client Management Action: Send Payment Reminder
    const handleSendPaymentReminder = async (user: User) => {
        const profile = await CustomerService.getCustomerByUserId(user.id);
        const unpaidInvoice = profile?.billing.invoices.find(i => i.balanceDue > 0);
        
        if (unpaidInvoice) {
            await sendPaymentReminderEmail(unpaidInvoice, user);
            alert(`Payment reminder sent to ${user.name} for Invoice #${unpaidInvoice.id.slice(-6)}`);
        } else {
            alert("No pending invoices found for this user.");
        }
    };

    if (!isAdmin) {
        return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest bg-white rounded-[2rem] border border-slate-100 shadow-sm">Access Restricted to Administrators</div>;
    }

    if (selectedUser && viewMode === 'customer') {
        return <CustomerDetail user={selectedUser} onBack={() => setSelectedUser(null)} />;
    }

    // Task Distribution Stats for the Hub Header
    const taskStats = AVAILABLE_TASKS.map(task => ({
        ...task,
        count: users.filter(u => u.customPermissions?.includes(task.id)).length
    }));

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Team Operational Hub - Dark Command Center Style */}
            {viewMode === 'internal' && (
                <div className="bg-slate-950 text-white rounded-[3rem] p-10 shadow-2xl border border-slate-800 relative overflow-hidden ring-1 ring-white/5">
                    <div className="absolute -top-24 -right-24 p-12 opacity-5 text-brand-500">
                        <Shield size={400} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-brand-500/10 text-brand-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-brand-500/20">
                                    Operational Authority Hub
                                </span>
                            </div>
                            <h3 className="text-4xl font-black text-white tracking-tighter">Personnel Task Matrix</h3>
                            <p className="text-slate-400 text-sm mt-2 max-w-md font-medium">Global delegation system for internal business nodes. Monitor and assign operational tokens across the team.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-900/80 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-slate-800/50 shadow-inner">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Nodes</span>
                                <span className="text-3xl font-black text-white font-mono">{users.length}</span>
                            </div>
                            <div className="bg-slate-900/80 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-slate-800/50 shadow-inner">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Load Factor</span>
                                <span className="text-3xl font-black text-brand-400 font-mono">
                                    {(users.reduce((acc, u) => acc + (u.customPermissions?.length || 0), 0) / users.length || 0).toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {taskStats.map(stat => (
                            <div key={stat.id} className="bg-slate-900/40 hover:bg-slate-900/60 rounded-[1.5rem] p-5 border border-slate-800/30 transition-all group cursor-default shadow-sm hover:shadow-brand-500/10">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`w-3 h-3 rounded-full ${stat.count > 0 ? 'bg-brand-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
                                    <span className="text-2xl font-black text-white font-mono">{stat.count}</span>
                                </div>
                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tighter leading-tight group-hover:text-brand-400 transition-colors">
                                    {stat.label.split(' ')[0]}<br/>{stat.label.split(' ')[1]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 gap-6">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
                        {viewMode === 'internal' ? <Briefcase size={32} className="text-brand-600"/> : <Users size={32} className="text-brand-600"/>}
                        {viewMode === 'internal' ? 'Active Staff Nodes' : 'Customer Ledger'}
                    </h3>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsAdding(!isAdding)} 
                        className={`px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${
                            isAdding ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'
                        }`}
                    >
                        {isAdding ? <X size={18}/> : <Plus size={18} />}
                        {isAdding ? 'Deactivate Form' : `Initialize ${viewMode === 'internal' ? 'Staff' : 'Profile'}`}
                    </button>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleAddUser} className="p-12 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 animate-scale-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity</label>
                            <input className="w-full bg-slate-50 border-2 border-transparent rounded-full px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required placeholder="e.g. Robert Vance" />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">System Email</label>
                            <input className="w-full bg-slate-50 border-2 border-transparent rounded-full px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required type="email" placeholder="r.vance@dietanic.co" />
                        </div>
                        
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Voice Link</label>
                            <div className="flex gap-3">
                                <select 
                                    className="border-transparent rounded-full text-xs px-6 py-5 bg-slate-100 shadow-inner focus:bg-white focus:border-brand-500 outline-none font-black"
                                    value={newUser.countryCode}
                                    onChange={e => setNewUser({...newUser, countryCode: e.target.value})}
                                >
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                </select>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-transparent rounded-full px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:border-brand-500 outline-none transition-all placeholder:text-slate-300" 
                                    value={newUser.phoneNumber} 
                                    onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} 
                                    type="tel" 
                                    placeholder="9876543210" 
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-end lg:col-span-3">
                            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-full text-xs font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-400/30">
                                Instantiate Personnel Records
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/30">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-50">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-10 py-7 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Authorized Node</th>
                                <th className="px-10 py-7 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    {viewMode === 'internal' ? 'Domain Authority' : 'Commercial Tier'}
                                </th>
                                <th className="px-10 py-7 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</th>
                                <th className="px-10 py-7 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/80 group transition-colors">
                                    <td className="px-10 py-8 whitespace-nowrap">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-700 ring-1 ring-slate-100">
                                                {u.avatar ? <img src={u.avatar} className="h-full w-full object-cover" alt=""/> : <UserIcon size={28}/>}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 tracking-tight">{u.name}</div>
                                                <div className="text-xs text-slate-400 font-bold">{u.email}</div>
                                                {u.phone && <div className="text-[10px] text-brand-600 flex items-center gap-1.5 mt-1.5 font-black uppercase tracking-wider"><Phone size={10}/> {u.phone}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 whitespace-nowrap">
                                        {viewMode === 'internal' ? (
                                            <div className="flex flex-wrap gap-2 max-w-[340px]">
                                                {u.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-950 text-white text-[9px] font-black uppercase tracking-[0.15em] border border-slate-700 shadow-xl">
                                                        <ShieldCheck size={14} className="text-brand-400"/> System Superuser
                                                    </span>
                                                ) : (
                                                    <>
                                                        {(u.customPermissions || []).length > 0 ? (
                                                            u.customPermissions?.slice(0, 2).map(p => {
                                                                const taskInfo = AVAILABLE_TASKS.find(t => t.id === p);
                                                                return (
                                                                    <span key={p} className={`inline-flex items-center px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${taskInfo?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                                        {taskInfo?.label || p.replace('_', ' ')}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-[0.2em] px-3">Restricted Access</span>
                                                        )}
                                                        {(u.customPermissions?.length || 0) > 2 && (
                                                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-3 py-2 rounded-full border border-slate-200">
                                                                +{u.customPermissions!.length - 2}
                                                            </span>
                                                        )}
                                                        <button onClick={() => setPermissionsModal(u)} className="p-2.5 rounded-full bg-slate-100 text-slate-400 hover:bg-brand-600 hover:text-white transition-all ml-2 shadow-sm border border-slate-200" title="Delegation Matrix">
                                                            <ChevronDown size={16}/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <select 
                                                value={u.priceTier || 'standard'}
                                                onChange={(e) => handleTierChange(u, e.target.value as any)}
                                                className="text-[10px] font-black uppercase tracking-[0.2em] border-2 border-slate-100 bg-white text-slate-700 rounded-full px-6 py-2.5 focus:ring-0 focus:border-brand-500 cursor-pointer transition-all shadow-sm"
                                            >
                                                <option value="standard">Baseline Pricing</option>
                                                <option value="wholesale">Institutional Tier</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-10 py-8 whitespace-nowrap">
                                        <button onClick={() => handleToggleStatus(u)} className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            u.status === 'active' 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                        }`}>
                                            {u.status === 'active' ? <CheckCircle size={14}/> : <Ban size={14}/>}
                                            {u.status}
                                        </button>
                                    </td>
                                    <td className="px-10 py-8 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            {viewMode === 'customer' ? (
                                                <>
                                                    <button onClick={() => handleRequestTestimonial(u)} className="p-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all shadow-sm border border-slate-100" title="Request Review">
                                                        <MessageSquare size={18} />
                                                    </button>
                                                    <button onClick={() => handleSendPaymentReminder(u)} className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all shadow-sm border border-slate-100" title="Send Payment Reminder">
                                                        <Bell size={18} />
                                                    </button>
                                                    <button onClick={() => setSelectedUser(u)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-slate-100" title="Deep Audit">
                                                        <Eye size={18} />
                                                    </button>
                                                </>
                                            ) : u.role !== 'admin' && (
                                                <button onClick={() => setPermissionsModal(u)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100" title="Grant Authority">
                                                    <ShieldCheck size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => handleResetPassword(u)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-slate-100" title="Email Verification">
                                                <Mail size={18}/>
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-slate-100" title="Wipe Instance">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DELEGATION MATRIX MODAL */}
            {permissionsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in border border-slate-100 ring-1 ring-white/10">
                        <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative">
                            <div className="absolute top-0 right-0 p-12 opacity-5">
                                <Activity size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black text-3xl uppercase tracking-tighter mb-1">Operational Authority</h3>
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse"></span>
                                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                        {permissionsModal.name} // NODE_{permissionsModal.id.slice(-4)}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPermissionsModal(null)} className="p-4 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-all relative z-10">
                                <X size={28} />
                            </button>
                        </div>
                        
                        <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-8">
                            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex items-start gap-4 shadow-inner">
                                <AlertCircle className="text-brand-600 flex-shrink-0 mt-0.5" size={20}/>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    Assigned business functions grant the target node <strong className="text-slate-900">Customized Service Access</strong>. These override default role restrictions for specific departmental workflows.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {AVAILABLE_TASKS.map(task => {
                                    const isActive = (permissionsModal.customPermissions || []).includes(task.id);
                                    return (
                                        <button 
                                            key={task.id}
                                            onClick={() => handleTogglePermission(permissionsModal, task.id)}
                                            className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all group flex items-start gap-6 relative overflow-hidden ${
                                                isActive 
                                                ? 'border-brand-500 bg-brand-50/40 shadow-xl shadow-brand-500/5' 
                                                : 'border-slate-50 hover:border-brand-200 bg-slate-50/50 hover:bg-white'
                                            }`}
                                        >
                                            <div className={`mt-0.5 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
                                                isActive ? 'bg-brand-600 border-brand-600 text-white rotate-0' : 'border-slate-200 text-transparent rotate-12 bg-white'
                                            }`}>
                                                <Check size={18} strokeWidth={4}/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-black text-[13px] uppercase tracking-wider mb-1 ${isActive ? 'text-brand-700' : 'text-slate-900'}`}>{task.label}</p>
                                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{task.desc}</p>
                                            </div>
                                            {isActive && (
                                                <div className="absolute -bottom-2 -right-2 opacity-[0.03] rotate-12 scale-150">
                                                    <Shield size={60} className="text-brand-600"/>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Changes persist globally in real-time</span>
                            <button 
                                onClick={() => setPermissionsModal(null)}
                                className="bg-slate-950 text-white px-14 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-300"
                            >
                                Confirm Delegation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
