
import React, { useState, useEffect } from 'react';
import { SalesService, CatalogService, IdentityService, EngagementService } from '../../services/storeService';
import { Order, Product, User, ChatSession } from '../../types';
import { 
    AlertTriangle, TrendingUp, TrendingDown, UserMinus, 
    Package, RefreshCw, Clock, DollarSign, Calendar, 
    ChevronRight, Mail, ArrowRight, MessageSquare
} from 'lucide-react';

interface Alert {
    id: string;
    type: 'stock' | 'churn' | 'revenue_drop';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    action: string;
    actionData?: any;
}

interface ProactiveManagementProps {
    data?: {
        orders: Order[];
        products: Product[];
        users: User[];
        sessions: ChatSession[];
    }
}

export const ProactiveManagement: React.FC<ProactiveManagementProps> = ({ data }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [weeklyStats, setWeeklyStats] = useState<{current: number, previous: number, percent: number} | null>(null);
    const [customers, setCustomers] = useState<{user: User, lastOrder: string | null, totalSpend: number, orderCount: number}[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [customerInteractions, setCustomerInteractions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Internal data state if not provided by props
    const [internalData, setInternalData] = useState<any>(null);

    useEffect(() => {
        const analyzeData = async () => {
            setLoading(true);
            let orders: Order[], products: Product[], users: User[], sessions: ChatSession[];

            if (data) {
                ({ orders, products, users, sessions } = data);
            } else {
                [orders, products, users, sessions] = await Promise.all([
                    SalesService.getOrders(),
                    CatalogService.getProducts(),
                    IdentityService.getUsers(),
                    EngagementService.getSessions()
                ]);
                setInternalData({ orders, sessions }); // Store for interactions view
            }

            const newAlerts: Alert[] = [];

            // 1. Inventory Analysis
            products.forEach(p => {
                const threshold = p.lowStockThreshold || 5;
                let stock = p.stock;
                // Check variations if they exist
                if (p.variations?.length) {
                    p.variations.forEach(v => {
                        if (v.stock <= (v.lowStockThreshold || 5)) {
                            newAlerts.push({
                                id: `stock_${v.id}`,
                                type: 'stock',
                                priority: v.stock === 0 ? 'high' : 'medium',
                                title: `Low Stock: ${p.name} (${v.name})`,
                                message: `Only ${v.stock} units remaining. Reorder needed immediately.`,
                                action: 'Restock'
                            });
                        }
                    });
                } else if (stock <= threshold) {
                    newAlerts.push({
                        id: `stock_${p.id}`,
                        type: 'stock',
                        priority: stock === 0 ? 'high' : 'medium',
                        title: `Low Stock: ${p.name}`,
                        message: `Only ${stock} units remaining. Reorder needed immediately.`,
                        action: 'Restock'
                    });
                }
            });

            // 2. Churn Analysis (60 Days Inactivity)
            const customerUsers = users.filter(u => u.role === 'customer');
            const now = new Date();
            const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

            const enrichedCustomers = customerUsers.map(u => {
                const userOrders = orders.filter(o => o.userId === u.id);
                const totalSpend = userOrders.reduce((acc, o) => acc + o.total, 0);
                const lastOrder = userOrders.length > 0 
                    ? userOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
                    : null;
                
                // Check Churn
                if (lastOrder && new Date(lastOrder) < sixtyDaysAgo) {
                    newAlerts.push({
                        id: `churn_${u.id}`,
                        type: 'churn',
                        priority: 'medium',
                        title: `At Risk: ${u.name}`,
                        message: `Has not placed an order in over 60 days. Last active: ${new Date(lastOrder).toLocaleDateString()}`,
                        action: 'Send Promo'
                    });
                }

                return {
                    user: u,
                    lastOrder,
                    totalSpend,
                    orderCount: userOrders.length
                };
            });

            setCustomers(enrichedCustomers.sort((a, b) => b.totalSpend - a.totalSpend));

            // 3. Weekly Performance
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

            const currentWeekRevenue = orders
                .filter(o => new Date(o.date) >= oneWeekAgo)
                .reduce((acc, o) => acc + o.total, 0);

            const previousWeekRevenue = orders
                .filter(o => new Date(o.date) >= twoWeeksAgo && new Date(o.date) < oneWeekAgo)
                .reduce((acc, o) => acc + o.total, 0);

            const percentChange = previousWeekRevenue === 0 ? 100 : ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100;

            setWeeklyStats({
                current: currentWeekRevenue,
                previous: previousWeekRevenue,
                percent: percentChange
            });

            setAlerts(newAlerts);
            setLoading(false);
        };

        analyzeData();
    }, [data]);

    // Load Interactions for Detail View (Orders + Chats merged)
    useEffect(() => {
        if (selectedCustomer) {
            const dataSource = data || internalData;
            if(!dataSource) return;

            const custOrders = dataSource.orders.filter((o: Order) => o.userId === selectedCustomer).map((o: Order) => ({...o, type: 'order'}));
            const custChats = dataSource.sessions.filter((s: ChatSession) => s.userId === selectedCustomer).map((s: ChatSession) => ({...s, type: 'chat', date: s.lastActive}));
            
            // @ts-ignore
            const combined = [...custOrders, ...custChats].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setCustomerInteractions(combined);
        }
    }, [selectedCustomer, data, internalData]);

    if (loading) return <div className="p-12 text-center text-gray-500">Analyzing Business Data...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. Smart Alerts Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" size={20} /> Action Items
                    </h3>
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{alerts.length} Issues</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {alerts.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">Everything looks good! No alerts.</div>}
                    {alerts.map(alert => (
                        <div key={alert.id} className="p-4 flex items-start justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex gap-3">
                                <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${
                                    alert.type === 'stock' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                    {alert.type === 'stock' ? <Package size={16} /> : <UserMinus size={16} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                                    <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold bg-white border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 text-gray-700 shadow-sm">
                                {alert.action}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Weekly Pulse */}
                <div className="lg:col-span-2 bg-gradient-to-br from-brand-900 to-brand-800 rounded-lg shadow text-white p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                        <RefreshCw size={120} />
                    </div>
                    
                    <h3 className="text-brand-100 font-medium text-sm uppercase tracking-wider mb-6">Weekly Sales Performance</h3>
                    
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-5xl font-bold">₹{weeklyStats?.current.toLocaleString()}</span>
                        <div className={`flex items-center gap-1 mb-2 px-2 py-1 rounded text-sm font-bold ${
                            (weeklyStats?.percent || 0) >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                            {(weeklyStats?.percent || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {Math.abs(weeklyStats?.percent || 0).toFixed(1)}%
                        </div>
                    </div>
                    <p className="text-brand-200 text-sm mb-8">vs. last week (₹{weeklyStats?.previous.toLocaleString()})</p>

                    <div className="grid grid-cols-2 gap-4 border-t border-brand-700 pt-6">
                        <div>
                            <p className="text-xs text-brand-300 uppercase">Top Performing Category</p>
                            <p className="font-bold text-lg mt-1">Signature Salads</p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-300 uppercase">Average Order Value</p>
                            <p className="font-bold text-lg mt-1">₹450.00</p>
                        </div>
                    </div>
                </div>

                {/* 3. Customer Interaction Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[400px]">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock size={18} className="text-gray-500"/> Interaction History
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {customers.map(c => (
                            <button 
                                key={c.user.id} 
                                onClick={() => setSelectedCustomer(c.user.id)}
                                className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all ${
                                    selectedCustomer === c.user.id ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-500' : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{c.user.name}</p>
                                    <p className="text-xs text-gray-500">LTV: ₹{c.totalSpend.toLocaleString()} • {c.orderCount} Orders</p>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Detailed Interaction Timeline */}
            {selectedCustomer && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Interaction Timeline: {customers.find(c => c.user.id === selectedCustomer)?.user.name}</h3>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100">
                                <Mail size={14}/> Email Customer
                            </button>
                        </div>
                    </div>

                    <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
                        {customerInteractions.map((interaction, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ${
                                    interaction.type === 'order' ? 'bg-green-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                            interaction.type === 'order' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {interaction.type === 'order' ? 'Order Placed' : 'Support Chat'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(interaction.date).toLocaleDateString()} at {new Date(interaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    {interaction.type === 'order' ? (
                                        <div>
                                            <p className="font-bold text-gray-900">Order #{interaction.id.slice(-6)} - ₹{interaction.total}</p>
                                            <p className="text-sm text-gray-600 mt-1">{interaction.items.map((i: any) => i.name).join(', ')}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-1"><MessageSquare size={14}/> Chat Session</p>
                                            <p className="text-sm text-gray-600 mt-1 italic">Last message: "{interaction.lastMessage}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {customerInteractions.length === 0 && (
                            <p className="pl-8 text-gray-500 italic">No recorded interactions history.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
