
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CatalogService, GlobalEventBus, EVENTS } from '../services/storeService';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Filter, Search, Loader, X, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { askNutritionist } from '../services/geminiService';

export const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // AI Chat State
  const [chatQuery, setChatQuery] = useState<string>('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchData = async () => {
      // Silent refresh option could be implemented, but for now we set loading on initial only
      if (products.length === 0) setLoading(true);
      const [prodData, catData] = await Promise.all([
          CatalogService.getProducts(),
          CatalogService.getCategories()
      ]);
      setProducts(prodData);
      setCategories(catData);
      setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time updates from Admin/POS
    const handleUpdate = () => {
        console.log('🔄 Shop: Detecting catalog update, refreshing grid...');
        fetchData();
    };

    GlobalEventBus.on(EVENTS.PRODUCT_UPDATED, handleUpdate);
    GlobalEventBus.on(EVENTS.ORDER_CREATED, handleUpdate); // Sync stock when order placed

    return () => {
        GlobalEventBus.off(EVENTS.PRODUCT_UPDATED, handleUpdate);
        GlobalEventBus.off(EVENTS.ORDER_CREATED, handleUpdate);
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  const allIngredients = Array.from(new Set(products.flatMap(p => p.ingredients || []))).sort() as string[];

  const toggleIngredient = (ingredient: string) => {
      setSelectedIngredients(prev => 
          prev.includes(ingredient)
              ? prev.filter(i => i !== ingredient)
              : [...prev, ingredient]
      );
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    // AND Logic: Show product if it contains ALL selected ingredients from the sidebar filter
    const matchesIngredientFilter = selectedIngredients.length === 0 || 
                              selectedIngredients.every(ing => product.ingredients?.includes(ing));
    
    // Search Logic: Matches Name OR Ingredients dynamically
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
                          product.name.toLowerCase().includes(term) || 
                          product.ingredients?.some(ing => ing.toLowerCase().includes(term));

    return matchesCategory && matchesIngredientFilter && matchesSearch;
  });

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    setChatLoading(true);
    setChatResponse('');
    const answer = await askNutritionist(chatQuery);
    setChatResponse(answer);
    setChatLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white shadow-sm border-b border-gray-200">
        {/* Added pt-28 to push content below fixed navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
           <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
           <p className="mt-2 text-gray-600">Explore our selection of fresh salads, bowls, and subscription plans.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </h3>
                  {(selectedCategory !== 'All' || selectedIngredients.length > 0) && (
                      <button 
                        onClick={() => { setSelectedCategory('All'); setSelectedIngredients([]); }}
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium bg-brand-50 px-2 py-1 rounded-md"
                      >
                          Reset All
                      </button>
                  )}
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</h4>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Items
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category.name
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {allIngredients.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ingredients</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {allIngredients.map(ing => (
                            <label key={ing} className="flex items-center gap-2 cursor-pointer group p-1 hover:bg-gray-50 rounded">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox"
                                        className="peer h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                        checked={selectedIngredients.includes(ing)}
                                        onChange={() => toggleIngredient(ing)}
                                    />
                                </div>
                                <span className={`text-sm group-hover:text-brand-700 transition-colors ${selectedIngredients.includes(ing) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                    {ing}
                                </span>
                            </label>
                        ))}
                    </div>
                    {selectedIngredients.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">{selectedIngredients.length} selected</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedIngredients.map(ing => (
                                    <span key={ing} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-brand-50 text-brand-700 border border-brand-100">
                                        {ing}
                                        <button onClick={() => toggleIngredient(ing)} className="ml-1 hover:text-brand-900"><X size={10}/></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              )}
            </div>

            {/* AI Nutritionist Mini Widget */}
            <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-5 rounded-xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <h3 className="font-bold flex items-center gap-2 mb-2 relative z-10">
                    <span>🥗</span> Ask the Dietitian
                </h3>
                <p className="text-xs text-brand-100 mb-3 relative z-10">Not sure what to pick? Ask our AI!</p>
                <form onSubmit={handleAskAI} className="space-y-2 relative z-10">
                    <input 
                        type="text" 
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        placeholder="e.g. Is kale good for..." 
                        className="w-full text-sm px-3 py-2 rounded-lg text-gray-900 focus:outline-none shadow-inner"
                    />
                    <button 
                        type="submit" 
                        disabled={chatLoading}
                        className="w-full bg-white text-brand-800 text-xs font-bold py-2 rounded-lg hover:bg-brand-50 transition shadow-sm disabled:opacity-75"
                    >
                        {chatLoading ? 'Thinking...' : 'Ask AI'}
                    </button>
                </form>
                {chatResponse && (
                    <div className="mt-3 bg-black/20 p-3 rounded-lg text-xs leading-relaxed animate-fade-in border border-white/10 relative z-10">
                        {chatResponse}
                    </div>
                )}
            </div>
          </div>

          {/* Product Grid & Search */}
          <div className="flex-1">
            {/* Prominent Search Bar */}
            <div className="mb-8 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-brand-500 transition-colors" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-10 py-4 border-2 border-gray-100 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 sm:text-lg shadow-sm transition-all duration-300"
                placeholder="Search salads, bowls, or ingredients (e.g. 'Avocado')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                      <X className="h-5 w-5" />
                  </button>
              )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="animate-spin text-brand-600 h-10 w-10 mb-4" />
                    <p className="text-gray-500 animate-pulse">Fetching fresh menu...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No matches found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                    <button 
                        onClick={() => {setSelectedCategory('All'); setSelectedIngredients([]); setSearchTerm('')}} 
                        className="mt-6 text-brand-600 hover:text-brand-800 font-bold hover:underline"
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
