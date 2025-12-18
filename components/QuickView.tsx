
import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingCart, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, ProductVariation } from '../types';
import { useCart } from '../App';
import { EngagementService } from '../services/storeService';

interface QuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickView: React.FC<QuickViewProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  
  // State
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'standard' | 'wholesale'>('standard');
  
  // Ratings State (Self-contained data fetching)
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Initialize Variations
  useEffect(() => {
    if (isOpen && product.variations && product.variations.length > 0) {
      // Find first in-stock variation or default to first
      const firstInStock = product.variations.find(v => v.stock > 0);
      setSelectedVariation(firstInStock || product.variations[0]);
    } else {
        setSelectedVariation(undefined);
    }
  }, [isOpen, product]);

  // Reset Quantity and Tier on Open
  useEffect(() => {
    if (isOpen) {
        setQuantity(1);
        setAdded(false);
        setSelectedTier('standard');
    }
  }, [isOpen]);

  // Handle Escape Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Fetch Ratings on Open
  useEffect(() => {
    if (isOpen) {
      setLoadingRatings(true);
      EngagementService.getProductReviews(product.id).then(reviews => {
        if (reviews.length > 0) {
          const total = reviews.reduce((acc, r) => acc + r.rating, 0);
          setAvgRating(total / reviews.length);
          setReviewCount(reviews.length);
        } else {
          setAvgRating(0);
          setReviewCount(0);
        }
        setLoadingRatings(false);
      });
    }
  }, [isOpen, product.id]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultPlan = product.isSubscription && product.subscriptionPlans ? product.subscriptionPlans[0] : undefined;
    let variationToAdd = selectedVariation;
    
    // Default to first variation if needed and valid
    if (!variationToAdd && product.variations && product.variations.length > 0) {
        variationToAdd = product.variations[0];
    }
    
    // Check stock for variation
    if (variationToAdd && variationToAdd.stock <= 0) {
        alert("Selected option is out of stock");
        return;
    }

    addToCart(product, defaultPlan, variationToAdd, quantity, selectedTier);
    
    setAdded(true);
    setTimeout(() => {
        setAdded(false);
        onClose();
    }, 1000);
  };

  // Determine availability of tier selector: Only for simple products
  const showTierSelector = product.wholesalePrice && !product.isSubscription && (!product.variations || product.variations.length === 0);

  // Determine displayed price and stock
  const displayPrice = (selectedTier === 'wholesale' && showTierSelector && product.wholesalePrice)
      ? product.wholesalePrice
      : (selectedVariation ? selectedVariation.price : product.price);
      
  const currentStock = selectedVariation ? selectedVariation.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
            aria-hidden="true" 
            onClick={onClose}
        ></div>
        
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl animate-scale-in">
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              className="rounded-full bg-white/80 p-2 text-gray-400 hover:text-gray-500 hover:bg-white focus:outline-none transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-64 md:h-auto bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="p-8 flex flex-col bg-white">
              <div className="mb-2">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{product.name}</h2>
                <p className="text-sm text-brand-600 font-bold uppercase tracking-wide mt-1">{product.category}</p>
              </div>
              
              {/* Rating Display */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={`${i < Math.round(avgRating) ? 'fill-current text-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  {loadingRatings ? '...' : `(${reviewCount} reviews)`}
                </span>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed flex-grow text-base">
                {product.description}
              </p>

              {/* Ingredients / Features */}
              {product.ingredients && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {product.ingredients.slice(0, 4).map((ing, i) => (
                    <span key={i} className="text-xs font-semibold bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full border border-brand-100">
                      {ing}
                    </span>
                  ))}
                </div>
              )}

              {/* Price Tier Selector */}
              {showTierSelector && (
                  <div className="mb-6">
                      <span className="text-sm font-medium text-gray-900 block mb-2">Pricing Tier:</span>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button 
                              onClick={() => setSelectedTier('standard')} 
                              className={`flex-1 text-sm font-bold py-1.5 rounded-md transition-all ${selectedTier === 'standard' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Standard
                          </button>
                          <button 
                              onClick={() => setSelectedTier('wholesale')} 
                              className={`flex-1 text-sm font-bold py-1.5 rounded-md transition-all ${selectedTier === 'wholesale' ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              Wholesale
                          </button>
                      </div>
                  </div>
              )}

              {/* Variations Selector */}
              {product.variations && product.variations.length > 0 && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-900 block mb-2">Options:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.map((v) => {
                      const vStock = v.stock;
                      const vOutOfStock = vStock <= 0;
                      return (
                        <button
                          key={v.id}
                          onClick={() => !vOutOfStock && setSelectedVariation(v)}
                          disabled={vOutOfStock}
                          className={`px-3 py-1.5 rounded-md text-sm border transition-all relative ${
                            selectedVariation?.id === v.id
                              ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                              : 'border-gray-200 text-gray-700 hover:border-brand-300'
                          } ${vOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                        >
                          {v.name}
                          {vOutOfStock && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900">₹{displayPrice.toFixed(2)}</p>
                        {selectedTier === 'wholesale' && showTierSelector && (
                            <span className="text-sm text-gray-400 line-through">₹{product.price.toFixed(2)}</span>
                        )}
                    </div>
                    {product.isSubscription && <span className="text-xs text-brand-600 font-semibold uppercase">Starting price</span>}
                    {isOutOfStock && <span className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1"><AlertCircle size={12}/> Out of Stock</span>}
                  </div>
                  
                  {/* Quantity */}
                  <div className={`flex items-center border border-gray-300 rounded-md ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-r border-gray-300"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >-</button>
                    <span className="px-3 py-1 text-gray-900 font-medium w-8 text-center">{quantity}</span>
                    <button 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-l border-gray-300"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    >+</button>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                    added 
                      ? 'bg-green-600 text-white shadow-green-200' 
                      : isOutOfStock
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none hover:translate-y-0'
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'
                  }`}
                >
                  {added ? <Check size={20} strokeWidth={3} /> : <ShoppingCart size={20} strokeWidth={2.5} />}
                  {added ? 'Added' : (isOutOfStock ? 'Out of Stock' : 'Add to Cart')}
                </button>
              </div>
              
              <Link to={`/product/${product.id}`} className="mt-4 text-center text-sm text-gray-500 font-medium hover:text-brand-600 hover:underline transition-colors block">
                View Full Product Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
