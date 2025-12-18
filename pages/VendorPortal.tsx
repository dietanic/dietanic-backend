

import React, { useState, useEffect } from 'react';
import { CatalogService, APIGateway } from '../services/storeService'; // Use APIGateway
import { PurchaseOrder, Bill } from '../types';
import { Truck, Package, MessageSquare, Upload, CheckCircle, Clock, FileText, Send, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VendorPortal: React.FC = () => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [commentInput, setCommentInput] = useState('');

    useEffect(() => {
        const load = async () => {
            const data = await CatalogService.getPurchaseOrders();
            // For demo, assume logged in vendor is 'v1'
            setOrders(data.filter(o => o.vendorId === 'v1'));
            setLoading(false);
        };
        load();
    }, []);

    const handleUploadInvoice = async (po: PurchaseOrder) => {
        // Simulation of file upload logic
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = async (e: any) => {
            const file = e.target.files[0];
            if(file) {
                alert(`Uploaded ${file.name}. Invoice Draft created.`);
                // Create Draft Bill
                await APIGateway.Finance.Payables.createBill({ // Use APIGateway
                    id: `bill_${Date.now()}`,
                    vendorId: po.vendorId,
                    vendorName: po.vendorName,
                    date: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                    amount: po.total,
                    status: 'pending_approval',
                    items: po.items.map(i => ({ description: i.productName, amount: i.cost * i.quantity })),
                    isRecurring: false,
                    payments: [],
                    balanceDue: po.total,
                    attachments: [file.name]
                });
            }
        };
        fileInput.click();
    };

    if (loading) return <div className="p-12 text-center">Loading Vendor Hub...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg text-white">
                            <Truck size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Vendor Connect</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">Fresh Farms Co</p>
                            <p className="text-xs text-gray-500">Supplier ID: V-1001</p>
                        </div>
                        <Link to="/" className="text-sm text-purple-600 font-medium hover:underline">Exit</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 space-y-1">
                            <button 
                                onClick={() => setActiveTab('orders')} 
                                className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 ${activeTab === 'orders' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Package size={18} /> Purchase Orders
                            </button>
                            <button 
                                onClick={() => setActiveTab('invoices')} 
                                className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-3 ${activeTab === 'invoices' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <FileText size={18} /> Invoices & Payments
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-9 space-y-6">
                        {activeTab === 'orders' && (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Incoming Orders</h2>
                                {orders.map(po => (
                                    <div key={po.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
                                        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">PO #{po.id.slice(-6)}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{po.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Date: {new Date(po.date).toLocaleDateString()} • Expected: {new Date(po.expectedDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-gray-900">₹{po.total.toLocaleString()}</p>
                                                <button onClick={() => handleUploadInvoice(po)} className="text-sm text-purple-600 font-medium flex items-center justify-end gap-1 hover:underline mt-1">
                                                    <Upload size={14}/> Upload Invoice
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-gray-50">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Items</h4>
                                            <div className="space-y-2">
                                                {po.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                                        <span>{item.productName}</span>
                                                        <span className="font-mono">{item.quantity} units</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Communication Hub */}
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><MessageSquare size={14}/> Vendor Chat</h4>
                                                <div className="bg-white border border-gray-200 rounded-lg p-3 min-h-[100px] mb-2 text-sm text-gray-500 italic">
                                                    No messages yet. Start a conversation with Dietanic procurement team.
                                                </div>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm" />
                                                    <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"><Send size={16}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {activeTab === 'invoices' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                                <FileText size={48} className="mx-auto text-gray-300 mb-4"/>
                                <h3 className="text-lg font-bold text-gray-900">Invoice History</h3>
                                <p className="text-gray-500">Track status of uploaded invoices and payments here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};