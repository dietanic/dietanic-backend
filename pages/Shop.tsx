
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CatalogService } from '../services/storeService';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Filter, Search, Loader, X } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
            CatalogService.getProducts(),
            CatalogService.getCategories()
        ]);
        setProducts(prodData);
        setCategories(catData);
        setLoading(false);
    };
    fetchData();
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
    
    // AND Logic: Show product if it contains ALL selected ingredients
    // If no ingredients selected, match all
    const matchesIngredient = selectedIngredients.length === 0 || 
                              selectedIngredients.every(ing => product.ingredients?.includes(ing));
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(term) || 
                          product.ingredients?.some(ing => ing.toLowerCase().includes(term));
    return matchesCategory && matchesIngredient && matchesSearch;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
           <p className="mt-2 text-gray-600">Explore our selection of fresh salads, bowls, and subscription plans.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </h3>
                  {(selectedCategory !== 'All' || selectedIngredients.length > 0) && (
                      <button 
                        onClick={() => { setSelectedCategory('All'); setSelectedIngredients([]); }}
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                      >
                          Reset
                      </button>
                  )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</h4>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Items
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {allIngredients.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ingredients (Select Multiple)</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {allIngredients.map(ing => (
                            <label key={ing} className="flex items-center gap-2 cursor-pointer group">
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
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-4 rounded-lg shadow-lg text-white">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                    <span>🥗</span> Ask the Dietitian
                </h3>
                <p className="text-xs text-brand-100 mb-3">Not sure what to pick? Ask our AI!</p>
                <form onSubmit={handleAskAI} className="space-y-2">
                    <input 
                        type="text" 
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        placeholder="e.g. Is kale good for..." 
                        className="w-full text-sm px-3 py-2 rounded text-gray-900 focus:outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={chatLoading}
                        className="w-full bg-white text-brand-700 text-xs font-bold py-2 rounded hover:bg-brand-50 transition"
                    >
                        {chatLoading ? 'Thinking...' : 'Ask AI'}
                    </button>
                </form>
                {chatResponse && (
                    <div className="mt-3 bg-white/10 p-2 rounded text-xs leading-relaxed animate-fade-in">
                        {chatResponse}
                    </div>
                )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
                  placeholder="Search for salads, ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader className="animate-spin text-brand-600 h-10 w-10" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No fresh goodies found matching your criteria.</p>
                    <button onClick={() => {setSelectedCategory('All'); setSelectedIngredients([]); setSearchTerm('')}} className="mt-4 text-brand-600 hover:underline">Clear Filters</button>
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
