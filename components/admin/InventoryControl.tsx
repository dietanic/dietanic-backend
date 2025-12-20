
import React, { useState, useEffect, useRef } from 'react';
import { CatalogService, APIGateway } from '../../services/storeService';
import { STORAGE_KEYS, DB } from '../../services/storage';
import { Product, PurchaseOrder, Vendor, Warehouse, Batch, SerialNumber, TrackingMode, InventoryRecord } from '../../types';
import { Loader, AlertTriangle, CheckCircle, XCircle, Search, Save, Package, DollarSign, ScanLine, RefreshCcw, Box, ShoppingCart, Truck, Barcode, MapPin, Layers, Hash, Calendar, Globe, Database } from 'lucide-react';

interface InventoryItem {
    id: string; // product id
    variationId?: string; // if variation
    name: string;
    category: string;
    stock: number;
    sku: string;
    barcode?: string;
    threshold: number;
    price: number;
    parentName?: string;
    image?: string;
    trackingMode: TrackingMode;
}

interface InventoryControlProps {
    filterMode: 'products' | 'subscriptions';
}

export const InventoryControl: React.FC<InventoryControlProps> = ({ filterMode }) => {
    const [activeTab, setActiveTab] = useState<'visibility' | 'batches' | 'serials'>('visibility');
    const [products, setProducts] = useState<Product[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
    
    // Batch/Serial Data (Loaded separately for simplicity)
    const [batches, setBatches] = useState<Batch[]>([]);
    const [serials, setSerials] = useState<SerialNumber[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [search, setSearch] = useState('');
    
    // New Entry States (Batches/Serials)
    const [newBatch, setNewBatch] = useState<Partial<Batch>>({ quantity: 0, batchNumber: '', expiryDate: '' });
    const [newSerial, setNewSerial] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('wh_main');

    useEffect(() => {
        loadData();
    }, [filterMode]);

    const loadData = async () => {
        setLoading(true);
        const [allProducts, allWarehouses, allBatches, allSerials, invRecords] = await Promise.all([
            CatalogService.getProducts(),
            DB.getAll<Warehouse>(STORAGE_KEYS.WAREHOUSES),
            DB.getAll<Batch>(STORAGE_KEYS.BATCHES),
            DB.getAll<SerialNumber>(STORAGE_KEYS.SERIALS),
            APIGateway.Commerce.Inventory.getGlobalView()
        ]);
        
        const relevantProducts = allProducts.filter(p => 
            filterMode === 'subscriptions' ? p.isSubscription : !p.isSubscription
        );

        setProducts(relevantProducts);
        setWarehouses(allWarehouses);
        setBatches(allBatches);
        setSerials(allSerials);
        setInventoryRecords(invRecords);
        flattenData(relevantProducts);
        setLoading(false);
    };

    const flattenData = (prods: Product[]) => {
        const items: InventoryItem[] = [];
        prods.forEach(p => {
            if (p.variations && p.variations.length > 0) {
                p.variations.forEach(v => {
                    items.push({
                        id: p.id,
                        variationId: v.id,
                        name: v.name,
                        parentName: p.name,
                        category: p.category,
                        stock: v.stock, // This is total aggregate
                        sku: v.sku || '',
                        barcode: v.barcode || '',
                        threshold: v.lowStockThreshold || 5,
                        price: v.price,
                        image: p.image,
                        trackingMode: p.trackingMode || 'simple'
                    });
                });
            } else {
                items.push({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    stock: p.stock,
                    sku: p.sku || '',
                    barcode: p.barcode || '',
                    threshold: p.lowStockThreshold || 5,
                    price: p.price,
                    image: p.image,
                    trackingMode: p.trackingMode || 'simple'
                });
            }
        });
        setInventoryItems(items);
    };

    const handleSync = async (source: 'ERP' | 'WMS' | 'POS') => {
        setIsSyncing(true);
        const count = await APIGateway.Commerce.Inventory.syncSource(source);
        alert(`Synced ${count} records from ${source}`);
        await loadData();
        setIsSyncing(false);
    };

    const handleAddBatch = async (item: InventoryItem) => {
        if (!newBatch.batchNumber || !newBatch.quantity || !newBatch.expiryDate) {
            alert("Please fill all batch details");
            return;
        }
        const b: Batch = {
            id: `batch_${Date.now()}`,
            productId: item.id,
            warehouseId: selectedWarehouseId,
            batchNumber: newBatch.batchNumber,
            quantity: Number(newBatch.quantity),
            expiryDate: newBatch.expiryDate,
            receivedDate: new Date().toISOString()
        };
        await DB.add(STORAGE_KEYS.BATCHES, b);
        setNewBatch({ quantity: 0, batchNumber: '', expiryDate: '' });
        alert("Batch Added");
        loadData();
    };

    const handleAddSerial = async (item: InventoryItem) => {
        if (!newSerial) return;
        const s: SerialNumber = {
            id: `sn_${Date.now()}`,
            productId: item.id,
            warehouseId: selectedWarehouseId,
            serialNumber: newSerial,
            status: 'Available'
        };
        await DB.add(STORAGE_KEYS.SERIALS, s);
        setNewSerial('');
        loadData();
    };

    const filteredItems = inventoryItems.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        (i.parentName && i.parentName.toLowerCase().includes(search.toLowerCase())) ||
        i.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-12 flex justify-center"><Loader className="animate-spin text-brand-600"/></div>;

    return (
        <div className="space-y-6 animate-fade-in bg-gray-50/50 p-4 rounded-b-lg border border-t-0 border-gray-200">
            
            {/* Top Toolbar: Search & Data Source Sync */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Search Inventory by SKU, Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Sync External Sources:</span>
                    <button onClick={() => handleSync('ERP')} disabled={isSyncing} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-xs font-bold hover:bg-blue-100 disabled:opacity-50">
                        <Database size={14}/> ERP
                    </button>
                    <button onClick={() => handleSync('WMS')} disabled={isSyncing} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded border border-orange-200 text-xs font-bold hover:bg-orange-100 disabled:opacity-50">
                        <Box size={14}/> WMS
                    </button>
                    <button onClick={() => handleSync('POS')} disabled={isSyncing} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200 text-xs font-bold hover:bg-green-100 disabled:opacity-50">
                        <ScanLine size={14}/> POS
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('visibility')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'visibility' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Globe size={16}/> Central Visibility (ATP)
                </button>
                <button
                    onClick={() => setActiveTab('batches')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'batches' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Layers size={16}/> Batches
                </button>
                <button
                    onClick={() => setActiveTab('serials')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'serials' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Barcode size={16}/> Serials
                </button>
            </div>

            {/* Central Visibility View */}
            {activeTab === 'visibility' && (
                <div className="space-y-4">
                    {filteredItems.map((item, idx) => {
                        const itemRecords = inventoryRecords.filter(r => r.productId === item.id);
                        const globalATP = itemRecords.reduce((sum, r) => sum + r.available, 0);
                        const globalOnHand = itemRecords.reduce((sum, r) => sum + r.onHand, 0);
                        
                        return (
                            <div key={`${item.id}-${idx}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Header Summary */}
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {item.image && <img src={item.image} className="h-10 w-10 rounded object-cover border border-gray-200" alt=""/>}
                                        <div>
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <div className="flex gap-2 text-xs text-gray-500 font-mono">
                                                <span>SKU: {item.sku}</span>
                                                <span className="text-gray-300">|</span>
                                                <span>Source: {itemRecords[0]?.sourceSystem || 'Internal'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-right">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Total On Hand</p>
                                            <p className="text-lg font-bold text-gray-900">{globalOnHand}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Global ATP</p>
                                            <p className={`text-lg font-bold ${globalATP > item.threshold ? 'text-green-600' : 'text-red-500'}`}>
                                                {globalATP}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Breakdown Table */}
                                <table className="w-full text-sm">
                                    <thead className="bg-white text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Location</th>
                                            <th className="px-4 py-2 text-left font-medium">Type</th>
                                            <th className="px-4 py-2 text-right font-medium">On Hand</th>
                                            <th className="px-4 py-2 text-right font-medium text-orange-600">Allocated</th>
                                            <th className="px-4 py-2 text-right font-medium text-green-600">Available (ATP)</th>
                                            <th className="px-4 py-2 text-right font-medium text-blue-600">In Transit</th>
                                            <th className="px-4 py-2 text-right font-medium text-gray-400">Last Sync</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {itemRecords.map(rec => (
                                            <tr key={rec.id} className="hover:bg-blue-50/30">
                                                <td className="px-4 py-2 font-medium text-gray-900">{rec.locationName}</td>
                                                <td className="px-4 py-2 text-xs">
                                                    <span className={`px-2 py-0.5 rounded border ${
                                                        rec.locationType === 'Warehouse' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                        rec.locationType === 'Store' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                                        'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}>{rec.locationType}</span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-bold">{rec.onHand}</td>
                                                <td className="px-4 py-2 text-right">{rec.allocated}</td>
                                                <td className="px-4 py-2 text-right font-bold text-green-700">{rec.available}</td>
                                                <td className="px-4 py-2 text-right">{rec.inTransit}</td>
                                                <td className="px-4 py-2 text-right text-xs text-gray-400">{new Date(rec.lastSynced).toLocaleTimeString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Batch Management View */}
            {activeTab === 'batches' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <select className="border rounded-md p-2 text-sm" value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    
                    {filteredItems.filter(i => i.trackingMode === 'batch').map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg">{item.name} <span className="text-gray-400 text-sm font-normal">({item.sku})</span></h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Layers size={16}/> Total Batches: {batches.filter(b => b.productId === item.id && b.warehouseId === selectedWarehouseId).length}
                                </div>
                            </div>
                            
                            <table className="w-full text-sm mb-4">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Batch #</th>
                                        <th className="px-3 py-2 text-left">Expiry</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.filter(b => b.productId === item.id && b.warehouseId === selectedWarehouseId).map(batch => (
                                        <tr key={batch.id} className="border-b last:border-0">
                                            <td className="px-3 py-2 font-mono">{batch.batchNumber}</td>
                                            <td className="px-3 py-2">{new Date(batch.expiryDate).toLocaleDateString()}</td>
                                            <td className="px-3 py-2 text-right font-bold">{batch.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="bg-purple-50 p-3 rounded-lg flex items-end gap-3">
                                <div><label className="text-xs font-bold text-purple-800">Batch #</label><input className="w-24 p-1.5 rounded border border-purple-200 text-sm" value={newBatch.batchNumber} onChange={e=>setNewBatch({...newBatch, batchNumber: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-purple-800">Expiry</label><input type="date" className="w-32 p-1.5 rounded border border-purple-200 text-sm" value={newBatch.expiryDate} onChange={e=>setNewBatch({...newBatch, expiryDate: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-purple-800">Qty</label><input type="number" className="w-16 p-1.5 rounded border border-purple-200 text-sm" value={newBatch.quantity || ''} onChange={e=>setNewBatch({...newBatch, quantity: Number(e.target.value)})} /></div>
                                <button onClick={() => handleAddBatch(item)} className="bg-purple-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-purple-700">Add</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Serial Number View */}
            {activeTab === 'serials' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <select className="border rounded-md p-2 text-sm" value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>

                    {filteredItems.filter(i => i.trackingMode === 'serial').map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg">{item.name}</h4>
                                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {serials.filter(s => s.productId === item.id && s.warehouseId === selectedWarehouseId && s.status === 'Available').length} Available
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {serials.filter(s => s.productId === item.id && s.warehouseId === selectedWarehouseId).map(sn => (
                                    <span key={sn.id} className={`text-xs px-2 py-1 rounded border font-mono ${sn.status === 'Available' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 text-gray-500 border-gray-200 dashed'}`}>
                                        {sn.serialNumber}
                                    </span>
                                ))}
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                                <Hash size={16} className="text-blue-500"/>
                                <input 
                                    className="flex-1 p-2 rounded border border-blue-200 text-sm" 
                                    placeholder="Scan Serial Number..." 
                                    value={newSerial}
                                    onChange={e => setNewSerial(e.target.value)}
                                    onKeyDown={e => {if(e.key === 'Enter') handleAddSerial(item)}}
                                />
                                <button onClick={() => handleAddSerial(item)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700">Add</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
