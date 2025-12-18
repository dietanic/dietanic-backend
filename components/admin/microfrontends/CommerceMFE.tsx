
import React, { useState } from 'react';
import { ProductInventory } from '../ProductInventory';
import { OrderManagement } from '../OrderManagement';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { SeoTools } from '../SeoTools';
import { DiscountManager } from '../DiscountManager';
import { ShoppingCart, Package, TrendingUp, Search, Tag, Sparkles } from 'lucide-react';
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
 * Encapsulates Catalog Management, Order Processing, Promotions, and Sales Analytics.
 */
export const CommerceMFE: React.FC<CommerceMFEProps> = ({ data }) => {
    const [activeModule, setActiveModule] = useState<'catalog' | 'subscriptions' | 'orders' | 'promotions' | 'analytics' | 'seo'>('catalog');

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeModule, label: string, icon: any }) => (
        <button
            onClick={() => setActiveModule(id)}
            className={`px-6 py-2.5 text-sm font-bold rounded-full flex items-center gap-2 transition-all ${
                activeModule === id 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
        >
            <Icon size={16}/> {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Domain Navigation - Redesigned with Pill Shape Buttons */}
            <nav className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-3xl border border-gray-200">
                <TabButton id="catalog" label="Products" icon={Package} />
                <TabButton id="subscriptions" label="Subscriptions" icon={Sparkles} />
                <TabButton id="orders" label="Orders" icon={ShoppingCart} />
                <TabButton id="promotions" label="Promotions" icon={Tag} />
                <TabButton id="analytics" label="Performance" icon={TrendingUp} />
                <TabButton id="seo" label="SEO" icon={Search} />
            </nav>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[600px]">
                {activeModule === 'catalog' && <ProductInventory mode="products" />}
                {activeModule === 'subscriptions' && <ProductInventory mode="subscriptions" />}
                {activeModule === 'orders' && <OrderManagement />}
                {activeModule === 'promotions' && <DiscountManager />}
                {activeModule === 'analytics' && <AnalyticsDashboard data={data} />}
                {activeModule === 'seo' && <SeoTools />}
            </div>
        </div>
    );
};
