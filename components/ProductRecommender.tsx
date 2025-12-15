
import React, { useEffect, useState } from 'react';
import { CatalogService } from '../services/storeService';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import { useCart } from '../App';

interface ProductRecommenderProps {
  currentProductId?: string; // If on detail page, exclude this
  category?: string; // Recommend from same category
  limit?: number;
  title?: string;
}

export const ProductRecommender: React.FC<ProductRecommenderProps> = ({ currentProductId, category, limit = 4, title = "You might also like" }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetch = async () => {
      const all = await CatalogService.getProducts();
      let filtered = all.filter(p => p.id !== currentProductId);
      
      if (category) {
        // Prioritize same category, but fill with others if not enough
        const sameCat = filtered.filter(p => p.category === category);
        const others = filtered.filter(p => p.category !== category);
        filtered = [...sameCat, ...others];
      } else {
        // Random shuffle for variety
        filtered = filtered.sort(() => 0.5 - Math.random());
      }
      
      setProducts(filtered.slice(0, limit));
    };
    fetch();
  }, [currentProductId, category, limit]);

  if (products.length === 0) return null;

  return (
    <div className="py-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(product);
                }}
                className="absolute bottom-2 right-2 bg-white text-brand-600 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-600 hover:text-white"
                title="Quick Add"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="p-3">
              <Link to={`/product/${product.id}`} className="block">
                <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-700">₹{product.price}</span>
                    {/* Simulated Rating for visual appeal */}
                    <div className="flex items-center text-[10px] text-gray-400">
                        <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1"/> 4.8
                    </div>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
