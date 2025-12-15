
import React, { useState, useEffect } from 'react';
import { SalesService, IdentityService } from '../../services/storeService';
// Removed explicit email import
import { Order, User } from '../../types';
import { Filter, Calendar, Loader, XCircle, Search, AlertCircle } from 'lucide-react';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [o, u] = await Promise.all([SalesService.getOrders(), IdentityService.getUsers()]);
    setOrders(o);
    setUsers(u);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (order: Order, newStatus: string) => {
      let cancellationReason = undefined;

      if (newStatus === 'cancelled') {
          const reason = prompt("Please enter a reason for cancellation:", "Out of stock / Customer Request");
          if (reason === null) return; // User cancelled the prompt
          cancellationReason = reason || "No reason provided";
      }

      const updatedOrder = { 
          ...order, 
          status: newStatus as Order['status'],
          cancellationReason: cancellationReason 
      };
      
      // Update via Sales Service. 
      // This triggers ORDER_UPDATED event -> Notification Service picks it up.
      await SalesService.updateOrder(updatedOrder);
      
      loadData();
  };

  const clearFilters = () => {
      setStatusFilter('all');
      setStartDate('');
      setEndDate('');
      setCustomerNameFilter('');
  };

  const filteredOrders = orders.filter(o => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      
      const orderDate = new Date(o.date).setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

      const matchesStart = start ? orderDate >= start : true;
      const matchesEnd = end ? orderDate <= end : true;

      // Name Filter Logic
      const customer = users.find(u => u.id === o.userId);
      const customerName = customer ? customer.name.toLowerCase() : 'unknown';
      const matchesName = customerNameFilter 
        ? customerName.includes(customerNameFilter.toLowerCase()) || o.id.includes(customerNameFilter)
        : true;

      return matchesStatus && matchesStart && matchesEnd && matchesName;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) return <div className="p-8 flex justify-center"><Loader className="animate-spin text-brand-600"/></div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden animate-fade-in">
        {/* Advanced Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                            placeholder="Search Customer Name or Order ID..."
                            value={customerNameFilter}
                            onChange={(e) => setCustomerNameFilter(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full sm:w-auto rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm border focus:border-brand-500 focus:outline-none"
                    >
                        <option value="all">Status: All</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">From:</span>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="block rounded-md border-gray-300 py-1.5 px-2 text-sm border focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">To:</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="block rounded-md border-gray-300 py-1.5 px-2 text-sm border focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                </div>

                {(statusFilter !== 'all' || startDate || endDate || customerNameFilter) && (
                    <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                        <XCircle size={14} /> Clear All Filters
                    </button>
                )}
            </div>
        </div>

        <ul className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
                const customer = users.find(u => u.id === order.userId);
                return (
                    <li key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Order #{order.id.slice(-6)} 
                                    <span className="text-sm font-normal text-gray-500 ml-2">by {customer?.name || 'Unknown'}</span>
                                </h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                                    {new Date(order.date).toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{order.items.length} Items</p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-md p-4 mb-4 border border-gray-100">
                            <ul className="space-y-2">
                                {order.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{item.quantity}x {item.name} {item.selectedPlan ? `(${item.selectedPlan.duration})` : ''}</span>
                                        <span className="text-gray-900 font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            {order.status === 'cancelled' && order.cancellationReason && (
                                <div className="mt-3 pt-3 border-t border-gray-200 flex items-start gap-2">
                                    <AlertCircle size={16} className="text-red-500 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-red-600 uppercase">Cancellation Reason:</span>
                                        <p className="text-sm text-red-800">{order.cancellationReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-md p-3 gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium uppercase ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {['pending', 'processing', 'delivered', 'cancelled'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdateStatus(order, status)}
                                        disabled={order.status === status}
                                        className={`text-xs px-2 py-1 rounded border capitalize ${
                                            order.status === status 
                                            ? 'bg-gray-100 text-gray-400 cursor-default' 
                                            : 'bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </li>
                );
            })}
            {filteredOrders.length === 0 && <li className="p-12 text-center text-gray-500 italic">No orders found matching your filters.</li>}
        </ul>
    </div>
  );
};
