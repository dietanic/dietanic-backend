
import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Box, Users, Activity, MessageSquare, Plus, Package, Tag, ArrowUpRight, AlertCircle, Zap } from 'lucide-react';
import { Product, Order, User, ChatSession } from '../../types';
import { SmartSearch } from './SmartSearch';
import { EngagementService } from '../../services/storeService';

interface DashboardHomeProps {
  products: Product[];
  orders: Order[];
  users: User[];
  sessions: ChatSession[];
  isAdmin: boolean;
  onNavigate: (tab: any) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ products, orders, users, sessions, isAdmin, onNavigate }) => {
  const [trends, setTrends] = useState<any[]>([]);
  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;
  
  // Calculate potential abandoned carts (Completed * 2.3 is industry average approx)
  const estimatedAbandoned = Math.round(totalOrders * 2.33);

  useEffect(() => {
      EngagementService.getLiveTrends().then(setTrends);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Smart Search Bar */}
        <div className="bg-gradient-to-r from-brand-50 to-white p-6 rounded-xl border border-gray-200 mb-8">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin Command Center</h2>
                <p className="text-gray-500">Find anything or take quick actions instantly.</p>
            </div>
            <SmartSearch orders={orders} users={users} onNavigate={onNavigate} />
        </div>

        {/* LIVE PULSE WIDGET (NEW) */}
        <div className="bg-gray-900 rounded-xl p-6 text-white shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><Activity className="text-brand-400" /> Live Business Pulse</h3>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">Real-time analysis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trends.map((trend, idx) => (
                    <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">{trend.type} Trend</p>
                            <p className="font-bold text-lg">{trend.topic}</p>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-bold px-2 py-1 rounded mb-1 inline-block ${
                                trend.volume === 'High' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
                            }`}>
                                {trend.volume} Vol
                            </div>
                            <p className={`text-xs ${trend.sentiment === 'Negative' ? 'text-red-400' : 'text-green-400'}`}>
                                {trend.sentiment} Sentiment
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow">
                <div className="p-5 flex items-center">
                    <div className="flex-shrink-0 bg-brand-500 rounded-md p-3">
                        <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">Total Revenue</dt>
                            <dd className="text-2xl font-semibold text-gray-900">₹{totalSales.toFixed(0)}</dd>
                        </dl>
                        {/* Mini Sparkline Simulation */}
                        <div className="mt-2 flex gap-1 items-end h-6">
                            {[40, 60, 45, 70, 85, 60, 90].map((h, i) => (
                                <div key={i} className="flex-1 bg-brand-100 hover:bg-brand-200 rounded-sm" style={{height: `${h}%`}}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Abandoned Cart Card */}
            <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow border-l-4 border-red-400">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <dt className="truncate text-sm font-medium text-gray-500">Abandoned Carts (Est)</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{estimatedAbandoned}</dd>
                        </div>
                        <div className="bg-red-50 p-2 rounded-full text-red-500">
                            <ShoppingCart size={20} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle size={12} className="text-red-500" />
                        <span className="font-medium text-red-600">High volume</span>
                        <span>- potential ₹{(estimatedAbandoned * (totalSales/totalOrders || 0)).toLocaleString()} lost</span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow">
                <div className="p-5 flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <Box className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">Orders</dt>
                            <dd className="text-2xl font-semibold text-gray-900">{totalOrders}</dd>
                        </dl>
                        <div className="mt-2 text-xs text-green-600 flex items-center">
                            <ArrowUpRight size={12} /> +5% this week
                        </div>
                    </div>
                </div>
            </div>
            {isAdmin && (
                <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow">
                    <div className="p-5 flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="truncate text-sm font-medium text-gray-500">Users</dt>
                                <dd className="text-2xl font-semibold text-gray-900">{users.length}</dd>
                            </dl>
                            <div className="mt-2 text-xs text-gray-400">
                                Active Customer Base
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Mini-Feed */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-brand-600" /> Real-time Activity
                </h3>
                <div className="flow-root">
                    <ul className="-mb-8">
                        {orders.slice(0, 3).map((order, idx) => (
                            <li key={order.id}>
                                <div className="relative pb-8">
                                    {idx !== 2 ? <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span> : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                <ShoppingCart className="h-4 w-4 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-gray-500">New order placed <button onClick={() => onNavigate('orders')} className="font-medium text-gray-900 hover:underline">#{order.id.slice(-6)}</button></p>
                                            </div>
                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                <time>{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {sessions.slice(0, 1).map((s) => (
                                <li key={s.id}>
                                <div className="relative pb-8">
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                <MessageSquare className="h-4 w-4 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-gray-500">Chat started with <span className="font-medium text-gray-900">{s.userName}</span></p>
                                            </div>
                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                <time>Just now</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onNavigate('products')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                    >
                        <Plus className="text-brand-600" />
                        <span className="font-medium text-gray-700">Add Product</span>
                    </button>
                    <button 
                        onClick={() => onNavigate('trackcomm')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                    >
                        <MessageSquare className="text-brand-600" />
                        <span className="font-medium text-gray-700">View Chats</span>
                    </button>
                    <button 
                        onClick={() => onNavigate('orders')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                    >
                        <Package className="text-brand-600" />
                        <span className="font-medium text-gray-700">Process Orders</span>
                    </button>
                    <button 
                        onClick={() => onNavigate('analytics')}
                        className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors"
                    >
                        <Tag className="text-brand-600" />
                        <span className="font-medium text-gray-700">Analytics</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
