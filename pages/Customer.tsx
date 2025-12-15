import React, { useEffect, useState } from 'react';
import { SalesService, CatalogService, EngagementService } from '../services/storeService';
import { locateOrderDestination } from '../services/geminiService';
import { Order, Product } from '../types';
import { 
  Package, MapPin, User as UserIcon, Heart, Truck, CheckCircle, Clock, 
  Map as MapIcon, ExternalLink, Gift, RotateCcw, MessageCircle, Settings, 
  LogOut, ChevronRight, AlertCircle 
} from 'lucide-react';
import { useWishlist, useAuth } from '../App';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';

export const Customer: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const { wishlist } = useWishlist();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'returns' | 'rewards' | 'support' | 'settings'>('overview');
  
  // Map State
  const [activeMapOrder, setActiveMapOrder] = useState<string | null>(null);
  const [mapData, setMapData] = useState<{title: string, uri: string} | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // Rewards Mock Data
  const rewardsPoints = 450;
  const nextRewardTier = 500;

  useEffect(() => {
    const fetchOrders = async () => {
        if (user) {
            const userOrders = await SalesService.getOrdersByUser(user.id);
            setOrders(userOrders);
        }
    };
    fetchOrders();
  }, [user]);

  useEffect(() => {
    const fetchWishlist = async () => {
        if (wishlist.length > 0) {
            const allProducts = await CatalogService.getProducts();
            setWishlistProducts(allProducts.filter(p => wishlist.includes(p.id)));
        } else {
            setWishlistProducts([]);
        }
    };
    fetchWishlist();
  }, [wishlist]);

  const getTrackingNumber = (id: string) => `TRK-${id.slice(-9).toUpperCase()}`;

  const getProgressWidth = (status: string) => {
    switch (status) {
        case 'pending': return '15%';
        case 'processing': return '60%';
        case 'delivered': return '100%';
        default: return '0%';
    }
  };

  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'pending': return 'Order Placed';
          case 'processing': return 'Shipped / Out for Delivery';
          case 'delivered': return 'Delivered';
          case 'cancelled': return 'Cancelled';
          default: return status;
      }
  };

  const handleToggleMap = async (order: Order) => {
    if (activeMapOrder === order.id) {
        setActiveMapOrder(null);
        setMapData(null);
        return;
    }
    
    setActiveMapOrder(order.id);
    setLoadingMap(true);
    setMapData(null);

    const addressStr = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`;
    const result = await locateOrderDestination(addressStr);
    
    setMapData(result);
    setLoadingMap(false);
  };

  if (!user) return <div>Loading...</div>;

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === id 
            ? 'bg-brand-50 text-brand-700' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
          <Icon size={18} />
          {label}
          {activeTab === id && <ChevronRight size={16} className="ml-auto" />}
      </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                        <UserIcon className="h-8 w-8 text-brand-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h1>
                        <p className="text-sm text-gray-500">{user.email} • <span className="text-brand-600 font-medium">{rewardsPoints} Points</span></p>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 space-y-1">
                        <NavItem id="overview" icon={Package} label="Overview" />
                        <NavItem id="orders" icon={Truck} label="My Orders" />
                        <NavItem id="returns" icon={RotateCcw} label="Returns" />
                        <NavItem id="rewards" icon={Gift} label="My Rewards" />
                        <NavItem id="support" icon={MessageCircle} label="Support Tickets" />
                        <NavItem id="settings" icon={Settings} label="Account Settings" />
                        <div className="border-t border-gray-100 my-2 pt-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <LogOut size={18} /> Log Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-white/20 rounded-lg"><Gift size={20}/></div>
                                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Silver Tier</span>
                                    </div>
                                    <h3 className="text-3xl font-bold">{rewardsPoints}</h3>
                                    <p className="text-brand-100 text-sm">Loyalty Points</p>
                                    <div className="mt-4 w-full bg-black/20 rounded-full h-1.5">
                                        <div className="bg-white h-1.5 rounded-full" style={{ width: `${(rewardsPoints / nextRewardTier) * 100}%` }}></div>
                                    </div>
                                    <p className="text-xs mt-2 text-brand-100">{nextRewardTier - rewardsPoints} points to Gold</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20}/></div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">{orders.filter(o => o.status !== 'cancelled').length}</h3>
                                    <p className="text-gray-500 text-sm">Total Orders</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MessageCircle size={20}/></div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">0</h3>
                                    <p className="text-gray-500 text-sm">Active Support Tickets</p>
                                </div>
                            </div>

                            {/* Recent Order */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-900">Recent Activity</h3>
                                    <button onClick={() => setActiveTab('orders')} className="text-sm text-brand-600 font-medium hover:underline">View All</button>
                                </div>
                                <div className="p-0">
                                    {orders.slice(0, 1).map(order => (
                                        <div key={order.id} className="p-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`p-2 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    {order.status === 'delivered' ? <CheckCircle size={24}/> : <Truck size={24}/>}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Order #{order.id.slice(-6)}</p>
                                                    <p className="text-sm text-gray-500">{getStatusLabel(order.status)}</p>
                                                </div>
                                                <div className="ml-auto font-bold">₹{order.total.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded p-3 text-sm text-gray-600">
                                                {order.items.map(i => i.name).join(', ')}
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length === 0 && <div className="p-6 text-center text-gray-500">No recent activity.</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'orders' || activeTab === 'overview') && activeTab !== 'overview' && (
                        <div className="space-y-6">
                             <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                             {orders.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <p className="text-gray-500">You haven't placed any orders yet.</p>
                                    <Link to="/shop" className="text-brand-600 font-medium mt-2 inline-block">Start Shopping</Link>
                                </div>
                             ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex gap-6">
                                                <div>
                                                    <span className="block text-xs text-gray-500 uppercase">Order Placed</span>
                                                    <span className="text-sm font-medium text-gray-900">{new Date(order.date).toLocaleDateString()}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-500 uppercase">Total</span>
                                                    <span className="text-sm font-medium text-gray-900">₹{order.total.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-500 uppercase">Ship To</span>
                                                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                 <span className="text-xs text-gray-500 mb-1">Order # {order.id.slice(-6)}</span>
                                                 <Link to={`/product/${order.items[0].id}`} className="text-sm text-brand-600 hover:underline">View Details</Link>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="h-16 w-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border border-gray-200">
                                                    <img src={order.items[0].image} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{order.items[0].name}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{order.items.length > 1 ? `and ${order.items.length - 1} other items` : `Qty: ${order.items[0].quantity}`}</p>
                                                    <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
                                                </div>
                                                {order.status !== 'cancelled' && (
                                                    <button 
                                                        onClick={() => handleToggleMap(order)}
                                                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                                            activeMapOrder === order.id 
                                                            ? 'bg-brand-50 border-brand-200 text-brand-700' 
                                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <MapIcon size={16} />
                                                        {activeMapOrder === order.id ? 'Hide Map' : 'Track Package'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tracking Progress */}
                                            {order.status !== 'cancelled' && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <div className="relative">
                                                        <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-gray-200">
                                                            <div style={{ width: getProgressWidth(order.status) }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-1000 ease-out"></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <span>Ordered</span>
                                                            <span>Shipped</span>
                                                            <span className={order.status === 'delivered' ? 'text-brand-600 font-bold' : ''}>Delivered</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Map Embed */}
                                            {activeMapOrder === order.id && (
                                                <div className="mt-4 animate-fade-in border border-gray-200 rounded-lg overflow-hidden">
                                                    {loadingMap ? (
                                                        <div className="h-64 bg-gray-50 flex items-center justify-center animate-pulse">
                                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Truck className="animate-bounce"/> Locating shipment...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                             <div className="absolute top-0 left-0 right-0 p-2 bg-white/90 backdrop-blur-sm border-b border-gray-200 flex justify-between items-center z-10">
                                                                <span className="text-xs text-gray-800 font-medium flex items-center gap-1">
                                                                    <MapPin size={12} className="text-red-500" /> {mapData?.title || 'Location Identified'}
                                                                </span>
                                                                {mapData && (
                                                                    <a href={mapData.uri} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                                                                        Open <ExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <iframe 
                                                                width="100%" 
                                                                height="300" 
                                                                style={{border: 0}} 
                                                                loading="lazy" 
                                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                                                title="Order Location"
                                                            ></iframe>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                             )}
                        </div>
                    )}

                    {activeTab === 'returns' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Returns & Refunds</h2>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="text-center py-8">
                                    <RotateCcw className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900">No eligible items for return</h3>
                                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                        You can request a return within 24 hours of delivery if freshness is compromised. 
                                        Select a delivered order to start a claim.
                                    </p>
                                </div>
                                <div className="mt-6 border-t border-gray-100 pt-6">
                                    <h4 className="font-medium text-gray-900 mb-4">Eligible Orders</h4>
                                    {orders.filter(o => o.status === 'delivered').length > 0 ? (
                                        orders.filter(o => o.status === 'delivered').map(order => (
                                            <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-2">
                                                <div className="flex items-center gap-3">
                                                    <img src={order.items[0].image} className="h-10 w-10 rounded object-cover" alt=""/>
                                                    <div>
                                                        <p className="font-medium text-sm">Order #{order.id.slice(-6)}</p>
                                                        <p className="text-xs text-gray-500">Delivered on {new Date(order.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button className="text-sm font-medium text-brand-600 hover:text-brand-700">Request Return</button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No delivered orders available for return.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Dietanic Rewards</h2>
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 bg-white/5 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-gray-400 text-sm font-medium tracking-wider uppercase">Current Balance</p>
                                            <h3 className="text-5xl font-bold mt-2">{rewardsPoints}</h3>
                                        </div>
                                        <Gift size={48} className="text-brand-500" />
                                    </div>
                                    <p className="mt-2 text-sm text-gray-400">Points expire in 365 days</p>
                                    <div className="mt-8 pt-8 border-t border-gray-700 flex gap-8">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Tier</p>
                                            <p className="font-bold">Silver Member</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Next Reward</p>
                                            <p className="font-bold">₹500 Voucher (50 pts away)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mt-8">Redeem Points</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[100, 200, 500].map(val => (
                                    <div key={val} className="border border-gray-200 p-4 rounded-lg flex justify-between items-center bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-brand-50 text-brand-600 rounded-lg font-bold">₹{val}</div>
                                            <div>
                                                <p className="font-medium text-sm">Shopping Voucher</p>
                                                <p className="text-xs text-gray-500">{val * 10} Points</p>
                                            </div>
                                        </div>
                                        <button 
                                            disabled={rewardsPoints < val * 10}
                                            className={`px-3 py-1.5 rounded text-xs font-bold ${
                                                rewardsPoints >= val * 10 
                                                ? 'bg-brand-600 text-white hover:bg-brand-700' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            Redeem
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Customer Support</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-brand-50 border border-brand-100 rounded-xl p-6">
                                    <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <MessageCircle className="text-brand-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Live Chat</h3>
                                    <p className="text-sm text-gray-600 mt-2 mb-4">Chat with our nutritionists and support team in real-time.</p>
                                    <button onClick={() => { /* Trigger widget via global event or focus */ document.querySelector<HTMLElement>('.fixed.bottom-6.right-6 button')?.click() }} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 w-full">
                                        Start Conversation
                                    </button>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <AlertCircle className="text-gray-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Report an Issue</h3>
                                    <p className="text-sm text-gray-600 mt-2 mb-4">Problem with an order? Create a ticket and we'll resolve it.</p>
                                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 w-full">
                                        Create Ticket
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-gray-900 mt-6">Recent Tickets</h3>
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No active support tickets found.
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                             <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                             
                             <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                                 <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="text-gray-400" size={18} /> Saved Addresses
                                 </h3>
                                 <div className="space-y-4">
                                     {user.addresses.map((addr, idx) => (
                                         <div key={idx} className="border border-gray-200 rounded-lg p-4 relative flex justify-between items-center group">
                                             <div>
                                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                <p className="text-sm text-gray-600">{addr.street}</p>
                                                <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                                             </div>
                                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button className="text-xs text-brand-600 font-medium hover:underline">Edit</button>
                                                 <button className="text-xs text-red-600 font-medium hover:underline">Delete</button>
                                             </div>
                                             {idx === 0 && (
                                                 <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">Default</span>
                                             )}
                                         </div>
                                     ))}
                                     <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-brand-500 hover:text-brand-600 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                         <Plus size={16} /> Add New Address
                                     </button>
                                 </div>
                              </div>
                              
                              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                                     <Heart className="text-gray-400" size={18} /> Wishlist
                                  </h3>
                                   {wishlistProducts.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {wishlistProducts.map(product => (
                                            <div key={product.id} className="flex gap-3 border border-gray-100 p-2 rounded-lg">
                                                <img src={product.image} className="h-16 w-16 object-cover rounded" alt=""/>
                                                <div>
                                                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                                                    <p className="text-xs text-gray-500">₹{product.price}</p>
                                                    <Link to={`/product/${product.id}`} className="text-xs text-brand-600 font-medium hover:underline mt-1 block">View</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No items saved.</p>
                                )}
                              </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
import { Plus } from 'lucide-react';