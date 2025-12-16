
import React, { useState, useEffect, useRef } from 'react';
import { SalesService, IdentityService } from '../../services/storeService';
import { Order, User, CartItem } from '../../types';
import { Filter, Calendar, Loader, XCircle, Search, AlertCircle, Scan, CheckCircle, Package, ArrowRight, Box } from 'lucide-react';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');

  // Picking Mode State
  const [pickingOrder, setPickingOrder] = useState<Order | null>(null);
  const [pickedItems, setPickedItems] = useState<Record<string, number>>({}); // itemId -> qty picked
  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-focus scanner input when picking starts
  useEffect(() => {
      if (pickingOrder && scanInputRef.current) {
          scanInputRef.current.focus();
      }
  }, [pickingOrder]);

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
          if (reason === null) return;
          cancellationReason = reason || "No reason provided";
      }

      const updatedOrder = { 
          ...order, 
          status: newStatus as Order['status'],
          cancellationReason: cancellationReason 
      };
      
      await SalesService.updateOrder(updatedOrder);
      loadData();
  };

  // --- Picking Logic ---
  const startPicking = (order: Order) => {
      setPickingOrder(order);
      setPickedItems({});
      setScanInput('');
  };

  const handleScan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!pickingOrder || !scanInput.trim()) return;

      const sku = scanInput.trim().toLowerCase();
      // Find item in order matching SKU or Name (fallback for demo)
      const itemToPick = pickingOrder.items.find(item => 
          (item.sku && item.sku.toLowerCase() === sku) || 
          item.name.toLowerCase() === sku || 
          item.id === sku
      );

      if (itemToPick) {
          const currentPicked = pickedItems[itemToPick.cartItemId] || 0;
          if (currentPicked < itemToPick.quantity) {
              setPickedItems(prev => ({
                  ...prev,
                  [itemToPick.cartItemId]: currentPicked + 1
              }));
              setScanInput(''); // Clear for next scan
          } else {
              alert(`Item "${itemToPick.name}" is already fully picked!`);
          }
      } else {
          alert("Item not found in this order! Check SKU.");
      }
  };

  const isOrderFullyPicked = () => {
      if (!pickingOrder) return false;
      return pickingOrder.items.every(item => (pickedItems[item.cartItemId] || 0) === item.quantity);
  };

  const completePicking = async () => {
      if (pickingOrder && isOrderFullyPicked()) {
          await handleUpdateStatus(pickingOrder, 'processing'); // Or delivered
          setPickingOrder(null);
      }
  };

  // --- Filter Logic ---
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
      const customer = users.find(u => u.id === o.userId);
      const customerName = customer ? customer.name.toLowerCase() : 'unknown';
      const matchesName = customerNameFilter 
        ? customerName.includes(customerNameFilter.toLowerCase()) || o.id.includes(customerNameFilter)
        : true;

      return matchesStatus && matchesStart && matchesEnd && matchesName;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) return <div className="p-8 flex justify-center"><Loader className="animate-spin text-brand-600"/></div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden animate-fade-in relative">
        {/* Picking Modal Overlay */}
        {pickingOrder && (
            <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 bg-brand-600 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2"><Scan /> Picking Mode</h2>
                            <p className="text-brand-100 text-sm">Order #{pickingOrder.id.slice(-6)} • {pickingOrder.items.length} Line Items</p>
                        </div>
                        <button onClick={() => setPickingOrder(null)} className="p-2 hover:bg-brand-700 rounded-full"><XCircle /></button>
                    </div>
                    
                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                        <form onSubmit={handleScan} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                                <input 
                                    ref={scanInputRef}
                                    type="text" 
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    placeholder="Scan Item SKU or Barcode..."
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none text-lg font-mono"
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="bg-gray-800 text-white px-6 rounded-lg font-bold">Enter</button>
                        </form>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {pickingOrder.items.map((item) => {
                            const pickedQty = pickedItems[item.cartItemId] || 0;
                            const isComplete = pickedQty === item.quantity;
                            return (
                                <div key={item.cartItemId} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isComplete ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 bg-white rounded-lg border border-gray-200 p-1">
                                            <img src={item.image} className="w-full h-full object-cover rounded" alt=""/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-sm text-gray-500 font-mono">SKU: {item.sku || 'N/A'}</p>
                                            {item.selectedVariation && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">{item.selectedVariation.name}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold flex items-center justify-end gap-2">
                                            <span className={isComplete ? 'text-green-600' : 'text-gray-900'}>{pickedQty}</span>
                                            <span className="text-gray-400 text-lg">/</span>
                                            <span className="text-gray-600">{item.quantity}</span>
                                        </div>
                                        <span className={`text-xs font-bold uppercase ${isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                                            {isComplete ? 'Picked' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <button 
                            onClick={completePicking}
                            disabled={!isOrderFullyPicked()}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                isOrderFullyPicked() 
                                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg transform hover:-translate-y-1' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isOrderFullyPicked() ? <><CheckCircle /> Complete & Mark Processed</> : 'Scan all items to continue'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Filters Header */}
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
                            
                            <div className="flex gap-2 items-center">
                                {/* Pick Button for Pending Orders */}
                                {order.status === 'pending' && (
                                    <button 
                                        onClick={() => startPicking(order)}
                                        className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-brand-700 flex items-center gap-2 shadow-sm animate-pulse"
                                    >
                                        <Scan size={14} /> Start Picking
                                    </button>
                                )}

                                <div className="h-4 w-px bg-gray-300 mx-2"></div>

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
