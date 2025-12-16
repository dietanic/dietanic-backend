
import React, { useState, useEffect } from 'react';
import { AssetService } from '../../services/storeService';
import { Asset } from '../../types';
import { Plus, Trash2, Box, TrendingDown, DollarSign, Activity } from 'lucide-react';

export const AssetManager: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        name: '', cost: 0, salvageValue: 0, usefulLifeYears: 5, category: 'Equipment', purchaseDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        const data = await AssetService.getAssets();
        setAssets(data);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const asset: Asset = {
            id: `ast_${Date.now()}`,
            name: newAsset.name!,
            cost: Number(newAsset.cost),
            salvageValue: Number(newAsset.salvageValue),
            usefulLifeYears: Number(newAsset.usefulLifeYears),
            category: newAsset.category as any,
            purchaseDate: newAsset.purchaseDate!,
            status: 'active',
            depreciationMethod: 'Straight Line',
            currentBookValue: Number(newAsset.cost),
            depreciationSchedule: []
        };
        await AssetService.addAsset(asset);
        setIsAdding(false);
        loadAssets();
    };

    const handleDispose = async (id: string) => {
        if(confirm("Dispose this asset?")) {
            await AssetService.disposeAsset(id);
            loadAssets();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Box className="text-blue-600" /> Asset Registry
                    </h2>
                    <p className="text-sm text-gray-500">Track fixed assets, lifecycle, and depreciation.</p>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-brand-600 text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-brand-700">
                    <Plus size={16}/> Add Asset
                </button>
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 animate-slide-in-right">
                    <h3 className="font-bold mb-4">Register New Asset</h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="p-2 border rounded" placeholder="Asset Name" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} required />
                        <select className="p-2 border rounded" value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value as any})}>
                            <option>Equipment</option><option>Vehicle</option><option>Furniture</option><option>Technology</option>
                        </select>
                        <input className="p-2 border rounded" type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} required />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Cost:</span>
                            <input className="p-2 border rounded flex-1" type="number" placeholder="Cost" value={newAsset.cost} onChange={e => setNewAsset({...newAsset, cost: Number(e.target.value)})} required />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Salvage:</span>
                            <input className="p-2 border rounded flex-1" type="number" placeholder="Salvage Value" value={newAsset.salvageValue} onChange={e => setNewAsset({...newAsset, salvageValue: Number(e.target.value)})} required />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Life (Yrs):</span>
                            <input className="p-2 border rounded flex-1" type="number" placeholder="Years" value={newAsset.usefulLifeYears} onChange={e => setNewAsset({...newAsset, usefulLifeYears: Number(e.target.value)})} required />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save Asset</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {assets.map(asset => (
                    <div key={asset.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{asset.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{asset.id} • {asset.category}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${asset.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {asset.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div><span className="text-gray-500 block">Purchase Date</span>{asset.purchaseDate}</div>
                                <div><span className="text-gray-500 block">Original Cost</span>₹{asset.cost.toLocaleString()}</div>
                                <div><span className="text-gray-500 block">Useful Life</span>{asset.usefulLifeYears} Years</div>
                                <div><span className="text-gray-500 block">Current Book Value</span><span className="font-bold text-blue-600">₹{AssetService.calculateCurrentValue(asset).toLocaleString()}</span></div>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><TrendingDown size={14}/> Depreciation Schedule</h4>
                            <div className="h-32 flex items-end gap-1">
                                {asset.depreciationSchedule.map((entry, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                        <div 
                                            className="bg-blue-400 hover:bg-blue-500 rounded-t w-full transition-all" 
                                            style={{height: `${(entry.endValue / asset.cost) * 100}%`}}
                                        ></div>
                                        <span className="text-[10px] text-center text-gray-500 mt-1">{entry.year}</span>
                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                            Val: ₹{entry.endValue.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2">
                            {asset.status === 'active' && (
                                <button onClick={() => handleDispose(asset.id)} className="p-2 text-red-500 hover:bg-red-50 rounded border border-red-200" title="Dispose Asset">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
