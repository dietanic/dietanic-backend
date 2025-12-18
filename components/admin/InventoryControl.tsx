

import React, { useState, useEffect, useRef } from 'react';
import { CatalogService, APIGateway } from '../../services/storeService'; // Use APIGateway
import { Product, PurchaseOrder, Vendor } from '../../types';
import { Loader, AlertTriangle, CheckCircle, XCircle, Search, Save, Package, DollarSign, ScanLine, RefreshCcw, Box, ShoppingCart, Truck, Barcode } from 'lucide-react';

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
    
    // Audit Mode State
    const [isAuditMode, setIsAuditMode] = useState(false);
    const [scannedCode, setScannedCode] = useState('');
    const [auditItem, setAuditItem] = useState<InventoryItem | null>(null);
    const [auditCount, setAuditCount] = useState<number>(0);
    const auditInputRef = useRef<HTMLInputElement>(null);

    // Procurement State
    const [isProcurementMode, setIsProcurementMode] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

    useEffect(() => {
        loadData();
    }, [filterMode]);

    // Auto-focus when audit mode opens or item clears
    useEffect(() => {
        if(isAuditMode && !auditItem && auditInputRef.current) {
            auditInputRef.current.focus();
        }
    }, [isAuditMode, auditItem]);

    const loadData = async () => {
        setLoading(true);
        const [allProducts, allVendors, allPOs] = await Promise.all([
            CatalogService.getProducts(),
            APIGateway.Finance.Payables.getVendors(), // Use APIGateway
            CatalogService.getPurchaseOrders()
        ]);
        
        // Filter based on the mode prop
        const relevantProducts = allProducts.filter(p => 
            filterMode === 'subscriptions' ? p.isSubscription : !p.isSubscription
        );

        setProducts(relevantProducts);
        setVendors(allVendors);
        setPurchaseOrders(allPOs);
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
                        barcode: v.barcode || '',
                        threshold: v.lowStockThreshold || 5,
                        price: v.price,
                        image: p.image
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
                    barcode: p.barcode || '',
                    threshold: p.lowStockThreshold || 5,
                    price: p.price,
                    image: p.image
                });
            }
        });
        setInventoryItems(items);
        setHasChanges(false);
    };

    // --- Procurement Logic ---
    const handleAutoRestock = async () => {
        const lowStockItems = inventoryItems.filter(i => i.stock <= i.threshold);
        if (lowStockItems.length === 0) {
            alert("No items below threshold.");
            return;
        }

        const vendor = vendors[0]; // Simplified: defaulting to first vendor
        if (!vendor) {
            alert("Please add vendors in Finance > Payables first.");
            return;
        }

        const po: PurchaseOrder = {
            id: `po_${Date.now()}`,
            vendorId: vendor.id,
            vendorName: vendor.name,
            date: new Date().toISOString(),
            expectedDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), // +7 days
            status: 'ordered',
            items: lowStockItems.map(item => ({
                productId: item.id,
                productName: item.parentName ? `${item.parentName} - ${item.name}` : item.name,
                quantity: item.threshold * 2, // Reorder to 2x threshold
                cost: item.price * 0.4 // Assume cost is 40% of price
            })),
            total: 0
        };
        po.total = po.items.reduce((acc, i) => acc + (i.cost * i.quantity), 0);

        await CatalogService.createPurchaseOrder(po);
        alert(`Purchase Order #${po.id} created for ${lowStockItems.length} items.`);
        setIsProcurementMode(true);
        loadData();
    };

    const handleReceivePO = async (id: string) => {
        await CatalogService.receivePurchaseOrder(id);
        loadData();
    };

    // --- Audit Logic ---
    const handleScanAudit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!scannedCode.trim()) return;

        const code = scannedCode.trim().toLowerCase();
        
        // Match logic: Barcode > SKU > Name
        const found = inventoryItems.find(i => 
            (i.barcode && i.barcode.toLowerCase() === code) ||
            (i.sku && i.sku.toLowerCase() === code) || 
            i.name.toLowerCase().includes(code)
        );

        if (found) {
            setAuditItem(found);
            setAuditCount(found.stock); // Pre-fill with expected stock
        } else {
            alert("Item not found. Try Barcode, SKU or Name.");
        }
        setScannedCode('');
    };

    const handleReconcile = async () => {
        if (!auditItem) return;
        
        // Find index in main list
        const idx = inventoryItems.findIndex(i => i.id === auditItem.id && i.variationId === auditItem.variationId);
        
        if (idx !== -1) {
            // Update local state
            handleUpdateItem(idx, 'stock', auditCount);
            
            // Immediately save to backend for "One Click" feel
            await performSingleSave(inventoryItems[idx], auditCount);
            
            alert(`Stock reconciled for ${auditItem.name}. System updated.`);
            setAuditItem(null); // Reset for next scan
        }
    };

    // --- General Update Logic ---

    const handleUpdateItem = (index: number, field: keyof InventoryItem, value: any) => {
        const newItems = [...inventoryItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setInventoryItems(newItems);
        setHasChanges(true);
    };

    // Helper to save a single item specifically (used in Audit)
    const performSingleSave = async (item: InventoryItem, newStock: number) => {
        const productsCopy = await CatalogService.getProducts();
        const pIdx = productsCopy.findIndex(p => p.id === item.id);
        if (pIdx === -1) return;

        const product = { ...productsCopy[pIdx] };

        if (item.variationId) {
            const vIdx = product.variations?.findIndex(v => v.id === item.variationId);
            if (vIdx !== undefined && vIdx !== -1 && product.variations) {
                product.variations[vIdx].stock = newStock;
            }
        } else {
            product.stock = newStock;
        }
        
        await CatalogService.updateProduct(product);
        // Reload data to ensure sync
        const reloaded = await CatalogService.getProducts();
        const relevant = reloaded.filter(p => filterMode === 'subscriptions' ? p.isSubscription : !p.isSubscription);
        setProducts(relevant);
        flattenData(relevant);
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        const updatedProducts = [...products];
        
        inventoryItems.forEach(item => {
            const pIdx = updatedProducts.findIndex(p => p.id === item.id);
            if (pIdx === -1) return;

            const product = { ...updatedProducts[pIdx] }; 

            if (item.variationId) {
                if (product.variations) {
                    const vIdx = product.variations.findIndex(v => v.id === item.variationId);
                    if (vIdx !== -1) {
                        const updatedVars = [...product.variations];
                        updatedVars[vIdx] = {
                            ...updatedVars[vIdx],
                            stock: Number(item.stock),
                            sku: item.sku,
                            barcode: item.barcode, // New
                            lowStockThreshold: Number(item.threshold)
                        };
                        product.variations = updatedVars;
                    }
                }
            } else {
                product.stock = Number(item.stock);
                product.sku = item.sku;
                product.barcode = item.barcode; // New
                product.lowStockThreshold = Number(item.threshold);
            }
            updatedProducts[pIdx] = product;
        });

        for (const p of updatedProducts) {
            await CatalogService.updateProduct(p);
        }
        
        await loadData();
    };

    const filteredItems = inventoryItems.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        (i.parentName && i.parentName.toLowerCase().includes(search.toLowerCase())) ||
        i.sku.toLowerCase().includes(search.toLowerCase()) ||
        (i.barcode && i.barcode.toLowerCase().includes(search.toLowerCase()))
    );

    // Stats
    const totalValue = inventoryItems.reduce((acc, i) => acc + (i.price * i.stock), 0);
    const lowStockCount = inventoryItems.filter(i => i.stock <= i.threshold && i.stock > 0).length;
    const outOfStockCount = inventoryItems.filter(i => i.stock <= 0).length;

    if (loading) return <div className="p-12 flex justify-center"><Loader className="animate-spin text-brand-600"/></div>;

    if (isProcurementMode) {
        return (
            <div className="space-y-6 p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Truck /> Purchase Orders</h2>
                    <button onClick={() => setIsProcurementMode(false)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded">Back to Stock</button>
                </div>
                <div className="space-y-4">
                    {purchaseOrders.length === 0 && <p className="text-gray-500">No active purchase orders.</p>}
                    {purchaseOrders.map(po => (
                        <div key={po.id} className="border rounded-lg p-4 bg-white flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">{po.vendorName}</h4>
                                <p className="text-xs text-gray-500">PO #{po.id} • {new Date(po.date).toLocaleDateString()}</p>
                                <p className="text-xs mt-1">{po.items.length} items • Total: ₹{po.total}</p>
                            </div>
                            <div>
                                {po.status === 'received' ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Received</span>
                                ) : (
                                    <button onClick={() => handleReceivePO(po.id)} className="bg-brand-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-brand-700">
                                        Mark Received
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in bg-gray-50/50 p-4 rounded-b-lg border border-t-0 border-gray-200">
            {/* Audit Mode Modal/Panel */}
            {isAuditMode && (
                <div className="bg-gray-900 rounded-xl p-6 text-white shadow-2xl mb-6 border-l-4 border-brand-500 animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3"><ScanLine className="text-brand-400" /> Barcode Stock Audit</h2>
                        <button onClick={() => { setIsAuditMode(false); setAuditItem(null); }} className="p-2 hover:bg-gray-800 rounded-full"><XCircle /></button>
                    </div>

                    {!auditItem ? (
                        <div className="max-w-xl mx-auto py-8">
                            <label className="block text-gray-400 text-sm mb-2 uppercase font-bold tracking-wider flex items-center gap-2">
                                <Barcode size={16}/> Scan Product / SKU
                            </label>
                            <form onSubmit={handleScanAudit} className="flex gap-2">
                                <input 
                                    ref={auditInputRef}
                                    className="flex-1 bg-gray-800 border-2 border-gray-700 text-white px-4 py-4 rounded-lg text-xl font-mono focus:border-brand-500 focus:outline-none"
                                    placeholder="Click & Scan Barcode..."
                                    value={scannedCode}
                                    onChange={e => setScannedCode(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="bg-brand-600 px-8 py-4 rounded-lg font-bold hover:bg-brand-500 transition-colors">Lookup</button>
                            </form>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="text-center md:text-left">
                                <div className="inline-block p-2 bg-white rounded-lg mb-4">
                                    <img src={auditItem.image} className="h-32 w-32 object-cover rounded" alt=""/>
                                </div>
                                <h3 className="text-3xl font-bold">{auditItem.name}</h3>
                                <p className="text-gray-400 text-lg mt-1">{auditItem.parentName || auditItem.category}</p>
                                <div className="mt-4 flex gap-2 flex-wrap justify-center md:justify-start">
                                    <div className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded text-sm font-mono text-gray-300 border border-gray-700">
                                        <Box size={14}/> SKU: {auditItem.sku || 'N/A'}
                                    </div>
                                    <div className="inline-flex items-center gap-2 bg-gray-800 px-3 py-1 rounded text-sm font-mono text-gray-300 border border-gray-700">
                                        <Barcode size={14}/> BAR: {auditItem.barcode || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-700">
                                    <div>
                                        <p className="text-sm text-gray-400 uppercase font-bold">System Stock</p>
                                        <p className="text-4xl font-bold">{auditItem.stock}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400 uppercase font-bold">Variance</p>
                                        <p className={`text-4xl font-bold ${auditCount === auditItem.stock ? 'text-green-500' : 'text-red-500'}`}>
                                            {auditCount - auditItem.stock > 0 ? '+' : ''}{auditCount - auditItem.stock}
                                        </p>
                                    </div>
                                </div>

                                <label className="block text-sm font-bold text-gray-300 mb-2">Physical Count (Actual)</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setAuditCount(Math.max(0, auditCount - 1))} className="px-4 bg-gray-700 rounded hover:bg-gray-600 text-2xl font-bold">-</button>
                                    <input 
                                        type="number" 
                                        className="flex-1 bg-white text-gray-900 text-center font-bold text-2xl py-3 rounded outline-none border-2 border-transparent focus:border-brand-500"
                                        value={auditCount}
                                        onChange={e => setAuditCount(Number(e.target.value))}
                                    />
                                    <button onClick={() => setAuditCount(auditCount + 1)} className="px-4 bg-gray-700 rounded hover:bg-gray-600 text-2xl font-bold">+</button>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setAuditItem(null)} className="flex-1 py-3 bg-transparent border border-gray-600 text-gray-300 rounded font-bold hover:bg-gray-700">Cancel</button>
                                    <button onClick={handleReconcile} className="flex-[2] py-3 bg-brand-600 text-white rounded font-bold hover:bg-brand-500 shadow-lg flex items-center justify-center gap-2">
                                        <RefreshCcw size={18}/> One-Click Reconcile
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                            placeholder="Search by name, SKU or Barcode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleAutoRestock}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                        >
                            <ShoppingCart size={18} /> Auto-Restock Low Items
                        </button>
                        <button 
                            onClick={() => setIsProcurementMode(true)}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
                        >
                            <Truck size={18} /> View POs
                        </button>
                        <button 
                            onClick={() => setIsAuditMode(true)}
                            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 shadow-sm transition-colors"
                        >
                            <ScanLine size={18} /> Live Audit
                        </button>
                        {hasChanges && (
                            <button 
                                onClick={handleSaveChanges}
                                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 shadow-sm animate-pulse"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU & Barcode</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap space-y-1">
                                            <input 
                                                type="text" 
                                                value={item.sku}
                                                onChange={(e) => handleUpdateItem(originalIndex, 'sku', e.target.value)}
                                                className="w-32 text-xs border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1"
                                                placeholder="SKU"
                                            />
                                            <input 
                                                type="text" 
                                                value={item.barcode || ''}
                                                onChange={(e) => handleUpdateItem(originalIndex, 'barcode', e.target.value)}
                                                className="w-32 text-xs border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1 block mt-1"
                                                placeholder="Barcode"
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