
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { CatalogService, APIGateway } from '../services/storeService';
import { PurchaseOrder, Vendor } from '../types';
import { Truck, CheckCircle, Clock, Package, Hash, Calendar, User, DollarSign, XCircle, FileText } from 'lucide-react';

export const VendorPortal: React.FC = () => {
    const { user } = useAuth();
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVendorData = async () => {
            if (!user.vendorId) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            const [allPOs, allVendors] = await Promise.all([
                CatalogService.getPurchaseOrders(),
                APIGateway.Finance.Payables.getVendors()
            ]);

            const currentVendor = allVendors.find(v => v.id === user.vendorId);
            if (currentVendor) {
                const vendorPOs = allPOs.filter(po => po.vendorId === user.vendorId);
                setPurchaseOrders(vendorPOs);
                setVendor(currentVendor);
            } else {
                console.error("Vendor not found for user");
            }
            setLoading(false);
        };

        loadVendorData();
    }, [user]);

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!vendor) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                 <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
                    <p className="text-gray-500 mt-2">You are not associated with a vendor account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome, {vendor.name}</h1>
                        <p className="text-sm text-gray-500">Your Vendor Portal</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src={user.avatar} alt="user avatar" className="w-10 h-10 rounded-full"/>
                    </div>
                </div>
            </header>
            
            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                     <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2"><FileText/> Purchase Orders</h2>
                    </div>

                    {purchaseOrders.length === 0 ? (
                        <div className="text-center py-20 px-6 bg-white rounded-lg shadow">
                            <Package size={64} className="mx-auto text-gray-300"/>
                            <h3 className="mt-4 text-xl font-medium text-gray-900">No Active Orders</h3>
                            <p className="mt-1 text-sm text-gray-500">There are currently no purchase orders for you.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {purchaseOrders.map(po => (
                                <div key={po.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                                    <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                             <div className="flex items-center gap-4">
                                                <span className={`p-2 rounded-full ${po.status === 'ordered' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                                    {po.status === 'ordered' ? <Clock className="text-blue-600"/> : <CheckCircle className="text-green-600"/>}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-lg">PO #{po.id.split('_')[1]}</p>
                                                    <p className={`text-sm font-semibold uppercase ${po.status === 'ordered' ? 'text-blue-600' : 'text-green-600'}`}>{po.status}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600"><Calendar size={16}/> <strong>Ordered:</strong> {new Date(po.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600"><Truck size={16}/> <strong>Expected:</strong> {new Date(po.expectedDate).toLocaleDateString()}</div>
                                        </div>

                                        <div className="md:w-px bg-gray-200 mx-4"></div>

                                        <div className="flex-1">
                                             <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Items ({po.items.length})</h4>
                                             <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                {po.items.map(item => (
                                                    <div key={item.productId} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                                                        <p className="text-gray-800 font-medium">{item.productName}</p>
                                                        <p className="text-gray-500 font-bold">x{item.quantity}</p>
                                                    </div>
                                                ))}
                                             </div>
                                        </div>
                                        <div className="md:text-right mt-4 md:mt-0">
                                            <p className="text-sm text-gray-500">Total Value</p>
                                            <p className="text-3xl font-extrabold text-gray-900">₹{po.total.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
