
import React, { useState } from 'react';
import { ProductInventory } from '../ProductInventory';
import { OrderManagement } from '../OrderManagement';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { SeoTools } from '../SeoTools';
import { ShoppingCart, Package, TrendingUp, Search } from 'lucide-react';
import { Product, Order, User, ChatSession } from '../../../types';

interface CommerceMFEProps {
    data: {
        products: Product[];
        orders: Order[];
        users: User[];
        sessions: ChatSession[];
    };
}

/**
 * COMMERCE MICROFRONTEND
 * Encapsulates Catalog Management, Order Processing, and Sales Analytics.
 */
export const CommerceMFE: React.FC<CommerceMFEProps> = ({ data }) => {
    const [activeModule, setActiveModule] = useState<'catalog' | 'subscriptions' | 'orders' | 'analytics' | 'seo'>('catalog');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Domain Navigation */}
            <nav className="flex space-x-2 border-b border-gray-200 pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveModule('catalog')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeModule === 'catalog' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Package size={16}/> Products
                </button>
                <button
                    onClick={() => setActiveModule('subscriptions')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeModule === 'subscriptions' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Package size={16}/> Subscriptions
                </button>
                <button
                    onClick={() => setActiveModule('orders')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeModule === 'orders' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ShoppingCart size={16}/> Orders
                </button>
                <button
                    onClick={() => setActiveModule('analytics')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeModule === 'analytics' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <TrendingUp size={16}/> Performance
                </button>
                <button
                    onClick={() => setActiveModule('seo')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${activeModule === 'seo' ? 'bg-white border border-b-0 border-gray-200 text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Search size={16}/> SEO
                </button>
            </nav>

            <div className="bg-white p-6 rounded-b-lg shadow-sm border border-t-0 border-gray-200 min-h-[600px]">
                {activeModule === 'catalog' && <ProductInventory mode="products" />}
                {activeModule === 'subscriptions' && <ProductInventory mode="subscriptions" />}
                {activeModule === 'orders' && <OrderManagement />}
                {activeModule === 'analytics' && <AnalyticsDashboard data={data} />}
                {activeModule === 'seo' && <SeoTools />}
            </div>
        </div>
    );
};
