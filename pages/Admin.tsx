
import React, { useState, useEffect } from 'react';
import { CatalogService, SalesService, IdentityService, EngagementService } from '../services/storeService';
import { Product, Order, User, ChatSession } from '../types';
import { Bell, Lock, Loader, Monitor, ChefHat, LayoutGrid } from 'lucide-react';
import { useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';

// Import Modular Components
import { DashboardHome } from '../components/admin/DashboardHome';
import { ProductInventory } from '../components/admin/ProductInventory';
import { OrderManagement } from '../components/admin/OrderManagement';
import { TrackCommPanel } from '../components/admin/TrackCommPanel';
import { SeoTools } from '../components/admin/SeoTools';
import { SystemTools } from '../components/admin/SystemTools';
import { UserManagement } from '../components/admin/UserManagement';
import { UnifiedOverview } from '../components/admin/UnifiedOverview';
import { TaxSettingsPanel } from '../components/admin/TaxSettings';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { FinanceModule } from '../components/admin/FinanceModule';

export const Admin: React.FC = () => {
  const { user, isAdmin, canManageStore } = useAuth();
  const navigate = useNavigate();
  // 'overview' replaces dashboard, proactive, and analytics
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'analytics' | 'products' | 'subscriptions' | 'orders' | 'operations' | 'trackcomm' | 'seo' | 'system_users' | 'customers' | 'system' | 'tax'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Global Admin Data (Fetched once for dashboard, refreshed by components individually)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'alert' | 'success', time: string}[]>([
      { id: '1', text: 'System Initialized', type: 'success', time: 'Just now' }
  ]);

  useEffect(() => {
    if (canManageStore) refreshGlobalData();
  }, [canManageStore]);

  const refreshGlobalData = async () => {
    setIsLoading(true);
    const [p, o, u, s] = await Promise.all([
        CatalogService.getProducts(),
        SalesService.getOrders(),
        IdentityService.getUsers(),
        EngagementService.getSessions()
    ]);
    setProducts(p); setOrders(o); setUsers(u); setSessions(s);
    setIsLoading(false);
  };

  const handleNavigate = (tab: any) => {
      // Map old tab names if clicked from quick actions
      if (tab === 'proactive' || tab === 'dashboard') {
          setActiveTab('overview');
      } else {
          setActiveTab(tab);
      }
  };

  if (!canManageStore) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <div className="max-w-md w-full text-center p-8 bg-white shadow-lg rounded-lg border border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6"><Lock className="h-8 w-8 text-red-600" /></div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-500 mb-6">Restricted area.</p>
                  <Link to="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700">Return Home</Link>
              </div>
          </div>
      );
  }

  if (isLoading && activeTab === 'overview') return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-brand-600"/></div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8 px-4 sm:px-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-2">
              Admin Portal
              <span className={`text-xs px-2 py-1 rounded-full border ${isAdmin ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                  {isAdmin ? 'Administrator' : 'Editor'}
              </span>
            </h2>
          </div>
          <div className="relative mt-4 md:mt-0">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-white rounded-full hover:bg-gray-50 relative shadow-sm border border-gray-200">
                  <Bell size={20} />
                  {notifications.length > 0 && <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
              {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b flex justify-between items-center"><span className="text-sm font-bold">Notifications</span><button onClick={() => setNotifications([])} className="text-xs text-brand-600">Clear</button></div>
                      <div className="max-h-64 overflow-y-auto">{notifications.map(n => <div key={n.id} className="p-3 border-b hover:bg-gray-50"><p className="text-sm">{n.text}</p><p className="text-xs text-gray-400">{n.time}</p></div>)}</div>
                  </div>
              )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6 px-4 sm:px-0">
            <nav className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'finance', label: 'Finance' },
                    { id: 'analytics', label: 'Analytics' },
                    { id: 'products', label: 'Products' },
                    { id: 'subscriptions', label: 'Plans' },
                    { id: 'orders', label: 'Orders' },
                    { id: 'operations', label: 'Operations' },
                    { id: 'trackcomm', label: 'TrackComm' },
                    { id: 'seo', label: 'SEO' },
                    ...(isAdmin ? [
                        { id: 'system_users', label: 'System Users' },
                        { id: 'customers', label: 'Customers' },
                        
                    ] : []),
                    { id: 'system', label: 'System' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`${activeTab === tab.id ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700 bg-white'} rounded-md px-3 py-2 text-sm font-medium shadow-sm whitespace-nowrap transition-colors`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        {/* Content Area */}
        <div className="px-4 sm:px-0 pb-12">
            {activeTab === 'overview' && <UnifiedOverview products={products} orders={orders} users={users} sessions={sessions} isAdmin={isAdmin} onNavigate={handleNavigate} />}
            {activeTab === 'finance' && <FinanceModule />}
            {activeTab === 'analytics' && <AnalyticsDashboard data={{products, orders, users, sessions}} />}
            {activeTab === 'products' && <ProductInventory mode="products" />}
            {activeTab === 'subscriptions' && <ProductInventory mode="subscriptions" />}
            {activeTab === 'orders' && <OrderManagement />}
            {activeTab === 'trackcomm' && <TrackCommPanel />}
            {activeTab === 'seo' && <SeoTools />}
            {activeTab === 'system_users' && isAdmin && <UserManagement viewMode="internal" />}
            {activeTab === 'customers' && isAdmin && <UserManagement viewMode="customer" />}
            {activeTab === 'tax' && isAdmin && <TaxSettingsPanel />}
            {activeTab === 'system' && <SystemTools />}
            
            {activeTab === 'operations' && (
                <div className="animate-fade-in space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">In-Store Operations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => navigate('/pos')} className="bg-white p-8 rounded-lg shadow-md border-2 border-transparent hover:border-brand-500 cursor-pointer transition-all hover:shadow-xl group">
                            <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutGrid size={32} className="text-brand-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Launch Point of Sale</h3>
                            <p className="text-gray-500">Access the POS terminal to manage tables, take orders, and finalize bills. Ideal for front-of-house staff.</p>
                            <button className="mt-6 text-brand-600 font-medium group-hover:underline">Open POS Terminal &rarr;</button>
                        </div>

                        <div onClick={() => navigate('/kitchen')} className="bg-gray-800 p-8 rounded-lg shadow-md border-2 border-transparent hover:border-brand-400 cursor-pointer transition-all hover:shadow-xl group text-white">
                            <div className="h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ChefHat size={32} className="text-brand-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Launch Kitchen Display</h3>
                            <p className="text-gray-400">View incoming tickets, manage cooking stations, and update preparation status in real-time.</p>
                            <button className="mt-6 text-brand-400 font-medium group-hover:underline">Open KDS Screen &rarr;</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
