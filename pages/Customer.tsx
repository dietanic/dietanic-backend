

import React, { useEffect, useState } from 'react';
import { SalesService, CatalogService, EngagementService, CustomerService, WalletService, IdentityService, APIGateway } from '../services/storeService';
import { locateOrderDestination } from '../services/gemini'; // Updated import
import { Order, Product, CustomerProfile, WalletTransaction, Invoice, Quote } from '../types';
import { 
  Package, MapPin, User as UserIcon, Heart, Truck, CheckCircle, Clock, 
  Map as MapIcon, ExternalLink, Gift, RotateCcw, MessageCircle, Settings, 
  LogOut, ChevronRight, AlertCircle, MessageSquare, Plus, Wallet, CreditCard, ArrowDownLeft, FileText, Search, History, Briefcase, ThumbsUp, XCircle, Check, Filter, X
} from 'lucide-react';
import { useWishlist, useAuth } from '../App';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';

export const Customer: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const { wishlist } = useWishlist();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'business' | 'documents' | 'returns' | 'wallet' | 'rewards' | 'support' | 'settings' | 'wishlist'>('overview');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Order Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Wallet State
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Profile Settings State
  const [settingsForm, setSettingsForm] = useState({
      name: '',
      email: '',
      countryCode: '+91',
      phone: ''
  });

  // Map State
  const [activeMapOrder, setActiveMapOrder] = useState<string | null>(null);
  const [mapData, setMapData] = useState<{title: string, uri: string} | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  // Rewards Mock Data
  const rewardsPoints = 450;
  const nextRewardTier = 500;

  useEffect(() => {
    const fetchData = async () => {
        if (user) {
            const [userOrders, custProfile, allQuotes] = await Promise.all([
                SalesService.getOrdersByUser(user.id),
                CustomerService.ensureCustomerProfile(user),
                APIGateway.Finance.Receivables.getQuotes() // Use APIGateway
            ]);
            setOrders(userOrders);
            setProfile(custProfile);
            setQuotes(allQuotes.filter(q => q.customerName.includes(user.name) || q.id.includes(user.id)));

            let phone = custProfile.phone || user.phone || '';
            let code = '+91';
            
            if (phone.includes(' ')) {
                const parts = phone.split(' ');
                if (parts.length > 1) {
                    code = parts[0];
                    phone = parts.slice(1).join('');
                }
            } else if (phone.startsWith('+')) {
                if(phone.startsWith('+91')) { code = '+91'; phone = phone.slice(3); }
                else if(phone.startsWith('+1')) { code = '+1'; phone = phone.slice(2); }
                else if(phone.startsWith('+44')) { code = '+44'; phone = phone.slice(3); }
                else if(phone.startsWith('+971')) { code = '+971'; phone = phone.slice(4); }
            }

            setSettingsForm({
                name: user.name,
                email: user.email,
                countryCode: code,
                phone: phone.replace(/\D/g,'')
            });
        }
    };
    fetchData();
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

  useEffect(() => {
      const fetchRecentlyViewed = async () => {
          const recentIds = await EngagementService.getRecentlyViewed();
          if (recentIds.length > 0) {
              const allProducts = await CatalogService.getProducts();
              setRecentlyViewed(allProducts.filter(p => recentIds.includes(p.id)));
          }
      };
      fetchRecentlyViewed();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile || !user) return;
      
      const fullPhone = `${settingsForm.countryCode} ${settingsForm.phone}`;
      const updatedProfile = { ...profile, phone: fullPhone };
      const updatedUser = { ...user, name: settingsForm.name, phone: fullPhone };

      await CustomerService.updateCustomer(updatedProfile);
      await IdentityService.updateUser(updatedUser);
      
      setProfile(updatedProfile);
      alert('Profile updated successfully!');
  };

  const handleRedeemGiftCard = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!redeemCode.trim()) return;
      setIsRedeeming(true);
      setRedeemStatus(null);
      
      try {
          const amount = await WalletService.redeemGiftCard(redeemCode.trim(), user.id);
          setRedeemStatus({ message: `Success! ₹${amount} added to your wallet.`, type: 'success' });
          setRedeemCode('');
          const updatedProfile = await CustomerService.ensureCustomerProfile(user);
          setProfile(updatedProfile);
      } catch (err: any) {
          setRedeemStatus({ message: err.message || 'Failed to redeem code', type: 'error' });
      } finally {
          setIsRedeeming(false);
      }
  };

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

  const filteredOrders = orders.filter(order => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
          order.id.toLowerCase().includes(q) ||
          order.items.some(item => item.name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const orderDate = new Date(order.date).setHours(0,0,0,0);
      const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
      const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
      const matchesDateRange = (!start || orderDate >= start) && (!end || orderDate <= end);

      return matchesSearch && matchesStatus && matchesDateRange;
  });

  const filteredTransactions = (profile?.walletHistory || []).filter(txn => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return txn.description.toLowerCase().includes(q);
  });

  const filteredInvoices = (profile?.billing.invoices || []).filter(inv => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return inv.id.toLowerCase().includes(q) || inv.status.toLowerCase().includes(q);
  });

  const filteredWishlist = wishlistProducts.filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  if (!user) return <div>Loading...</div>;

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
      <button
        onClick={() => { setActiveTab(id); setSearchQuery(''); setStatusFilter('all'); setStartDate(''); setEndDate(''); }}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-w-max lg:w-full ${
            activeTab === id 
            ? 'bg-brand-50 text-brand-700' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
          <Icon size={18} />
          {label}
          {activeTab === id && <ChevronRight size={16} className="ml-auto hidden lg:block" />}
      </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
                <div className="flex items-center gap-4">
                    {user.avatar ? (
                        <div className="h-16 w-16 rounded-full border-4 border-white shadow-sm overflow-hidden">
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <UserIcon className="h-8 w-8 text-brand-600" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h1>
                        <p className="text-sm text-gray-500">{user.email} • <span className="text-brand-600 font-medium">{rewardsPoints} Points</span></p>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-1 scrollbar-hide">
                        <NavItem id="overview" icon={Package} label="Overview" />
                        <NavItem id="business" icon={Briefcase} label="Business Hub (B2B)" />
                        <NavItem id="orders" icon={Truck} label="My Orders" />
                        <NavItem id="wishlist" icon={Heart} label="My Wishlist" />
                        <NavItem id="documents" icon={FileText} label="Documents & Billing" />
                        <NavItem id="wallet" icon={Wallet} label="Wallet & Cards" />
                        <NavItem id="returns" icon={RotateCcw} label="Returns" />
                        <NavItem id="rewards" icon={Gift} label="My Rewards" />
                        <NavItem id="support" icon={MessageCircle} label="Support Tickets" />
                        <NavItem id="settings" icon={Settings} label="Account Settings" />
                        
                        <div className="border-l lg:border-l-0 lg:border-t border-gray-100 mx-2 lg:mx-0 my-0 lg:my-2 pt-0 lg:pt-2 flex items-center lg:block">
                            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap">
                                <LogOut size={18} /> <span className="hidden lg:inline">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    {['orders', 'documents', 'wallet', 'support', 'wishlist'].includes(activeTab) && (
                        <div className="mb-6 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm shadow-sm"
                                    placeholder={`Search ${activeTab === 'wallet' ? 'transactions' : activeTab === 'documents' ? 'invoices' : activeTab === 'wishlist' ? 'wishlist' : 'orders'}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {activeTab === 'orders' && (
                                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                        <select 
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="w-full text-xs font-bold border border-gray-200 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                                        <input 
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full text-xs font-bold border border-gray-200 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                                        <input 
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full text-xs font-bold border border-gray-200 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            onClick={() => { setStatusFilter('all'); setStartDate(''); setEndDate(''); }}
                                            className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg hover:bg-red-50 transition-all border border-gray-200"
                                            title="Clear Filters"
                                        >
                                            <X size={18}/>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-white/20 rounded-lg"><Wallet size={20}/></div>
                                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Available Balance</span>
                                    </div>
                                    <h3 className="text-3xl font-bold">₹{profile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                                    <p className="text-brand-100 text-sm">Store Credit</p>
                                    <button onClick={() => setActiveTab('wallet')} className="mt-4 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">
                                        Top Up / View History
                                    </button>
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
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Gift size={20}/></div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">{rewardsPoints}</h3>
                                    <p className="text-gray-500 text-sm">Loyalty Points</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-gray-900">Recent Order Activity</h3>
                                    <button onClick={() => setActiveTab('orders')} className="text-sm text-brand-600 font-medium hover:underline">View All</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {orders.slice(0, 3).map(order => (
                                        <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                        {order.status === 'delivered' ? <CheckCircle size={20}/> : <Truck size={20}/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Order #{order.id.slice(-6)}</p>
                                                        <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-900">₹{order.total.toFixed(2)}</div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase mt-1 ${
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 truncate">
                                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length === 0 && <div className="p-6 text-center text-gray-500">No recent activity.</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'business' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">B2B Dashboard</h2>
                                <p className="text-gray-500 text-sm">Manage commercial quotes and large volume orders.</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-bold text-gray-900">Active Quotes</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {quotes.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">No active quotes found.</div>
                                    ) : (
                                        quotes.map(quote => (
                                            <div key={quote.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Quote #{quote.id.slice(-6)}</h4>
                                                        <p className="text-xs text-gray-500">Expired: {new Date(quote.expiryDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xl font-bold text-brand-600">₹{quote.total.toLocaleString()}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                                                            quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                            quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>{quote.status}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                                                    {quote.items.map((i, idx) => (
                                                        <div key={idx} className="flex justify-between border-b border-gray-200 last:border-0 py-1">
                                                            <span>{i.quantity}x {i.name}</span>
                                                            <span className="font-medium">₹{i.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {quote.status === 'sent' && (
                                                    <div className="flex gap-3">
                                                        <button 
                                                            onClick={async () => {
                                                                await APIGateway.Finance.Receivables.convertQuoteToSO(quote.id); // Use APIGateway
                                                                alert("Quote Accepted! Order processed.");
                                                            }}
                                                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                                                        >
                                                            <ThumbsUp size={16}/> Accept Quote
                                                        </button>
                                                        <button className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg font-bold hover:bg-red-50 flex items-center justify-center gap-2">
                                                            <XCircle size={16}/> Reject
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Negotiation</p>
                                                    <div className="flex gap-2">
                                                        <input type="text" placeholder="Add a comment or request changes..." className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"/>
                                                        <button className="bg-gray-900 text-white px-3 py-1 rounded text-sm">Post</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Digital Wallet & Gift Cards</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Wallet size={100} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-gray-400 text-sm font-medium tracking-wider uppercase mb-1">Available Balance</p>
                                        <h3 className="text-4xl font-bold mb-6">₹{profile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                                        <div className="flex gap-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><CreditCard size={12}/> Store Credit</span>
                                        </div>
                                        <Link to="/shop" className="mt-8 block text-center w-full bg-white text-gray-900 py-2 rounded font-bold hover:bg-gray-100 transition-colors">
                                            Buy Gift Card
                                        </Link>
                                    </div>
                                </div>
                                <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ArrowDownLeft size={20} className="text-brand-600"/> Deposit Funds</h3>
                                    <p className="text-sm text-gray-600 mb-4">Have a gift card code? Enter it below to add funds to your wallet instantly.</p>
                                    <form onSubmit={handleRedeemGiftCard} className="max-w-md">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gift Card Code</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="GC-XXXX-XXXX" 
                                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none uppercase font-mono"
                                                value={redeemCode}
                                                onChange={(e) => setRedeemCode(e.target.value)}
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={isRedeeming || !redeemCode}
                                                className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isRedeeming ? '...' : 'Redeem'}
                                            </button>
                                        </div>
                                        {redeemStatus && (
                                            <p className={`mt-2 text-sm ${redeemStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {redeemStatus.message}
                                            </p>
                                        )}
                                    </form>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="font-bold text-gray-900">Wallet History</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {filteredTransactions.length > 0 ? (
                                        [...filteredTransactions].reverse().map(txn => (
                                            <div key={txn.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${txn.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                        {txn.type === 'deposit' ? <ArrowDownLeft size={16}/> : <CreditCard size={16}/>}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                                                        <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {txn.amount > 0 ? '+' : ''}₹{txn.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 italic">No transactions match your search.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Settings className="text-gray-500"/> Account Settings
                            </h2>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="grid grid-cols-1 gap-6 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input type="email" value={settingsForm.email} disabled className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={settingsForm.countryCode}
                                                onChange={e => setSettingsForm({...settingsForm, countryCode: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                            >
                                                <option value="+91">🇮🇳 +91</option>
                                                <option value="+1">🇺🇸 +1</option>
                                                <option value="+44">🇬🇧 +44</option>
                                                <option value="+971">🇦🇪 +971</option>
                                            </select>
                                            <input
                                                type="tel"
                                                value={settingsForm.phone}
                                                onChange={e => setSettingsForm({...settingsForm, phone: e.target.value.replace(/\D/g,'')})}
                                                placeholder="9876543210"
                                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors w-fit shadow-md">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                             <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">My Order History</h2>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filteredOrders.length} Results</span>
                             </div>

                             {filteredOrders.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <p className="text-gray-500">
                                        {searchQuery || statusFilter !== 'all' || startDate || endDate ? 'No orders match your filters.' : "You haven't placed any orders yet."}
                                    </p>
                                    {(!searchQuery && statusFilter === 'all' && !startDate && !endDate) && <Link to="/shop" className="text-brand-600 font-medium mt-2 inline-block">Start Shopping</Link>}
                                </div>
                             ) : (
                                filteredOrders.map(order => (
                                    <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-brand-200 transition-all group">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50 group-hover:bg-brand-50/20 flex flex-wrap justify-between items-center gap-4 transition-colors">
                                            <div className="flex gap-6">
                                                <div>
                                                    <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">Order Placed</span>
                                                    <span className="text-sm font-bold text-gray-700">{new Date(order.date).toLocaleDateString()}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">Total</span>
                                                    <span className="text-sm font-bold text-brand-700">₹{order.total.toFixed(2)}</span>
                                                </div>
                                                <div className="hidden sm:block">
                                                    <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest">Order ID</span>
                                                    <span className="text-sm font-mono text-gray-500">#{order.id.slice(-6)}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                 <Link to={`/product/${order.items[0].id}`} className="text-xs font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest flex items-center gap-1">View Details <ChevronRight size={14}/></Link>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="h-16 w-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-inner">
                                                    <img src={order.items[0].image} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{order.items[0].name}</h4>
                                                    <p className="text-sm text-gray-500 mt-0.5">{order.items.length > 1 ? `and ${order.items.length - 1} other items` : `Quantity: ${order.items[0].quantity}`}</p>
                                                    <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                {order.status !== 'cancelled' && (
                                                    <button 
                                                        onClick={() => handleToggleMap(order)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                                                            activeMapOrder === order.id 
                                                            ? 'bg-brand-600 border-brand-600 text-white shadow-brand-100' 
                                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <MapIcon size={14} />
                                                        {activeMapOrder === order.id ? 'Hide Track' : 'Track Order'}
                                                    </button>
                                                )}
                                            </div>

                                            {order.status !== 'cancelled' && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <div className="relative">
                                                        <div className="overflow-hidden h-1.5 mb-2 text-xs flex rounded-full bg-gray-100">
                                                            <div style={{ width: getProgressWidth(order.status) }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-1000 ease-out"></div>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            <span className="text-brand-600">Placed</span>
                                                            <span className={order.status !== 'pending' ? 'text-brand-600' : ''}>Shipped</span>
                                                            <span className={order.status === 'delivered' ? 'text-brand-600 font-black' : ''}>Arrived</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeMapOrder === order.id && (
                                                <div className="mt-6 animate-scale-in border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
                                                    {loadingMap ? (
                                                        <div className="h-64 flex flex-col items-center justify-center gap-3 animate-pulse">
                                                            <Truck className="animate-bounce text-brand-600" size={32}/>
                                                            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Connecting to GPS satellite...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                             <div className="absolute top-3 left-3 right-3 p-3 bg-white/90 backdrop-blur-md border border-gray-100 rounded-xl flex justify-between items-center z-10 shadow-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-red-100 rounded-full text-red-600">
                                                                        <MapPin size={14}/>
                                                                    </div>
                                                                    <span className="text-xs text-gray-800 font-bold uppercase tracking-tight">
                                                                        {mapData?.title || 'Shipment Located'}
                                                                    </span>
                                                                </div>
                                                                {mapData && (
                                                                    <a href={mapData.uri} target="_blank" rel="noreferrer" className="text-[10px] font-black bg-brand-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-700 flex items-center gap-1 transition-all">
                                                                        Open <ExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <iframe 
                                                                width="100%" 
                                                                height="320" 
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

                    {activeTab === 'wishlist' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">My Wishlist</h2>
                            {filteredWishlist.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredWishlist.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <p className="text-gray-500">
                                        {searchQuery ? 'No items match your search.' : "Your wishlist is empty."}
                                    </p>
                                    {!searchQuery && <Link to="/shop" className="text-brand-600 font-medium mt-2 inline-block">Explore Menu</Link>}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Documents & Invoices</h2>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-bold text-gray-900">Invoice History</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {filteredInvoices.length > 0 ? (
                                        filteredInvoices.map(invoice => (
                                            <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-gray-100 rounded text-gray-600">
                                                        <FileText size={20}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Invoice #{invoice.id}</p>
                                                        <p className="text-xs text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <p className="font-bold text-gray-900">₹{invoice.amount.toFixed(2)}</p>
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {invoice.status}
                                                        </span>
                                                    </div>
                                                    <button className="text-brand-600 hover:text-brand-800 text-sm font-medium flex items-center gap-1">
                                                        <ExternalLink size={14}/> View
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 italic">No documents match your search.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
  );
};