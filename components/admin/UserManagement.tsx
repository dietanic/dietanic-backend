
import React, { useState, useEffect } from 'react';
import { IdentityService } from '../../services/storeService';
import { sendPasswordResetEmail } from '../../services/emailService';
import { User } from '../../types';
import { User as UserIcon, Mail, Trash2, Plus, Shield, CheckCircle, Ban, Users, Eye, Tag, Phone } from 'lucide-react';
import { useAuth } from '../../App';
import { CustomerDetail } from './CustomerDetail';

interface UserManagementProps {
    viewMode: 'internal' | 'customer';
}

export const UserManagement: React.FC<UserManagementProps> = ({ viewMode }) => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
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
        // Reset form state when switching views
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
            priceTier: newUser.priceTier || 'standard'
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

    const handleResetPassword = async (user: User) => {
        await sendPasswordResetEmail(user);
        alert(`Reset link sent to ${user.email}`);
    };

    const handleTierChange = async (user: User, newTier: 'standard' | 'wholesale') => {
        await IdentityService.updateUser({...user, priceTier: newTier});
        loadUsers();
    };

    if (!isAdmin) {
        return <div className="p-8 text-center text-gray-500">Access Restricted to Administrators</div>;
    }

    if (selectedUser && viewMode === 'customer') {
        return <CustomerDetail user={selectedUser} onBack={() => setSelectedUser(null)} />;
    }

    return (
        <div className="bg-white shadow rounded-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    {viewMode === 'internal' ? <Shield size={20} className="text-brand-600"/> : <Users size={20} className="text-brand-600"/>}
                    {viewMode === 'internal' ? 'System User Management' : 'Customer List'}
                </h3>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                    {isAdding ? 'Cancel' : <><Plus size={16} /> Add {viewMode === 'internal' ? 'Admin/Editor' : 'Customer'}</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                            <input className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required type="email" placeholder="john@example.com" />
                        </div>
                        
                        {/* Phone Number Input */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                            <div className="flex gap-2">
                                <select 
                                    className="border border-gray-300 rounded-md shadow-sm text-sm p-2 bg-white"
                                    value={newUser.countryCode}
                                    onChange={e => setNewUser({...newUser, countryCode: e.target.value})}
                                >
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                    <option value="+44">+44</option>
                                    <option value="+971">+971</option>
                                </select>
                                <input 
                                    className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border" 
                                    value={newUser.phoneNumber} 
                                    onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} 
                                    type="tel" 
                                    placeholder="9876543210" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                            <select 
                                className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500" 
                                value={newUser.role} 
                                onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                disabled={viewMode === 'customer'}
                            >
                                {viewMode === 'internal' ? (
                                    <>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </>
                                ) : (
                                    <option value="customer">Customer</option>
                                )}
                            </select>
                        </div>
                        {viewMode === 'customer' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price Tier</label>
                                <select 
                                    className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2 border"
                                    value={newUser.priceTier}
                                    onChange={e => setNewUser({...newUser, priceTier: e.target.value as any})}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="wholesale">Wholesale</option>
                                </select>
                            </div>
                        )}
                        <div className="flex items-end">
                            <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 h-[38px]">Save User</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            {viewMode === 'customer' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Tier</th>}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                                        <UserIcon size={18}/>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                        {u.phone && <div className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={10}/> {u.phone}</div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                        u.role === 'editor' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {u.role === 'admin' && <Shield size={12} />}
                                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                    </span>
                                </td>
                                {viewMode === 'customer' && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select 
                                            value={u.priceTier || 'standard'}
                                            onChange={(e) => handleTierChange(u, e.target.value as any)}
                                            className="text-xs border border-gray-300 rounded p-1 bg-white"
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="wholesale">Wholesale</option>
                                        </select>
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => handleToggleStatus(u)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                                        u.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}>
                                        {u.status === 'active' ? <CheckCircle size={12}/> : <Ban size={12}/>}
                                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {viewMode === 'customer' && (
                                        <button onClick={() => setSelectedUser(u)} className="text-brand-600 hover:text-brand-900 mr-4 p-1 hover:bg-brand-50 rounded" title="View Customer Details">
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => handleResetPassword(u)} className="text-blue-600 hover:text-blue-900 mr-4 p-1 hover:bg-blue-50 rounded" title="Send Password Reset Email">
                                        <Mail size={16}/>
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="Delete User">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={viewMode === 'customer' ? 5 : 4} className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                    No {viewMode === 'internal' ? 'system users' : 'customers'} found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
