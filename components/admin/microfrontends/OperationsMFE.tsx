
import React from 'react';
import { TrackCommPanel } from '../TrackCommPanel';
import { SystemTools } from '../SystemTools';
import { LayoutGrid, ChefHat, Truck, MessageSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * OPERATIONS MICROFRONTEND
 * Encapsulates Customer Support, System Config, and links to Operational Apps (POS/KDS/Driver).
 */
export const OperationsMFE: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState<'support' | 'apps' | 'system'>('apps');

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Sub-Nav */}
             <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                    <button onClick={() => setActiveTab('apps')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'apps' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        Apps & Hubs
                    </button>
                    <button onClick={() => setActiveTab('support')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'support' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        Support (TrackComm)
                    </button>
                    <button onClick={() => setActiveTab('system')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'system' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                        System Tools
                    </button>
                </div>
            </div>

            {activeTab === 'support' && <TrackCommPanel />}
            {activeTab === 'system' && <SystemTools />}
            
            {activeTab === 'apps' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => navigate('/pos')} className="bg-white p-8 rounded-xl shadow-md border-2 border-transparent hover:border-brand-500 cursor-pointer transition-all hover:shadow-xl group text-center">
                        <div className="h-20 w-20 bg-brand-100 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                            <LayoutGrid size={40} className="text-brand-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">POS Terminal</h3>
                        <p className="text-gray-500 text-sm mb-6">Front of House operations, table management, and billing.</p>
                        <span className="text-brand-600 font-bold text-sm">Launch POS &rarr;</span>
                    </div>

                    <div onClick={() => navigate('/kitchen')} className="bg-gray-900 p-8 rounded-xl shadow-md border-2 border-transparent hover:border-gray-600 cursor-pointer transition-all hover:shadow-xl group text-center">
                        <div className="h-20 w-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                            <ChefHat size={40} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Kitchen Display</h3>
                        <p className="text-gray-400 text-sm mb-6">Back of House ticket management and preparation status.</p>
                        <span className="text-white font-bold text-sm">Launch KDS &rarr;</span>
                    </div>

                    <div onClick={() => navigate('/delivery')} className="bg-blue-600 p-8 rounded-xl shadow-md border-2 border-transparent hover:border-blue-400 cursor-pointer transition-all hover:shadow-xl group text-center">
                        <div className="h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                            <Truck size={40} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Logistics App</h3>
                        <p className="text-blue-100 text-sm mb-6">Field agent routing, proof of delivery, and van sales.</p>
                        <span className="text-white font-bold text-sm">Launch Driver App &rarr;</span>
                    </div>
                </div>
            )}
        </div>
    );
};
