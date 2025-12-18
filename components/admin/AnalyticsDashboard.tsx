

import React, { useState, useEffect } from 'react';
import { Order, Product, User, ChatSession, FinancialForecast, ProfitLossStatement, CohortData, ProductJourneyInfo } from '../../types';
import { AnalyticsService, APIGateway } from '../../services/storeService'; // Use APIGateway
import { 
    DollarSign, ShoppingCart, Users, Activity, TrendingUp, 
    ArrowUpRight, ArrowDownRight, Download, Calendar, 
    PieChart, BarChart, FileText, X, Layers, Target, Briefcase
} from 'lucide-react';

interface AnalyticsDashboardProps {
    data?: {
        orders: Order[];
        products: Product[];
        users: User[];
        sessions: ChatSession[];
    }
}

// Reusable SVG Chart Components
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
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
            <polygon fill={color} fillOpacity="0.1" points={`0,100 ${points} 100,100`} vectorEffect="non-scaling-stroke" />
        </svg>
    );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<'financials' | 'cohorts' | 'products' | 'custom'>('financials');
    const [loading, setLoading] = useState(true);
    
    // Data States
    const [plStatement, setPlStatement] = useState<ProfitLossStatement | null>(null);
    const [forecast, setForecast] = useState<FinancialForecast[]>([]);
    const [cohorts, setCohorts] = useState<CohortData[]>([]);
    const [productJourneys, setProductJourneys] = useState<ProductJourneyInfo[]>([]);
    const [benchmarks, setBenchmarks] = useState<any[]>([]);

    useEffect(() => {
        const loadDeepAnalytics = async () => {
            setLoading(true);
            const [pl, fc, ch, pj, bm] = await Promise.all([
                AnalyticsService.getProfitLossStatement('ytd'),
                APIGateway.Finance.Reporting.getForecast(), // Use APIGateway
                AnalyticsService.getCohortAnalysis(),
                AnalyticsService.getProductJourneys(),
                AnalyticsService.getBenchmarkData()
            ]);
            setPlStatement(pl);
            setForecast(fc);
            setCohorts(ch);
            setProductJourneys(pj);
            setBenchmarks(bm);
            setLoading(false);
        };
        loadDeepAnalytics();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Intelligence Engine...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tab Navigation */}
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
                <button onClick={() => setActiveTab('financials')} className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 ${activeTab === 'financials' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <DollarSign size={16}/> P&L & Forecast
                </button>
                <button onClick={() => setActiveTab('cohorts')} className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 ${activeTab === 'cohorts' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Users size={16}/> Cohorts & LTV
                </button>
                <button onClick={() => setActiveTab('products')} className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 ${activeTab === 'products' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Target size={16}/> Product Journeys
                </button>
                <button onClick={() => setActiveTab('custom')} className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 ${activeTab === 'custom' ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <FileText size={16}/> Custom Reports
                </button>
            </div>

            {/* --- TAB 1: FINANCIALS (P&L) --- */}
            {activeTab === 'financials' && plStatement && (
                <div className="space-y-6 animate-fade-in">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Revenue (YTD)</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{plStatement.revenue.total.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 uppercase font-bold">Gross Profit</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{plStatement.grossProfit.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 uppercase font-bold">Net Profit</p>
                            <h3 className={`text-2xl font-bold mt-1 ${plStatement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{plStatement.netProfit.toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 uppercase font-bold">Net Margin</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">{plStatement.netProfitMargin}%</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* P&L Statement Table */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900">Profit & Loss Statement</h3>
                                <button className="text-brand-600 text-xs font-bold hover:underline">Download CSV</button>
                            </div>
                            <div className="space-y-3 text-sm">
                                {/* Revenue */}
                                <div className="flex justify-between font-bold text-gray-900 pb-2 border-b">
                                    <span>Total Revenue</span>
                                    <span>₹{plStatement.revenue.total.toLocaleString()}</span>
                                </div>
                                <div className="pl-4 space-y-1 text-gray-500 text-xs">
                                    {plStatement.revenue.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{item.category}</span>
                                            <span>{item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* COGS */}
                                <div className="flex justify-between font-medium text-gray-700 pt-2">
                                    <span>Cost of Goods Sold (COGS)</span>
                                    <span>(₹{plStatement.cogs.toLocaleString()})</span>
                                </div>

                                {/* Gross Profit */}
                                <div className="flex justify-between font-bold text-gray-900 py-2 bg-gray-50 px-2 rounded">
                                    <span>Gross Profit</span>
                                    <span>₹{plStatement.grossProfit.toLocaleString()}</span>
                                </div>

                                {/* Expenses */}
                                <div className="font-bold text-gray-900 pt-2">Operating Expenses</div>
                                <div className="pl-4 space-y-1 text-gray-500 text-xs">
                                    {plStatement.expenses.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{item.category}</span>
                                            <span>{item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-medium text-gray-700 border-t pt-2">
                                    <span>Total Expenses</span>
                                    <span>(₹{plStatement.expenses.total.toLocaleString()})</span>
                                </div>

                                {/* Net Profit */}
                                <div className="flex justify-between font-bold text-white bg-gray-900 p-3 rounded mt-4">
                                    <span>Net Profit</span>
                                    <span>₹{plStatement.netProfit.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Forecasting Chart */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-600"/> Sales Forecast (AI)
                            </h3>
                            <div className="h-64 flex items-end justify-between gap-4">
                                {forecast.map((f, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                                        <div className="w-full flex gap-1 items-end justify-center h-48">
                                            <div 
                                                className="w-full bg-brand-200 rounded-t-sm relative transition-all group-hover:bg-brand-300"
                                                style={{height: `${(f.projectedRevenue / 70000) * 100}%`}}
                                            >
                                                {/* Projected Line */}
                                                <div className="absolute top-0 w-full h-1 bg-brand-600"></div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{f.month}</span>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 w-32 text-center pointer-events-none">
                                            Rev: ₹{f.projectedRevenue.toLocaleString()}<br/>
                                            Cash: ₹{f.cashPosition.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-center gap-6 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-brand-600"></div> Projected Revenue</span>
                                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-brand-200"></div> Confidence Interval</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 2: COHORTS & LTV --- */}
            {activeTab === 'cohorts' && (
                <div className="space-y-6 animate-fade-in">
                    {/* LTV & CAC Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">LTV / CAC Ratio</h3>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Healthy (3.5x)</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="w-1/4">
                                    <div className="h-32 bg-red-100 rounded-t-lg relative w-full mx-auto">
                                        <div className="absolute bottom-0 w-full bg-red-400 rounded-t-lg transition-all" style={{height: '30%'}}></div>
                                        <div className="absolute -top-6 w-full text-center text-xs font-bold text-red-600">CAC ₹180</div>
                                    </div>
                                    <p className="text-center text-xs font-bold mt-2">Acquisition</p>
                                </div>
                                <div className="flex-1">
                                    <div className="h-32 bg-green-100 rounded-t-lg relative w-full">
                                        <div className="absolute bottom-0 w-full bg-green-500 rounded-t-lg transition-all" style={{height: '85%'}}></div>
                                        <div className="absolute -top-6 w-full text-center text-xs font-bold text-green-600">LTV ₹4,500</div>
                                    </div>
                                    <p className="text-center text-xs font-bold mt-2">Lifetime Value</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Industry Benchmarks</h3>
                            <div className="space-y-4">
                                {benchmarks.map((bm, i) => (
                                    <div key={i} className="flex items-center text-sm">
                                        <div className="w-32 text-gray-500">{bm.metric}</div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{bm.yourStore}{bm.unit}</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        (bm.better === 'higher' && bm.yourStore > bm.industry) || (bm.better === 'lower' && bm.yourStore < bm.industry)
                                                        ? 'bg-green-500' 
                                                        : 'bg-orange-500'
                                                    }`}
                                                    style={{width: `${(bm.yourStore / (bm.industry * 1.5)) * 100}%`}}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-400">Ind: {bm.industry}{bm.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cohort Grid */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                        <h3 className="font-bold text-gray-900 mb-4">Revenue Retention by Cohort</h3>
                        <table className="min-w-full text-xs">
                            <thead>
                                <tr>
                                    <th className="text-left py-2 px-2 bg-gray-50 font-bold border-b min-w-[100px]">Cohort</th>
                                    <th className="text-left py-2 px-2 bg-gray-50 font-bold border-b">Users</th>
                                    {Array.from({length: 6}).map((_, i) => (
                                        <th key={i} className="text-center py-2 px-2 bg-gray-50 font-bold border-b">Month {i}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.slice(0, 8).map(cohort => (
                                    <tr key={cohort.cohortMonth} className="hover:bg-gray-50">
                                        <td className="py-3 px-2 border-b font-medium">{cohort.cohortMonth}</td>
                                        <td className="py-3 px-2 border-b">{cohort.newCustomers}</td>
                                        {cohort.retention.slice(0, 6).map((ret, i) => {
                                            const intensity = Math.min(1, ret.revenue / (cohort.newCustomers * 500)); // Normalize color
                                            return (
                                                <td key={i} className="py-2 px-2 border-b text-center">
                                                    <div 
                                                        className="py-1 rounded text-white font-medium"
                                                        style={{
                                                            backgroundColor: `rgba(22, 163, 74, ${ret.revenue > 0 ? Math.max(0.2, intensity) : 0})`,
                                                            color: ret.revenue > 0 ? 'white' : '#cbd5e1'
                                                        }}
                                                    >
                                                        {ret.revenue > 0 ? `₹${(ret.revenue/1000).toFixed(1)}k` : '-'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB 3: PRODUCT INSIGHTS --- */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-2">Gateway Products</h3>
                            <p className="text-xs text-gray-500 mb-6">Products most commonly purchased by first-time customers.</p>
                            
                            <div className="space-y-4">
                                {productJourneys.slice(0, 5).map((prod, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-brand-50 rounded flex items-center justify-center text-brand-600 font-bold text-xs">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{prod.productName}</p>
                                                <p className="text-xs text-gray-500">{prod.firstPurchaseCount} first orders</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-green-600">₹{prod.avgLTVAttributed.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">Attributed LTV</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-2">Repurchase Matrix</h3>
                            <p className="text-xs text-gray-500 mb-6">Which products lead to the highest retention?</p>
                            
                            <div className="space-y-4">
                                {productJourneys.sort((a,b) => b.repurchaseRate - a.repurchaseRate).slice(0, 5).map((prod, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{prod.productName}</span>
                                            <span className="font-bold text-gray-900">{prod.repurchaseRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-purple-500 h-2 rounded-full" style={{width: `${prod.repurchaseRate}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 4: CUSTOM REPORTS --- */}
            {activeTab === 'custom' && (
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center animate-fade-in">
                    <div className="max-w-md mx-auto">
                        <Layers size={48} className="mx-auto text-brand-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Report Builder</h3>
                        <p className="text-gray-500 mb-8">Select metrics and dimensions to generate a CSV export.</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-left mb-8">
                            <div className="p-4 border rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all">
                                <span className="block font-bold text-gray-700 mb-1">Metrics</span>
                                <span className="text-xs text-gray-500">Revenue, Orders, AOV, LTV</span>
                            </div>
                            <div className="p-4 border rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-all">
                                <span className="block font-bold text-gray-700 mb-1">Dimensions</span>
                                <span className="text-xs text-gray-500">Date, Product, Region, Channel</span>
                            </div>
                        </div>

                        <button onClick={() => alert("Report generated and sent to email.")} className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mx-auto">
                            <Download size={18} /> Generate Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};