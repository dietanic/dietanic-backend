
import React, { useState, useEffect, useRef } from 'react';
import { CatalogService, APIGateway } from '../../services/storeService'; // Use APIGateway
import { Product, PurchaseOrder, Vendor } from '../../types';
import { Loader, AlertTriangle, CheckCircle, XCircle, Search, Save, Package, DollarSign, ScanLine, RefreshCcw, Box, ShoppingCart, Truck, Barcode, Edit, Trash2 } from 'lucide-react';

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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftItem, setDraftItem] = useState<InventoryItem | null>(null);

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
        
        const relevantProducts = allProducts.filter(p => 
            filterMode === 'subscriptions' ? p.isSubscription : !p.isSubscription
        );

        setProducts(relevantProducts);
        setVendors(allVendors);
        setPurchaseOrders(allPOs);
        flattenData(relevantProducts);
        setLoading(false);
        setEditingId(null);
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
                        stock: v.stock,
                        sku: v.sku || '',
                        barcode: v.barcode || '',
                        threshold: v.lowStockThreshold || 5,
                        price: v.price,
                        image: p.image
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
                    image: p.image
                });
            }
        });
        setInventoryItems(items);
    };

    const handleEditStart = (item: InventoryItem) => {
        setEditingId(item.variationId || item.id);
        setDraftItem({ ...item });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setDraftItem(null);
    };

    const handleSaveEdit = async () => {
        if (!draftItem) return;
        setLoading(true);

        const productsCopy = await CatalogService.getProducts();
        const pIdx = productsCopy.findIndex(p => p.id === draftItem.id);
        if (pIdx === -1) return;

        const product = { ...productsCopy[pIdx] };

        if (draftItem.variationId) {
            const vIdx = product.variations?.findIndex(v => v.id === draftItem.variationId);
            if (vIdx !== undefined && vIdx !== -1 && product.variations) {
                const updatedVars = [...product.variations];
                updatedVars[vIdx] = {
                    ...updatedVars[vIdx],
                    stock: Number(draftItem.stock),
                    sku: draftItem.sku,
                    barcode: draftItem.barcode,
                    lowStockThreshold: Number(draftItem.threshold)
                };
                product.variations = updatedVars;
            }
        } else {
            product.stock = Number(draftItem.stock);
            product.sku = draftItem.sku;
            product.barcode = draftItem.barcode;
            product.lowStockThreshold = Number(draftItem.threshold);
        }
        
        await CatalogService.updateProduct(product);
        await loadData(); // Reload all data
    };

    const handleDraftChange = (field: keyof InventoryItem, value: any) => {
        if(draftItem) {
            setDraftItem({ ...draftItem, [field]: value });
        }
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
        
        const found = inventoryItems.find(i => 
            (i.barcode && i.barcode.toLowerCase() === code) ||
            (i.sku && i.sku.toLowerCase() === code) || 
            i.name.toLowerCase().includes(code)
        );

        if (found) {
            setAuditItem(found);
            setAuditCount(found.stock); 
        } else {
            alert("Item not found. Try Barcode, SKU or Name.");
        }
        setScannedCode('');
    };

    const handleReconcile = async () => {
        if (!auditItem) return;
        
        const itemToUpdate = { ...auditItem, stock: auditCount };

        // Update backend
        setLoading(true);
        const productsCopy = await CatalogService.getProducts();
        const pIdx = productsCopy.findIndex(p => p.id === itemToUpdate.id);
        if (pIdx === -1) { setLoading(false); return; }

        const product = { ...productsCopy[pIdx] };

        if (itemToUpdate.variationId) {
            const vIdx = product.variations?.findIndex(v => v.id === itemToUpdate.variationId);
            if (vIdx !== undefined && vIdx !== -1 && product.variations) {
                product.variations[vIdx].stock = itemToUpdate.stock;
            }
        } else {
            product.stock = itemToUpdate.stock;
        }
        
        await CatalogService.updateProduct(product);
        
        alert(`Stock reconciled for ${auditItem.name}. System updated.`);
        setAuditItem(null); // Reset for next scan
        await loadData(); // Reload
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
        // Unchanged PO UI
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
                                <p className="text-xs mt-1">{po.items.length} items • Total: ₹{po.total.toFixed(2)}</p>
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
        )
    }

    return (
        <div className="space-y-6 animate-fade-in bg-gray-50/50 p-4 rounded-b-lg border border-t-0 border-gray-200">
            {isAuditMode && (
                // Unchanged Audit UI
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
                            <ShoppingCart size={18} /> Auto-Restock
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
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item) => {
                                const isEditing = editingId === (item.variationId || item.id);
                                const currentItem = isEditing && draftItem ? draftItem : item;
                                const status = currentItem.stock === 0 ? 'out' : currentItem.stock <= currentItem.threshold ? 'low' : 'good';
                                
                                return (
                                    <tr key={`${item.id}-${item.variationId || 'main'}`} className={`transition-colors ${isEditing ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
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
                                            {isEditing ? (
                                                <>
                                                    <input 
                                                        type="text" 
                                                        value={currentItem.sku}
                                                        onChange={(e) => handleDraftChange('sku', e.target.value)}
                                                        className="w-32 text-xs border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1 bg-white"
                                                        placeholder="SKU"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={currentItem.barcode || ''}
                                                        onChange={(e) => handleDraftChange('barcode', e.target.value)}
                                                        className="w-32 text-xs border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1 bg-white block mt-1"
                                                        placeholder="Barcode"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-sm text-gray-900 font-mono">{item.sku}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{item.barcode || '-'}</div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {isEditing ? (
                                                <input 
                                                    type="number" 
                                                    value={currentItem.stock}
                                                    onChange={(e) => handleDraftChange('stock', Number(e.target.value))}
                                                    className="w-20 text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1 text-center bg-white"
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-900">{item.stock}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             {isEditing ? (
                                                <input 
                                                    type="number" 
                                                    value={currentItem.threshold}
                                                    onChange={(e) => handleDraftChange('threshold', Number(e.target.value))}
                                                    className="w-20 text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 border p-1 text-center bg-white"
                                                />
                                             ) : (
                                                <div className="text-sm text-gray-900">{item.threshold}</div>
                                             )}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {isEditing ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={handleCancelEdit} className="p-2 text-gray-400 hover:text-gray-600"><XCircle size={18}/></button>
                                                    <button onClick={handleSaveEdit} className="p-2 text-brand-600 hover:text-brand-800"><CheckCircle size={18}/></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleEditStart(item)} className="p-2 text-gray-400 hover:text-brand-600">
                                                    <Edit size={18}/>
                                                </button>
                                            )}
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