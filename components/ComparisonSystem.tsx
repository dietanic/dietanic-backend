
import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types';
import { X, BarChart2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComparisonContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearComparison: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within a ComparisonProvider');
  return context;
};

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (compareList.find(p => p.id === product.id)) return;
    if (compareList.length >= 3) {
      alert("You can only compare up to 3 products at a time.");
      return;
    }
    setCompareList(prev => [...prev, product]);
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  const clearComparison = () => {
    setCompareList([]);
  };

  const isInCompare = (productId: string) => compareList.some(p => p.id === productId);

  return (
    <ComparisonContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearComparison }}>
      {children}
      <ComparisonFloatingBar />
    </ComparisonContext.Provider>
  );
};

const ComparisonFloatingBar: React.FC = () => {
  const { compareList, removeFromCompare, clearComparison } = useComparison();
  const [isOpen, setIsOpen] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 p-4 transform transition-transform duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-700 whitespace-nowrap">Compare ({compareList.length}/3):</h3>
            {compareList.map(p => (
              <div key={p.id} className="relative group">
                <img src={p.image} alt={p.name} className="h-12 w-12 rounded object-cover border border-gray-200" />
                <button 
                  onClick={() => removeFromCompare(p.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
             <button onClick={() => clearComparison()} className="text-sm text-gray-500 hover:text-gray-700 underline">Clear</button>
             <button 
                onClick={() => setIsOpen(true)}
                disabled={compareList.length < 2}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                    compareList.length < 2 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md'
                }`}
             >
                <BarChart2 size={16} /> Compare Now
             </button>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-6 overflow-hidden animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Comparison</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-gray-100 w-1/4"></th>
                      {compareList.map(p => (
                        <th key={p.id} className="p-4 border-b border-gray-100 w-1/4 align-top">
                          <img src={p.image} className="h-32 w-full object-cover rounded-lg mb-3" alt={p.name} />
                          <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                          <Link to={`/product/${p.id}`} onClick={() => setIsOpen(false)} className="text-xs text-brand-600 hover:underline">View Details</Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50">Price</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-4 border-b border-gray-100 font-bold text-brand-700">₹{p.price}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50">Stock Status</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-4 border-b border-gray-100">
                            {p.stock > 0 ? (
                                <span className="text-green-600 flex items-center gap-1"><Check size={14}/> In Stock ({p.stock})</span>
                            ) : (
                                <span className="text-red-500">Out of Stock</span>
                            )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50">Category</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-4 border-b border-gray-100">{p.category}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50">Key Ingredients</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-4 border-b border-gray-100 text-xs text-gray-600">
                            {p.ingredients?.slice(0, 5).join(', ')}
                        </td>
                      ))}
                    </tr>
                    {/* Nutritional Info Rows */}
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50">Calories</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-4 border-b border-gray-100">
                            {p.nutritionalInfo?.calories ? `${p.nutritionalInfo.calories} kcal` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-bold text-gray-500 bg-gray-50">Protein</td>
                      {compareList.map(p => (
                        <td key={p.id} className="p-4 border-b border-gray-100">
                            {p.nutritionalInfo?.protein ? `${p.nutritionalInfo.protein}g` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
