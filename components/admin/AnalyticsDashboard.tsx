
import React from 'react';
import { Order, Product, User, ChatSession } from '../../types';
import { DollarSign, ShoppingCart, Users, Activity, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnalyticsDashboardProps {
    data?: {
        orders: Order[];
        products: Product[];
        users: User[];
        sessions: ChatSession[];
    }
}

// Simple SVG Line Chart Component
const Sparkline = ({ data, color, height = 50 }: { data: number[], color: string, height?: number }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" className="w-full overflow-visible" height={height} preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                vectorEffect="non-scaling-stroke"
            />
            <polygon
                fill={color}
                fillOpacity="0.1"
                points={`0,100 ${points} 100,100`}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
    // Dummy Data Generation for Charts
    const salesData = [1200, 1900, 1500, 2200, 2800, 2400, 3100];
    const subscriptionGrowth = [50, 55, 62, 70, 75, 85, 92];
    const engagementData = [20, 35, 25, 45, 30, 55, 60];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Weekly Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹15,100</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 h-12">
                        <Sparkline data={salesData} color="#16a34a" />
                    </div>
                    <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                        <ArrowUpRight size={14} className="mr-1"/> +12.5% vs last week
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">92</h3>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <ShoppingCart size={20} />
                        </div>
                    </div>
                    <div className="mt-4 h-12">
                        <Sparkline data={subscriptionGrowth} color="#9333ea" />
                    </div>
                    <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                        <ArrowUpRight size={14} className="mr-1"/> +8 New this week
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg. Engagement</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">4.8m</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="mt-4 h-12">
                        <Sparkline data={engagementData} color="#2563eb" />
                    </div>
                    <div className="mt-2 flex items-center text-xs text-red-500 font-medium">
                        <ArrowDownRight size={14} className="mr-1"/> -2% vs last week
                    </div>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Performance */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={20} className="text-gray-500"/> Sales Performance
                        </h3>
                        <select className="text-xs border-gray-300 rounded-md shadow-sm border p-1">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="space-y-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={day} className="flex items-center gap-4">
                                <span className="text-xs font-medium text-gray-500 w-8">{day}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div 
                                        className="bg-brand-500 h-2 rounded-full transition-all duration-500" 
                                        style={{width: `${(salesData[i] / 3500) * 100}%`}}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-gray-900 w-12 text-right">₹{salesData[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-gray-500"/> Top Selling Products
                    </h3>
                    <div className="overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                                    <th className="pb-2">Product</th>
                                    <th className="pb-2 text-right">Sold</th>
                                    <th className="pb-2 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="group hover:bg-gray-50">
                                    <td className="py-3 font-medium text-gray-900">Green Goddess Salad</td>
                                    <td className="py-3 text-right text-gray-600">45</td>
                                    <td className="py-3 text-right font-bold text-brand-600">₹15,705</td>
                                </tr>
                                <tr className="group hover:bg-gray-50">
                                    <td className="py-3 font-medium text-gray-900">Weekly Lunch Plan</td>
                                    <td className="py-3 text-right text-gray-600">12</td>
                                    <td className="py-3 text-right font-bold text-brand-600">₹18,000</td>
                                </tr>
                                <tr className="group hover:bg-gray-50">
                                    <td className="py-3 font-medium text-gray-900">Quinoa Power Bowl</td>
                                    <td className="py-3 text-right text-gray-600">28</td>
                                    <td className="py-3 text-right font-bold text-brand-600">₹11,172</td>
                                </tr>
                                <tr className="group hover:bg-gray-50">
                                    <td className="py-3 font-medium text-gray-900">Cold Pressed Juice</td>
                                    <td className="py-3 text-right text-gray-600">56</td>
                                    <td className="py-3 text-right font-bold text-brand-600">₹8,400</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
