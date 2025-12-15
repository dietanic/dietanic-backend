import React, { useState, useEffect } from 'react';
import { Plus, Check, Heart, Eye, Star, Share2 } from 'lucide-react';
import { Product } from '../types';
import { useCart, useWishlist } from '../App';
import { Link } from 'react-router-dom';
import { EngagementService } from '../services/storeService';
import { QuickView } from './QuickView';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  // Card Quantity State
  const [cardQuantity, setCardQuantity] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Rating State for Card Face
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingRatings, setLoadingRatings] = useState(true);

  const inWishlist = isInWishlist(product.id);

  // Fetch ratings on mount so they appear on the card
  useEffect(() => {
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
  }, [product.id]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    // If subscription, use first plan as default
    const defaultPlan = product.isSubscription && product.subscriptionPlans ? product.subscriptionPlans[0] : undefined;
    
    // Default variation if exists
    let variationToAdd = undefined;
    if (product.variations && product.variations.length > 0) {
        variationToAdd = product.variations[0];
    }

    addToCart(product, defaultPlan, variationToAdd, cardQuantity);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist(product.id);
  };

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const url = `${window.location.origin}/#/product/${product.id}`;
      navigator.clipboard.writeText(url).then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
      });
  };
  
  const handleOpenQuickView = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsQuickViewOpen(true);
  };
  
  const handleCloseQuickView = () => {
      setIsQuickViewOpen(false);
  };

  return (
    // Outer div wrapper to accommodate the modal without breaking grid layouts
    <div className="h-full relative">
        {/* Actual Card */}
        <div className="group relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
            <Link to={`/product/${product.id}`} className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-100 xl:aspect-w-7 xl:aspect-h-8 relative block group-hover:shadow-inner">
                <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="h-64 w-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Action Buttons (Wishlist & Share) */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                    <button 
                        onClick={handleToggleWishlist}
                        className="bg-white/90 p-2 rounded-full shadow-sm hover:bg-white transition-colors hover:scale-110 active:scale-95"
                        title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <Heart 
                            className={`h-5 w-5 transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} 
                        />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="bg-white/90 p-2 rounded-full shadow-sm hover:bg-white transition-colors hover:scale-110 active:scale-95"
                        title="Share Product"
                    >
                        {shareCopied ? (
                            <Check className="h-5 w-5 text-green-600" />
                        ) : (
                            <Share2 className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                        )}
                    </button>
                </div>

                {product.isSubscription && (
                <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    Subscription
                </span>
                )}
                
                {/* Overlay for Quick View */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                    <button
                        onClick={handleOpenQuickView}
                        className="bg-white text-brand-700 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 hover:bg-brand-600 hover:text-white transition-all transform hover:scale-105"
                    >
                        <Eye size={16} /> Quick View
                    </button>
                </div>
            </Link>

            <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                    <Link to={`/product/${product.id}`}>
                        <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mb-1">{product.category}</p>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-700 transition-colors leading-tight">{product.name}</h3>
                        
                        {/* Star Rating on Card */}
                        <div className="flex items-center gap-1 mt-1.5 min-h-[16px]">
                            {loadingRatings ? (
                                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                            ) : (
                                <>
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={12} 
                                                className={`${i < Math.round(avgRating) ? 'fill-current' : 'text-gray-300'}`} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">({reviewCount})</span>
                                </>
                            )}
                        </div>

                        <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
                    </Link>

                    {/* Ingredients Preview */}
                    {product.ingredients && product.ingredients.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                            {product.ingredients.slice(0, 3).map((ing, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                                    {ing}
                                </span>
                            ))}
                            {product.ingredients.length > 3 && (
                                <span className="text-[10px] text-gray-400 flex items-center">+{product.ingredients.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-5 flex items-center justify-between">
                    <div>
                        <p className="text-lg font-bold text-gray-900">
                            {product.isSubscription ? 'From ' : ''}₹{product.price.toFixed(2)}
                        </p>
                        {product.isSubscription && <span className="text-xs text-gray-400 font-medium">per week</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Quantity Selector on Card */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <select 
                                value={cardQuantity}
                                onChange={(e) => setCardQuantity(Number(e.target.value))}
                                className="block w-14 rounded-md border-gray-300 py-1.5 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-xs border text-center"
                            >
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleAdd}
                            className={`p-2 rounded-full transition-all duration-300 z-20 shadow-sm ${
                            added ? 'bg-brand-600 text-white scale-110' : 'bg-gray-100 text-gray-900 hover:bg-brand-600 hover:text-white hover:shadow-md'
                            }`}
                            title="Add to Cart"
                        >
                            {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick View Component */}
        <QuickView product={product} isOpen={isQuickViewOpen} onClose={handleCloseQuickView} />
    </div>
  );
};