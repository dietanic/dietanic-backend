
import React, { useState, useEffect } from 'react';
import { CatalogService } from '../../services/storeService';
import { Product } from '../../types';
import { Loader, AlertTriangle, CheckCircle, XCircle, Search, Save, Package, DollarSign } from 'lucide-react';

interface InventoryItem {
    id: string; // product id
    variationId?: string; // if variation
    name: string;
    category: string;
    stock: number;
    sku: string;
    threshold: number;
    price: number;
    parentName?: string;
}

interface InventoryControlProps {
    filterMode: 'products' | 'subscriptions';
}

export const InventoryControl: React.FC<InventoryControlProps> = ({ filterMode }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadData();
    }, [filterMode]);

    const loadData = async () => {
        setLoading(true);
        const allProducts = await CatalogService.getProducts();
        
        // Filter based on the mode prop
        const relevantProducts = allProducts.filter(p => 
            filterMode === 'subscriptions' ? p.isSubscription : !p.isSubscription
        );

        setProducts(relevantProducts);
        flattenData(relevantProducts);
        setLoading(false);
    };

    const flattenData = (prods: Product[]) => {
        const items: InventoryItem[] = [];
        prods.forEach(p => {
            if (p.variations && p.variations.length > 0) {
                // If has variations, list them
                p.variations.forEach(v => {
                    items.push({
                        id: p.id,
                        variationId: v.id,
                        name: v.name,
                        parentName: p.name,
                        category: p.category,
                        stock: v.stock,
                        sku: v.sku || '',
                        threshold: v.lowStockThreshold || 5,
                        price: v.price
                    });
                });
            } else {
                // Single product
                items.push({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    stock: p.stock,
                    sku: p.sku || '',
                    threshold: p.lowStockThreshold || 5,
                    price: p.price
                });
            }
        });
        setInventoryItems(items);
        setHasChanges(false);
    };

    const handleUpdateItem = (index: number, field: keyof InventoryItem, value: any) => {
        const newItems = [...inventoryItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setInventoryItems(newItems);
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        // We need to fetch the absolute latest to ensure we don't overwrite unrelated fields,
        // but for this implementation, we use the local state `products` which are the ones currently in view.
        const updatedProducts = [...products];
        
        inventoryItems.forEach(item => {
            const pIdx = updatedProducts.findIndex(p => p.id === item.id);
            if (pIdx === -1) return;

            const product = { ...updatedProducts[pIdx] }; // Shallow copy

            if (item.variationId) {
                // Update variation
                if (product.variations) {
                    const vIdx = product.variations.findIndex(v => v.id === item.variationId);
                    if (vIdx !== -1) {
                        const updatedVars = [...product.variations];
                        updatedVars[vIdx] = {
                            ...updatedVars[vIdx],
                            stock: Number(item.stock),
                            sku: item.sku,
                            lowStockThreshold: Number(item.threshold)
                        };
                        product.variations = updatedVars;
                    }
                }
            } else {
                // Update main product
                product.stock = Number(item.stock);
                product.sku = item.sku;
                product.lowStockThreshold = Number(item.threshold);
            }
            updatedProducts[pIdx] = product;
        });

        // Save sequentially
        for (const p of updatedProducts) {
            await CatalogService.updateProduct(p);
        }
        
        await loadData(); // Reload to confirm
    };

    const filteredItems = inventoryItems.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        (i.parentName && i.parentName.toLowerCase().includes(search.toLowerCase())) ||
        i.sku.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const totalValue = inventoryItems.reduce((acc, i) => acc + (i.price * i.stock), 0);
    const lowStockCount = inventoryItems.filter(i => i.stock <= i.threshold && i.stock > 0).length;
    const outOfStockCount = inventoryItems.filter(i => i.stock <= 0).length;

    if (loading) return <div className="p-12 flex justify-center"><Loader className="animate-spin text-brand-600"/></div>;

    return (
        <div className="space-y-6 animate-fade-in bg-gray-50/50 p-4 rounded-b-lg border border-t-0 border-gray-200">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full"><DollarSign size={24}/></div>
                        <div>
                            <p className="text-sm text-gray-500">Inventory Value</p>
                            <p className="text-2xl font-bold text-gray-900">₹{totalValue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><AlertTriangle size={24}/></div>
                        <div>
                            <p className="text-sm text-gray-500">Low Stock Alerts</p>
                            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full"><XCircle size={24}/></div>
                        <div>
                            <p className="text-sm text-gray-500">Out of Stock</p>
                            <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {hasChanges && (
                        <button 
                            onClick={handleSaveChanges}
                            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 shadow-sm animate-pulse"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Threshold</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item, idx) => {
                                // Find original index in full array for updates
                                const originalIndex = inventoryItems.indexOf(item);
                                const status = item.stock === 0 ? 'out' : item.stock <= item.threshold ? 'low' : 'good';
                                
                                return (
                                    <tr key={`${item.id}-${item.variationId || 'main'}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {item.parentName ? (
                                                     <div className="ml-4 pl-3 border-l-2 border-gray-300">
                                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.parentName}</div>
                                                     </div>
                                                ) : (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.category}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input 
                                                type="text" 
                                                value={item.sku}
                                                onChange={(e) => handleUpdateItem(originalIndex, 'sku', e.target.value)}
                                                className="w-32 text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1"
                                                placeholder="SKU..."
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center border border-gray-300 rounded-md w-32 bg-white">
                                                <button onClick={() => handleUpdateItem(originalIndex, 'stock', Math.max(0, item.stock - 1))} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border-r">-</button>
                                                <input 
                                                    type="number" 
                                                    value={item.stock}
                                                    onChange={(e) => handleUpdateItem(originalIndex, 'stock', Number(e.target.value))}
                                                    className="w-full text-center text-sm border-none focus:ring-0 p-1"
                                                />
                                                <button onClick={() => handleUpdateItem(originalIndex, 'stock', item.stock + 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border-l">+</button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input 
                                                type="number" 
                                                value={item.threshold}
                                                onChange={(e) => handleUpdateItem(originalIndex, 'threshold', Number(e.target.value))}
                                                className="w-20 text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1 text-center"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                status === 'good' ? 'bg-green-100 text-green-800' : 
                                                status === 'low' ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {status === 'good' && 'In Stock'}
                                                {status === 'low' && 'Low Stock'}
                                                {status === 'out' && 'Out of Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
