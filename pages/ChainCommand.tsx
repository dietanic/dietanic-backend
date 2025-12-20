
import React, { useState, useEffect } from 'react';
import { ChainStore, RegionStats } from '../types';
import { ChainService } from '../services/chainService';
import { 
    Activity, Globe, TrendingUp, AlertOctagon, 
    Server, Map as MapIcon, BarChart3, Users, Zap, 
    ArrowUpRight, Shield, Bell, Command
} from 'lucide-react';

export const ChainCommand: React.FC = () => {
    const [stores, setStores] = useState<ChainStore[]>([]);
    const [stats, setStats] = useState<RegionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState<ChainStore | null>(null);
    const [mapMode, setMapMode] = useState<'status' | 'revenue'>('status');

    useEffect(() => {
        const init = async () => {
            const [s, st] = await Promise.all([
                ChainService.getStores(),
                ChainService.getAggregatedStats()
            ]);
            setStores(s);
            setStats(st);
            setLoading(false);
        };
        init();

        // Subscribe to live feed
        const unsubscribe = ChainService.subscribeToUpdates((updatedStores) => {
            setStores(updatedStores);
            // Recalc aggregates on the fly
            setStats({
                totalRevenue: updatedStores.reduce((acc, s) => acc + s.liveStats.hourlyRevenue, 0),
                totalOrders: updatedStores.reduce((acc, s) => acc + s.liveStats.activeOrders, 0),
                avgEfficiency: Math.round(updatedStores.reduce((acc, s) => acc + s.liveStats.efficiencyScore, 0) / updatedStores.length),
                openLocations: updatedStores.filter(s => s.status !== 'closed').length
            });
        });

        return () => unsubscribe();
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'operational': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default: return 'text-slate-400 bg-slate-400/10';
        }
    };

    const handleGlobalAction = () => {
        alert("Global Command Center: This feature is coming soon.");
    };

    const handleRemoteAction = (action: string) => {
        if (!selectedStore) return;
        alert(`${action} signal sent to ${selectedStore.name}. Awaiting confirmation.`);
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-mono">INITIALIZING UPLINK...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
            {/* Top Command Bar */}
            <header className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-emerald-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <Activity className="text-slate-900 h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white tracking-wider flex items-center gap-2">
                                CHAIN COMMAND <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">HQ-1</span>
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                LIVE TELEMETRY ACTIVE
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-slate-500 uppercase font-bold">Network Revenue (Hr)</p>
                            <p className="text-xl font-bold text-white font-mono">₹{stats?.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-slate-500 uppercase font-bold">Active Orders</p>
                            <p className="text-xl font-bold text-blue-400 font-mono">{stats?.totalOrders}</p>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
                        <button 
                            onClick={handleGlobalAction}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                        >
                            <Command size={14} /> Global Actions
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: Map & Global Stats (8 cols) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    {/* Visual Map / Geo-Spatial Monitor */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 relative overflow-hidden h-[400px] group">
                        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg flex gap-2">
                            <button 
                                onClick={() => setMapMode('status')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${mapMode === 'status' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Status Heatmap
                            </button>
                            <button 
                                onClick={() => setMapMode('revenue')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${mapMode === 'revenue' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Revenue Flow
                            </button>
                        </div>

                        {/* Abstract Map Visualization */}
                        <div className="w-full h-full bg-[#0f172a] relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }}></div>
                            
                            {/* Store Dots */}
                            {stores.map(store => (
                                <div 
                                    key={store.id}
                                    className="absolute transition-all duration-500 cursor-pointer group/dot"
                                    style={{ left: `${store.coordinates.x}%`, top: `${store.coordinates.y}%` }}
                                    onClick={() => setSelectedStore(store)}
                                >
                                    <div className={`relative flex items-center justify-center
                                        ${mapMode === 'status' && store.status === 'operational' ? 'text-emerald-500' : ''}
                                        ${mapMode === 'status' && store.status === 'warning' ? 'text-amber-500' : ''}
                                        ${mapMode === 'status' && store.status === 'critical' ? 'text-rose-500' : ''}
                                        ${mapMode === 'revenue' ? 'text-blue-500' : ''}
                                    `}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 currentColor bg-current ${store.status === 'critical' ? 'duration-500' : 'duration-[3s]'}`}></span>
                                        <div className={`relative rounded-full bg-slate-900 border-2 border-current h-4 w-4 z-10 transition-transform group-hover/dot:scale-150`}></div>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-slate-800 border border-slate-700 p-3 rounded-lg opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                            <p className="text-white font-bold text-sm">{store.name}</p>
                                            <p className="text-slate-400 text-xs">{store.location}</p>
                                            <div className="mt-2 flex justify-between text-xs">
                                                <span className="text-slate-500">Rev/Hr</span>
                                                <span className="text-emerald-400 font-mono">₹{store.liveStats.hourlyRevenue}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-emerald-500/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                    <Zap className="text-emerald-500" size={20}/>
                                </div>
                                <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">+94% Eff.</span>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Network Efficiency</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats?.avgEfficiency}/100</h3>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-blue-500/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <Users className="text-blue-500" size={20}/>
                                </div>
                                <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-1 rounded">Global</span>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Total Staff Active</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stores.reduce((acc,s)=>acc+s.liveStats.staffOnClock,0)}</h3>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-rose-500/30 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                                    <AlertOctagon className="text-rose-500" size={20}/>
                                </div>
                                {stores.some(s => s.status === 'critical') && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Active Incidents</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stores.reduce((acc,s)=>acc+s.alerts.length,0)}</h3>
                        </div>
                    </div>

                    {/* Detailed Store Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><Server size={16} className="text-slate-500"/> Node Status</h3>
                            <button className="text-xs text-blue-400 hover:text-blue-300">View Full Report &rarr;</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                                    <tr>
                                        <th className="px-6 py-3">Store Node</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Rev/Hr</th>
                                        <th className="px-6 py-3 text-right">Labor %</th>
                                        <th className="px-6 py-3 text-right">Efficiency</th>
                                        <th className="px-6 py-3">Manager</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {stores.map(store => (
                                        <tr key={store.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedStore(store)}>
                                            <td className="px-6 py-4 font-medium text-white">
                                                {store.name}
                                                <div className="text-xs text-slate-500">{store.location}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded border font-bold uppercase ${getStatusColor(store.status)}`}>
                                                    {store.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-white">₹{store.liveStats.hourlyRevenue}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={store.liveStats.laborCostPercent > 30 ? 'text-amber-500' : 'text-slate-300'}>
                                                    {store.liveStats.laborCostPercent}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`h-full ${store.liveStats.efficiencyScore > 90 ? 'bg-emerald-500' : store.liveStats.efficiencyScore > 70 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{width: `${store.liveStats.efficiencyScore}%`}}></div>
                                                    </div>
                                                    <span className="text-xs text-slate-400">{store.liveStats.efficiencyScore}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{store.manager}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Details (4 cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    {/* Live Alerts Feed */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 min-h-[300px]">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                            <Bell size={16} className="text-rose-500" /> Priority Alerts
                        </h3>
                        <div className="space-y-3">
                            {stores.flatMap(s => s.alerts.map(a => ({...a, storeName: s.name}))).length === 0 ? (
                                <div className="text-center py-10 text-slate-600 italic">
                                    <Shield size={32} className="mx-auto mb-2 opacity-20"/>
                                    System Nominal. No active alerts.
                                </div>
                            ) : (
                                stores.flatMap(s => s.alerts.map(a => ({...a, storeName: s.name}))).map((alert, idx) => (
                                    <div key={idx} className="bg-slate-950 border-l-2 border-rose-500 p-3 rounded-r-lg">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs text-rose-400 font-bold uppercase">{alert.severity} Priority</span>
                                            <span className="text-[10px] text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-200 mt-1 font-medium">{alert.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">Source: {alert.storeName}</p>
                                        <button className="mt-2 text-xs bg-rose-500/10 text-rose-400 px-2 py-1 rounded hover:bg-rose-500/20 w-full text-left">
                                            Investigate &rarr;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Selected Store Inspector */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                            <MapIcon size={16} className="text-blue-500" /> 
                            {selectedStore ? selectedStore.name : 'Select a Store Node'}
                        </h3>
                        
                        {selectedStore ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                        <span className="text-xs text-slate-500 block">Manager</span>
                                        <span className="text-sm font-bold text-white">{selectedStore.manager}</span>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                        <span className="text-xs text-slate-500 block">Status</span>
                                        <span className={`text-xs font-bold uppercase ${selectedStore.status === 'operational' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {selectedStore.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Remote Actions</p>
                                    <div className="space-y-2">
                                        <button 
                                            onClick={() => handleRemoteAction('Push Notification')}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 px-3 rounded flex justify-between items-center group"
                                        >
                                            <span>Send Push Notification</span>
                                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        </button>
                                        <button 
                                            onClick={() => handleRemoteAction('Inventory Audit')}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 px-3 rounded flex justify-between items-center group"
                                        >
                                            <span>Request Inventory Audit</span>
                                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        </button>
                                        <button 
                                            onClick={() => handleRemoteAction('Digital Signage Update')}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 px-3 rounded flex justify-between items-center group"
                                        >
                                            <span>Update Digital Signage</span>
                                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-slate-600 text-xs">
                                Click on a map node or table row to inspect
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
