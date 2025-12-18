
import React, { useState, useEffect } from 'react';
import { CatalogService } from '../../services/storeService';
import { generateProductDescription } from '../../services/geminiService';
import { Product, SubscriptionPlan, ProductVariation, NutritionalInfo } from '../../types';
import { Plus, Trash2, X, ImageIcon, Sparkles, Layers, Lock, Loader, LayoutGrid, ClipboardList, Activity, FileText, Barcode, AlertCircle } from 'lucide-react';
import { useAuth } from '../../App';
import { InventoryControl } from './InventoryControl';

interface ProductInventoryProps {
  mode: 'products' | 'subscriptions';
}

type ViewMode = 'catalog' | 'inventory' | 'add';

export const ProductInventory: React.FC<ProductInventoryProps> = ({ mode }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 0, category: 'Signature Salads', ingredients: [],
    image: 'https://picsum.photos/400/400?random=' + Math.floor(Math.random() * 100),
    isSubscription: false, description: '', stock: 20, sku: '', barcode: '', lowStockThreshold: 5,
    subscriptionPlans: [], subscriptionFeatures: [], variations: [],
    nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    itemType: 'good', hsnSacCode: ''
  });
  
  const [hasVariations, setHasVariations] = useState(false);
  const [tempVariation, setTempVariation] = useState<Partial<ProductVariation>>({ name: '', price: 0, stock: 10, sku: '', barcode: '', lowStockThreshold: 5 });
  const [tempPlanDuration, setTempPlanDuration] = useState<'weekly' | 'bi-weekly' | 'monthly'>('weekly');
  const [tempPlanPrice, setTempPlanPrice] = useState<number>(0);
  const [ingredientInput, setIngredientInput] = useState('');

  useEffect(() => {
    refreshData();
  }, [mode]);

  useEffect(() => {
      // Reset view and form when mode switches
      setViewMode('catalog');
      setError(null);
      setNewProduct({
        name: '', price: 0, category: mode === 'subscriptions' ? 'Weekly Subscriptions' : 'Signature Salads', 
        ingredients: [], image: 'https://picsum.photos/400/400?random=' + Math.floor(Math.random() * 100),
        isSubscription: mode === 'subscriptions', description: '', stock: 20, sku: '', barcode: '', lowStockThreshold: 5,
        subscriptionPlans: [], subscriptionFeatures: [], variations: [],
        nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        itemType: mode === 'subscriptions' ? 'service' : 'good', 
        hsnSacCode: ''
      });
      setHasVariations(false);
  }, [mode]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
        const allProducts = await CatalogService.getProducts();
        setProducts(allProducts);
    } catch (err) {
        console.error("Failed to load products", err);
        setError("Failed to load inventory data. Please try refreshing.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    setError(null);
    
    try {
        // Logic for price/stock calculation based on variations/plans
        let finalPrice = Number(newProduct.price) || 0;
        let finalStock = Number(newProduct.stock) || 0;

        if (newProduct.isSubscription && newProduct.subscriptionPlans?.length) {
            finalPrice = Math.min(...newProduct.subscriptionPlans.map(p => p.price));
        } else if (hasVariations && newProduct.variations?.length) {
            finalPrice = Math.min(...newProduct.variations.map(v => v.price));
            finalStock = newProduct.variations.reduce((acc, v) => acc + v.stock, 0);
        }

        const product: Product = {
          id: Date.now().toString(),
          name: newProduct.name!,
          price: finalPrice,
          category: newProduct.category || 'Signature Salads',
          description: newProduct.description || 'Fresh and healthy.',
          image: newProduct.image!,
          isSubscription: mode === 'subscriptions',
          ingredients: newProduct.ingredients || [],
          stock: finalStock,
          sku: newProduct.sku,
          barcode: newProduct.barcode, // New
          lowStockThreshold: Number(newProduct.lowStockThreshold),
          subscriptionPlans: newProduct.subscriptionPlans,
          subscriptionFeatures: newProduct.subscriptionFeatures,
          variations: hasVariations ? newProduct.variations : [],
          nutritionalInfo: newProduct.nutritionalInfo,
          itemType: newProduct.itemType,
          hsnSacCode: newProduct.hsnSacCode
        };

        await CatalogService.addProduct(product);
        setViewMode('catalog');
        refreshData();
    } catch (err: any) {
        console.error("Failed to add product", err);
        setError(err.message || "Failed to save product. Please try again.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) return alert("Only Administrators can delete products.");
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await CatalogService.deleteProduct(id);
            refreshData();
        } catch (err: any) {
            alert("Failed to delete product: " + err.message);
        }
    }
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingAI(true);
    setError(null);
    try {
        const contextStr = mode === 'subscriptions'
            ? `Subscription Plan: ${newProduct.subscriptionFeatures?.join(', ')}`
            : `Ingredients: ${newProduct.ingredients?.join(", ")}`;
        const description = await generateProductDescription(newProduct.name || "", contextStr);
        setNewProduct({ ...newProduct, description });
    } catch (err) {
        setError("AI Generation failed. Check your API key or connection.");
    } finally {
        setIsGeneratingAI(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (file?: File) => {
      if(file) {
          try {
              const base64 = await convertFileToBase64(file);
              setNewProduct({...newProduct, image: base64});
          } catch (err) {
              setError("Failed to process image file.");
          }
      }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader className="animate-spin mx-auto text-brand-600"/></div>;

  return (
    <div className="bg-white shadow rounded-lg animate-fade-in overflow-hidden">
        {/* Unified Navigation Header */}
        <div className="border-b border-gray-200 bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                {mode === 'subscriptions' ? 'Plan Management' : 'Product Catalog'}
            </h3>
            
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <button
                    onClick={() => setViewMode('catalog')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'catalog' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <LayoutGrid size={16} /> Catalog View
                </button>
                <button
                    onClick={() => setViewMode('inventory')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'inventory' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <ClipboardList size={16} /> Stock & SKU
                </button>
                <button
                    onClick={() => setViewMode('add')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        viewMode === 'add' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <Plus size={16} /> Add New
                </button>
            </div>
        </div>

        {/* Global Error Display for Component */}
        {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-2 rounded-r-md">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-sm">Error Detected</p>
                    <p className="text-sm">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700"><X size={16}/></button>
            </div>
        )}

        {/* View Content */}
        {viewMode === 'catalog' && (
            <div className="p-6">
                <ul className="divide-y divide-gray-200">
                    {products.filter(p => mode === 'subscriptions' ? p.isSubscription : !p.isSubscription).map((product) => (
                        <li key={product.id} className="py-4 flex items-center justify-between group hover:bg-gray-50 rounded-lg px-2 transition-colors">
                            <div className="flex items-center">
                                <div className="relative">
                                    <img className="h-12 w-12 rounded-lg object-cover bg-gray-100 mr-4 border border-gray-200" src={product.image} alt="" />
                                    {product.stock <= 0 && <span className="absolute -top-1 -right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{product.name}</p>
                                    <div className="flex gap-2 items-center">
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                        {product.hsnSacCode && (
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-300">
                                                {product.itemType === 'service' ? 'SAC' : 'HSN'}: {product.hsnSacCode}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">₹{product.price.toFixed(2)}</p>
                                    <p className={`text-xs ${product.stock < (product.lowStockThreshold||5) ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                        {product.stock} in stock
                                    </p>
                                </div>
                                {isAdmin ? (
                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={18} /></button>
                                ) : <Lock size={16} className="text-gray-300"/>}
                            </div>
                        </li>
                    ))}
                    {products.filter(p => mode === 'subscriptions' ? p.isSubscription : !p.isSubscription).length === 0 && (
                        <div className="text-center py-12 text-gray-500">No items found. Click "Add New" to get started.</div>
                    )}
                </ul>
            </div>
        )}

        {viewMode === 'inventory' && (
            <InventoryControl filterMode={mode} />
        )}

        {viewMode === 'add' && (
            <form onSubmit={handleAddProduct} className="p-6 bg-gray-50/50">
                {/* Form Inputs - Simplified Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border border-gray-300 p-2" 
                            value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    </div>
                    {mode === 'products' && !hasVariations && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                            <input type="number" step="0.01" required className="mt-1 block w-full rounded-md border border-gray-300 p-2" 
                                value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                        </div>
                    )}
                    {mode === 'products' && !hasVariations && (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Stock</label>
                                <input type="number" required className="mt-1 block w-full rounded-md border border-gray-300 p-2" 
                                    value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">SKU</label>
                                <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 p-2" 
                                    value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} placeholder="SKU-123" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><Barcode size={12}/> Barcode</label>
                                <input type="text" className="mt-1 block w-full rounded-md border border-gray-300 p-2" 
                                    value={newProduct.barcode} onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})} placeholder="Scanner" />
                            </div>
                        </div>
                    )}

                    {/* Taxation Classification */}
                    <div className="md:col-span-2 bg-blue-50 p-4 rounded border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><FileText size={14}/> Taxation Classification</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-blue-900 mb-1">Item Type</label>
                                <select 
                                    className="block w-full rounded-md border-gray-300 p-2 text-sm border"
                                    value={newProduct.itemType} 
                                    onChange={(e) => setNewProduct({...newProduct, itemType: e.target.value as 'good' | 'service'})}
                                >
                                    <option value="good">Goods (HSN)</option>
                                    <option value="service">Services (SAC)</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-blue-900 mb-1">
                                    {newProduct.itemType === 'good' ? 'HSN Code' : 'SAC Code'}
                                </label>
                                <input 
                                    type="text" 
                                    className="block w-full rounded-md border-gray-300 p-2 text-sm border uppercase"
                                    placeholder={newProduct.itemType === 'good' ? 'e.g. 2106' : 'e.g. 9963'}
                                    value={newProduct.hsnSacCode}
                                    onChange={(e) => setNewProduct({...newProduct, hsnSacCode: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Ingredients & Category */}
                    {mode === 'products' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                                    value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}>
                                    <option>Signature Salads</option>
                                    <option>Warm Bowls</option>
                                    <option>Cold Pressed Juices</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="text" className="block w-full rounded-md border border-gray-300 p-2"
                                        value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)}
                                        placeholder="Add ingredient..."
                                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if(ingredientInput) { setNewProduct({...newProduct, ingredients: [...(newProduct.ingredients || []), ingredientInput]}); setIngredientInput(''); }}}}
                                    />
                                    <button type="button" onClick={() => { if(ingredientInput) { setNewProduct({...newProduct, ingredients: [...(newProduct.ingredients || []), ingredientInput]}); setIngredientInput(''); }}} className="bg-brand-600 text-white px-3 py-2 rounded">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {newProduct.ingredients?.map((ing, idx) => (
                                        <span key={idx} className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">{ing}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Nutritional Info (For Comparison) */}
                    {mode === 'products' && (
                        <div className="md:col-span-2 bg-orange-50 p-4 rounded border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2"><Activity size={14}/> Nutritional Info (Per Serving)</h4>
                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <label className="text-xs text-gray-600">Calories (kcal)</label>
                                    <input type="number" className="w-full border rounded p-1 text-sm" value={newProduct.nutritionalInfo?.calories} onChange={e => setNewProduct({...newProduct, nutritionalInfo: {...newProduct.nutritionalInfo!, calories: Number(e.target.value)}})} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Protein (g)</label>
                                    <input type="number" className="w-full border rounded p-1 text-sm" value={newProduct.nutritionalInfo?.protein} onChange={e => setNewProduct({...newProduct, nutritionalInfo: {...newProduct.nutritionalInfo!, protein: Number(e.target.value)}})} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Carbs (g)</label>
                                    <input type="number" className="w-full border rounded p-1 text-sm" value={newProduct.nutritionalInfo?.carbs} onChange={e => setNewProduct({...newProduct, nutritionalInfo: {...newProduct.nutritionalInfo!, carbs: Number(e.target.value)}})} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600">Fat (g)</label>
                                    <input type="number" className="w-full border rounded p-1 text-sm" value={newProduct.nutritionalInfo?.fat} onChange={e => setNewProduct({...newProduct, nutritionalInfo: {...newProduct.nutritionalInfo!, fat: Number(e.target.value)}})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Variations Logic */}
                    {mode === 'products' && (
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input type="checkbox" checked={hasVariations} onChange={(e) => setHasVariations(e.target.checked)} className="rounded border-gray-300 text-brand-600" />
                                <Layers size={14} /> Product has variations
                            </label>
                            {hasVariations && (
                                <div className="mt-2 bg-gray-100 p-3 rounded">
                                    <div className="flex gap-2 items-end">
                                        <input type="text" placeholder="Name" className="flex-1 rounded p-1 border" value={tempVariation.name} onChange={e => setTempVariation({...tempVariation, name: e.target.value})} />
                                        <input type="number" placeholder="Price" className="w-16 rounded p-1 border" value={tempVariation.price} onChange={e => setTempVariation({...tempVariation, price: Number(e.target.value)})} />
                                        <input type="number" placeholder="Stock" className="w-16 rounded p-1 border" value={tempVariation.stock} onChange={e => setTempVariation({...tempVariation, stock: Number(e.target.value)})} />
                                        <input type="text" placeholder="SKU" className="w-20 rounded p-1 border" value={tempVariation.sku} onChange={e => setTempVariation({...tempVariation, sku: e.target.value})} />
                                        <input type="text" placeholder="Barcode" className="w-20 rounded p-1 border" value={tempVariation.barcode} onChange={e => setTempVariation({...tempVariation, barcode: e.target.value})} />
                                        <button type="button" onClick={() => {
                                            if(tempVariation.name) {
                                                setNewProduct({...newProduct, variations: [...(newProduct.variations||[]), {
                                                    id: Date.now().toString(), 
                                                    name: tempVariation.name!, 
                                                    price: Number(tempVariation.price), 
                                                    stock: Number(tempVariation.stock),
                                                    sku: tempVariation.sku,
                                                    barcode: tempVariation.barcode, // New
                                                    lowStockThreshold: 5
                                                }]});
                                                setTempVariation({name:'', price:0, stock:10, sku: '', barcode: '', lowStockThreshold: 5});
                                            }
                                        }} className="bg-brand-600 text-white px-3 py-1 rounded">Add</button>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {newProduct.variations?.map(v => `${v.name} (Stock: ${v.stock}, SKU: ${v.sku || 'N/A'})`).join(', ')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Subscriptions Logic */}
                    {mode === 'subscriptions' && (
                         <div className="md:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                            <div className="flex gap-2 items-end mb-3">
                                <select className="flex-1 rounded border p-1" value={tempPlanDuration} onChange={(e) => setTempPlanDuration(e.target.value as any)}>
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                                <input type="number" className="flex-1 rounded border p-1" value={tempPlanPrice} onChange={(e) => setTempPlanPrice(Number(e.target.value))} />
                                <button type="button" onClick={() => {
                                    if(tempPlanPrice > 0) setNewProduct({...newProduct, subscriptionPlans: [...(newProduct.subscriptionPlans||[]), {duration: tempPlanDuration, price: tempPlanPrice}]});
                                }} className="bg-blue-600 text-white px-3 py-1 rounded">Add Plan</button>
                            </div>
                            <div className="text-xs text-gray-500">
                                {newProduct.subscriptionPlans?.map(p => `${p.duration}: ₹${p.price}`).join(', ')}
                            </div>
                         </div>
                    )}

                    {/* Image & Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Image</label>
                        <div className="flex gap-4 mt-2">
                            <div className="h-16 w-16 bg-gray-100 rounded border overflow-hidden">
                                {newProduct.image ? <img src={newProduct.image} className="h-full w-full object-cover" /> : <ImageIcon className="m-auto mt-4 text-gray-400"/>}
                            </div>
                            <div className="flex-1">
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"/>
                                <input type="text" placeholder="Or Image URL" value={newProduct.image?.startsWith('data') ? '' : newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className="mt-2 block w-full rounded-md border border-gray-300 p-2 text-xs" />
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea className="mt-1 block w-full rounded-md border border-gray-300 p-2" rows={3} value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                        <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingAI} className="mt-2 text-sm text-brand-600 flex items-center gap-1">
                            <Sparkles size={16} /> {isGeneratingAI ? 'Generating...' : 'Generate with Gemini AI'}
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setViewMode('catalog')} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-md hover:bg-brand-700 shadow-md">Create Item</button>
                </div>
            </form>
        )}
    </div>
  );
};
