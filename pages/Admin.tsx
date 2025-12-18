import React, { useState, useEffect } from 'react';
import { APIGateway, GlobalEventBus, EVENTS } from '../services/storeService';
import { Product, Order, User, ChatSession } from '../types';
import { 
    Bell, Lock, Loader, LayoutDashboard, ShoppingCart, DollarSign, 
    Shield, Sparkles, Users, Package, Tag, Search, 
    Calculator, MessageSquare, LayoutGrid, Settings, Play, 
    MousePointer, FlaskConical, ShieldCheck, Box, FileText, UserCog,
    ChefHat, Truck, ArrowRight, Menu, X, LogOut
} from 'lucide-react';
import { useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';

// Import Specific Components
import { UnifiedOverview } from '../components/admin/UnifiedOverview';
import { ProductInventory } from '../components/admin/ProductInventory';
import { OrderManagement } from '../components/admin/OrderManagement';
import { DiscountManager } from '../components/admin/DiscountManager';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { SeoTools } from '../components/admin/SeoTools';
import { FinanceModule } from '../components/admin/FinanceModule';
import { PayrollModule } from '../components/admin/PayrollModule';
import { AssetManager } from '../components/admin/AssetManager';
import { TaxSettingsPanel } from '../components/admin/TaxSettings';
import { PlateProfit } from '../components/admin/PlateProfit';
import { TrackCommPanel } from '../components/admin/TrackCommPanel';
import { SystemTools } from '../components/admin/SystemTools';
import { SecurityCenter } from '../components/admin/SecurityCenter';
import { UserManagement } from '../components/admin/UserManagement';
import { 
    SessionRecorderView, 
    HeatmapView, 
    ExperimentsView, 
    PrivacyCenterView 
} from '../components/admin/microfrontends/ExperienceMFE';
import { AdminAgentWidget } from '../components/admin/AdminAgentWidget';

type TabId = 
    | 'overview' 
    | 'products' | 'subscriptions' | 'orders' | 'discounts' 
    | 'analytics' | 'seo' | 'ux-sessions' | 'ux-heatmaps' | 'ux-testing' | 'ux-privacy'
    | 'customers' | 'staff'
    | 'finance' | 'payroll' | 'assets' | 'tax'
    | 'support' | 'plateprofit' | 'security' | 'system' | 'apps';

interface NavItem {
    id: TabId;
    label: string;
    icon: React.ElementType;
    roles: string[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

function TrendingUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Dashboard',
        items: [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'editor'] }
        ]
    },
    {
        title: 'Commerce',
        items: [
            { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'editor'] },
            { id: 'products', label: 'Inventory', icon: Package, roles: ['admin', 'editor'] },
            { id: 'subscriptions', label: 'Subscriptions', icon: Sparkles, roles: ['admin', 'editor'] },
            { id: 'discounts', label: 'Promotions', icon: Tag, roles: ['admin', 'editor'] }
        ]
    },
    {
        title: 'People',
        items: [
            { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'editor'] },
            { id: 'staff', label: 'Staff Directory', icon: UserCog, roles: ['admin'] }
        ]
    },
    {
        title: 'Finance',
        items: [
            { id: 'finance', label: 'Financials', icon: DollarSign, roles: ['admin'] },
            { id: 'payroll', label: 'Payroll', icon: Users, roles: ['admin'] },
            { id: 'assets', label: 'Assets', icon: Box, roles: ['admin'] },
            { id: 'tax', label: 'Tax Settings', icon: FileText, roles: ['admin'] }
        ]
    },
    {
        title: 'Operations',
        items: [
            { id: 'apps', label: 'App Hub', icon: LayoutGrid, roles: ['admin', 'editor'] },
            { id: 'support', label: 'Support', icon: MessageSquare, roles: ['admin', 'editor'] },
            { id: 'plateprofit', label: 'PlateProfit', icon: Calculator, roles: ['admin', 'editor'] },
            { id: 'security', label: 'Security', icon: Shield, roles: ['admin'] },
            { id: 'system', label: 'System', icon: Settings, roles: ['admin'] }
        ]
    },
    {
        title: 'Insights',
        items: [
            { id: 'analytics', label: 'Analytics', icon: TrendingUpIcon, roles: ['admin'] },
            { id: 'seo', label: 'SEO Tools', icon: Search, roles: ['admin', 'editor'] },
            { id: 'ux-sessions', label: 'Session Replay', icon: Play, roles: ['admin', 'editor'] },
            { id: 'ux-heatmaps', label: 'Heatmaps', icon: MousePointer, roles: ['admin', 'editor'] },
            { id: 'ux-testing', label: 'Experiments', icon: FlaskConical, roles: ['admin', 'editor'] },
            { id: 'ux-privacy', label: 'Privacy', icon: ShieldCheck, roles: ['admin'] }
        ]
    }
];

export const Admin: React.FC = () => {
  const { user, isAdmin, canManageStore } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'alert' | 'success', time: string}[]>([
      { id: '1', text: 'Admin Hub Connected', type: 'success', time: 'Just now' }
  ]);

  useEffect(() => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  const refreshGlobalData = async () => {
    const [p, o, u, s] = await Promise.all([
        APIGateway.Commerce.Catalog.listProducts(),
        APIGateway.Commerce.Sales.getAllOrders(),
        APIGateway.Identity.Users.list(),
        APIGateway.Intelligence.Engagement.getChatSessions()
    ]);
    setProducts(p); setOrders(o); setUsers(u); setSessions(s);
  };

  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        await refreshGlobalData();
        setIsLoading(false);
    };

    if (canManageStore) init();

    const handleLiveUpdate = (order: any) => {
        setNotifications(prev => [{
            id: Date.now().toString(),
            text: `New Order Received: ₹${order.total}`,
            type: 'info',
            time: 'Now'
        }, ...prev]);
        refreshGlobalData();
    };

    GlobalEventBus.on(EVENTS.ORDER_CREATED, handleLiveUpdate);
    return () => GlobalEventBus.off(EVENTS.ORDER_CREATED, handleLiveUpdate);

  }, [canManageStore]);

  const handleNavigate = (target: string) => {
      const map: Record<string, TabId> = { 'commerce': 'products', 'operations': 'apps', 'identity': 'customers', 'experience': 'analytics' };
      const id = map[target] || (target as TabId);
      setActiveTab(id);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  if (!canManageStore) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <div className="max-w-md w-full text-center p-8 bg-white shadow-lg rounded-3xl border border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6"><Lock className="h-8 w-8 text-red-600" /></div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-500 mb-6">You do not have permission to access the Administration Portal.</p>
                  <Link to="/" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-sm font-black rounded-full text-white bg-brand-600 hover:bg-brand-700 shadow-lg">Return Home</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex font-sans">
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 z-40 transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
              <span className="text-white font-black text-xl tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">D</div>
                  Dietanic Admin
              </span>
              <button onClick={() => setIsSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400">
                  <X size={20} />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
              {NAV_GROUPS.map((group) => {
                  const authorizedItems = group.items.filter(item => item.roles.includes(user?.role || ''));
                  if (authorizedItems.length === 0) return null;

                  return (
                      <div key={group.title}>
                          <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                              {group.title}
                          </h3>
                          <div className="space-y-1">
                              {authorizedItems.map((item) => (
                                  <button
                                      key={item.id}
                                      onClick={() => handleNavigate(item.id)}
                                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                          activeTab === item.id
                                          ? 'bg-brand-600 text-white shadow-md'
                                          : 'hover:bg-slate-800 hover:text-white'
                                      }`}
                                  >
                                      <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-400'} />
                                      {item.label}
                                  </button>
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                      {user?.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                  <Link to="/" className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors" title="Exit">
                      <LogOut size={16} />
                  </Link>
              </div>
          </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden">
                      <Menu size={20} />
                  </button>
                  <h2 className="text-lg font-bold text-gray-800 capitalize flex items-center gap-2">
                      {activeTab.replace(/-/g, ' ')}
                  </h2>
              </div>

              <div className="flex items-center gap-4">
                  <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative transition-colors">
                            <Bell size={20} />
                            {notifications.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase text-gray-500">Notifications</span>
                                    <button onClick={() => setNotifications([])} className="text-xs text-brand-600 hover:underline">Clear</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.id} className="p-3 border-b last:border-0 hover:bg-gray-50">
                                            <p className="text-sm text-gray-800">{n.text}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && <div className="p-4 text-center text-xs text-gray-400">No new alerts</div>}
                                </div>
                            </div>
                        )}
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                      <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{user?.role} Mode</span>
                  </div>
              </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
              <div className="max-w-[1600px] mx-auto">
                  {isLoading ? (
                      <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400">
                          <Loader className="animate-spin mb-4" size={32} />
                          <p>Synchronizing Data...</p>
                      </div>
                  ) : (
                      <>
                        {activeTab === 'overview' && (
                            <UnifiedOverview 
                                products={products} 
                                orders={orders} 
                                users={users} 
                                sessions={sessions} 
                                isAdmin={isAdmin} 
                                onNavigate={handleNavigate} 
                            />
                        )}

                        {activeTab === 'orders' && <OrderManagement />}
                        {activeTab === 'products' && <ProductInventory mode="products" />}
                        {activeTab === 'subscriptions' && <ProductInventory mode="subscriptions" />}
                        {activeTab === 'discounts' && <DiscountManager />}

                        {activeTab === 'customers' && <UserManagement viewMode="customer" />}
                        {activeTab === 'staff' && <UserManagement viewMode="internal" />}

                        {activeTab === 'finance' && <FinanceModule />}
                        {activeTab === 'payroll' && <PayrollModule />}
                        {activeTab === 'assets' && <AssetManager />}
                        {activeTab === 'tax' && <TaxSettingsPanel />}

                        {activeTab === 'support' && <TrackCommPanel />}
                        {activeTab === 'plateprofit' && <PlateProfit />}
                        {activeTab === 'security' && <SecurityCenter />}
                        {activeTab === 'system' && <SystemTools />}
                        {activeTab === 'apps' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-brand-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center" onClick={() => navigate('/pos')}>
                                    <div className="h-20 w-20 bg-brand-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <LayoutGrid size={40} className="text-brand-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">POS Terminal</h3>
                                    <p className="text-gray-500 text-sm mb-6 flex-grow">Front of House operations, table management, and instant billing.</p>
                                    <span className="text-brand-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Launch POS <ArrowRight size={16}/></span>
                                </div>

                                <div className="bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-700 hover:border-gray-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center" onClick={() => navigate('/kitchen')}>
                                    <div className="h-20 w-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <ChefHat size={40} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Kitchen Display</h3>
                                    <p className="text-gray-400 text-sm mb-6 flex-grow">Back of House ticket management, course timing, and preparation status.</p>
                                    <span className="text-white font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Launch KDS <ArrowRight size={16}/></span>
                                </div>

                                <div className="bg-blue-600 p-8 rounded-3xl shadow-sm border border-blue-500 hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center" onClick={() => navigate('/delivery')}>
                                    <div className="h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Truck size={40} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Logistics & Driver</h3>
                                    <p className="text-blue-100 text-sm mb-6 flex-grow">Field agent routing, proof of delivery, and van sales management.</p>
                                    <span className="text-white font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Launch Logistics <ArrowRight size={16}/></span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && <AnalyticsDashboard data={{ products, orders, users, sessions }} />}
                        {activeTab === 'seo' && <SeoTools />}
                        {activeTab === 'ux-sessions' && <SessionRecorderView />}
                        {activeTab === 'ux-heatmaps' && <HeatmapView />}
                        {activeTab === 'ux-testing' && <ExperimentsView />}
                        {activeTab === 'ux-privacy' && <PrivacyCenterView />}
                      </>
                  )}
              </div>
          </main>
      </div>

      <AdminAgentWidget onNavigate={handleNavigate} />
    </div>
  );
};