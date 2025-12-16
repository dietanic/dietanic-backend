
import React, { useState, useEffect } from 'react';
import { APIGateway } from '../services/apiGateway';
import { Product, Order, User, ChatSession } from '../types';
import { Bell, Lock, Loader, LayoutDashboard, ShoppingCart, DollarSign, Briefcase, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

// Import Microfrontends (Domains)
import { UnifiedOverview } from '../components/admin/UnifiedOverview'; // Acts as the "Executive Dashboard" MFE
import { CommerceMFE } from '../components/admin/microfrontends/CommerceMFE';
import { FinanceMFE } from '../components/admin/microfrontends/FinanceMFE';
import { OperationsMFE } from '../components/admin/microfrontends/OperationsMFE';
import { SecurityCenter } from '../components/admin/SecurityCenter'; // Security MFE
import { ExperienceMFE } from '../components/admin/microfrontends/ExperienceMFE'; // New Experience MFE
import { UserManagement } from '../components/admin/UserManagement'; // Identity MFE Part

export const Admin: React.FC = () => {
  const { user, isAdmin, canManageStore } = useAuth();
  
  // Navigation State
  const [activeDomain, setActiveDomain] = useState<'overview' | 'commerce' | 'finance' | 'operations' | 'experience' | 'security' | 'identity'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Global Shared State (Hydrated via API Gateway)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'alert' | 'success', time: string}[]>([
      { id: '1', text: 'Microservices Gateway Connected', type: 'success', time: 'Just now' }
  ]);

  useEffect(() => {
    if (canManageStore) refreshGlobalData();
  }, [canManageStore]);

  const refreshGlobalData = async () => {
    setIsLoading(true);
    // Use the new Domain-based API Gateway
    const [p, o, u, s] = await Promise.all([
        APIGateway.Commerce.Catalog.listProducts(),
        APIGateway.Commerce.Sales.getAllOrders(),
        APIGateway.Identity.Users.list(),
        APIGateway.Intelligence.Engagement.getChatSessions()
    ]);
    setProducts(p); setOrders(o); setUsers(u); setSessions(s);
    setIsLoading(false);
  };

  const handleNavigate = (tab: any) => {
      // Map legacy dashboard clicks to new domains
      if (tab === 'orders' || tab === 'products') setActiveDomain('commerce');
      else if (tab === 'trackcomm') setActiveDomain('operations');
      else setActiveDomain(tab);
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

  if (isLoading && activeDomain === 'overview') return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-brand-600"/></div>;

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center min-h-[64px] py-2 md:py-0">
                <div className="flex items-center gap-8 mr-auto">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Dietanic <span className="font-light text-gray-400">|</span> Admin
                    </h2>
                </div>

                {/* Notifications & Actions (Right aligned on desktop, top right on mobile) */}
                <div className="flex items-center gap-4 ml-4 order-2 md:order-3">
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative">
                            <Bell size={20} />
                            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                                <div className="p-3 bg-gray-50 border-b flex justify-between items-center"><span className="text-sm font-bold">Notifications</span><button onClick={() => setNotifications([])} className="text-xs text-brand-600">Clear</button></div>
                                <div className="max-h-64 overflow-y-auto">{notifications.map(n => <div key={n.id} className="p-3 border-b hover:bg-gray-50"><p className="text-sm">{n.text}</p><p className="text-xs text-gray-400">{n.time}</p></div>)}</div>
                            </div>
                        )}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded border ${isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {isAdmin ? 'Admin' : 'Editor'}
                    </div>
                </div>
                
                {/* Domain Navigation Tabs (Full width row on mobile) */}
                <nav className="flex space-x-1 overflow-x-auto w-full md:w-auto mt-3 md:mt-0 pb-1 md:pb-0 order-3 md:order-2 no-scrollbar">
                    <button onClick={() => setActiveDomain('overview')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap ${activeDomain === 'overview' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}>
                        <LayoutDashboard size={18} /> Overview
                    </button>
                    <button onClick={() => setActiveDomain('commerce')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap ${activeDomain === 'commerce' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}>
                        <ShoppingCart size={18} /> Commerce
                    </button>
                    <button onClick={() => setActiveDomain('finance')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap ${activeDomain === 'finance' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}>
                        <DollarSign size={18} /> Finance
                    </button>
                    <button onClick={() => setActiveDomain('operations')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap ${activeDomain === 'operations' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}>
                        <Briefcase size={18} /> Ops
                    </button>
                    <button onClick={() => setActiveDomain('experience')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap ${activeDomain === 'experience' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}>
                        <Sparkles size={18} /> Experience
                    </button>
                    <button onClick={() => setActiveDomain('security')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 whitespace-nowrap ${activeDomain === 'security' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}>
                        <Shield size={18} /> Security
                    </button>
                </nav>
            </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1 w-full">
          {activeDomain === 'overview' && (
              <UnifiedOverview 
                  products={products} 
                  orders={orders} 
                  users={users} 
                  sessions={sessions} 
                  isAdmin={isAdmin} 
                  onNavigate={handleNavigate} 
              />
          )}
          
          {activeDomain === 'commerce' && <CommerceMFE data={{ products, orders, users, sessions }} />}
          
          {activeDomain === 'finance' && <FinanceMFE />}
          
          {activeDomain === 'operations' && <OperationsMFE />}
          
          {activeDomain === 'experience' && <ExperienceMFE />}
          
          {activeDomain === 'security' && <SecurityCenter />}
          
          {/* Reusing UserManagement inside Identity Domain logic (could be its own MFE later) */}
          {activeDomain === 'identity' && isAdmin && <UserManagement viewMode="internal" />}
      </div>
    </div>
  );
};
