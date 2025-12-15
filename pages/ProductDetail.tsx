import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CatalogService, EngagementService } from '../services/storeService';
import { Product, Review, SubscriptionPlan, ProductVariation } from '../types';
import { useCart, useAuth } from '../App';
import { Star, ShoppingCart, ArrowLeft, User, CheckCircle, Calendar, Loader, Plus, Minus } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        
        const [prod, revs] = await Promise.all([
            CatalogService.getProductById(id),
            EngagementService.getProductReviews(id)
        ]);

        setProduct(prod);
        setReviews(revs);
        
        // Defaults
        if (prod) {
            if (prod.isSubscription && prod.subscriptionPlans && prod.subscriptionPlans.length > 0) {
                setSelectedPlan(prod.subscriptionPlans[0]);
            }
            if (prod.variations && prod.variations.length > 0) {
                setSelectedVariation(prod.variations[0]);
            }
        }
        setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, selectedPlan, selectedVariation, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !comment.trim()) return;

    setIsSubmitting(true);
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      productId: product.id,
      userId: user.id,
      userName: user.name,
      rating: rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };

    await EngagementService.addReview(newReview);
    // Refresh list
    const updatedReviews = await EngagementService.getProductReviews(product.id);
    setReviews(updatedReviews);
    
    setComment('');
    setRating(5);
    setIsSubmitting(false);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  // Calculate Price based on Variation or Subscription Plan
  const currentPrice = selectedVariation 
      ? selectedVariation.price 
      : (selectedPlan ? selectedPlan.price : product?.price || 0);
  
  // Calculate Stock display
  const currentStock = selectedVariation ? selectedVariation.stock : product?.stock || 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-brand-600"/></div>;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/shop" className="text-brand-600 hover:text-brand-500 mt-4 inline-block">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/shop" className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
        </Link>

        {/* Product Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="h-96 w-full object-cover object-center rounded-lg shadow-sm"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-brand-600 font-semibold uppercase">{product.category}</p>
            
            <div className="mt-4 flex items-center">
               <div className="flex items-center text-yellow-400">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="ml-2 text-lg font-medium text-gray-900">{averageRating}</span>
               </div>
               <span className="mx-2 text-gray-300">|</span>
               <span className="text-sm text-gray-500">{reviews.length} reviews</span>
            </div>

            <p className="mt-6 text-lg text-gray-700 leading-relaxed">{product.description}</p>
            
            {/* Ingredients Section */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!product.isSubscription && !product.variations && (
                <p className="mt-4 text-sm text-gray-500 italic">Approx. Serving: 400g (18 cm Bowl)</p>
            )}

            {/* Subscription Plans Selector */}
            {product.isSubscription && product.subscriptionPlans && (
                <div className="mt-8 bg-brand-50 p-4 rounded-lg border border-brand-100">
                    <h3 className="font-semibold text-brand-900 flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4"/> Choose Plan Duration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {product.subscriptionPlans.map((plan) => (
                            <button
                                key={plan.duration}
                                onClick={() => setSelectedPlan(plan)}
                                className={`flex flex-col items-center p-3 rounded-md border-2 transition-all ${
                                    selectedPlan?.duration === plan.duration 
                                    ? 'border-brand-600 bg-white shadow-sm ring-1 ring-brand-600'
                                    : 'border-transparent bg-white hover:border-gray-300'
                                }`}
                            >
                                <span className="capitalize font-medium text-sm text-gray-900">{plan.duration}</span>
                                <span className="text-xs text-gray-500 font-bold mt-1">₹{plan.price}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Variations Selector */}
            {product.variations && product.variations.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Available Options</h3>
                    <div className="flex flex-wrap gap-3">
                        {product.variations.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVariation(v)}
                                className={`px-4 py-2 rounded-md text-sm border-2 transition-all ${
                                    selectedVariation?.id === v.id
                                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                                        : 'border-gray-200 text-gray-700 hover:border-brand-300 bg-white'
                                }`}
                            >
                                <span className="font-medium block">{v.name}</span>
                                <span className="text-xs opacity-75">₹{v.price}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                   <div className="flex-1">
                       <p className="text-3xl font-bold text-gray-900">₹{currentPrice.toFixed(2)}</p>
                       {product.isSubscription && <p className="text-sm text-gray-500">per {selectedPlan?.duration}</p>}
                   </div>
                   
                   {/* Quantity Selector */}
                   <div className="flex items-center border border-gray-300 rounded-md bg-white">
                        <button 
                            className="px-4 py-3 text-gray-600 hover:bg-gray-50 border-r border-gray-300 transition-colors"
                            onClick={() => handleQuantityChange(-1)}
                        >
                            <Minus size={16} />
                        </button>
                        <span className="px-4 py-3 text-gray-900 font-bold w-12 text-center">{quantity}</span>
                        <button 
                            className="px-4 py-3 text-gray-600 hover:bg-gray-50 border-l border-gray-300 transition-colors"
                            onClick={() => handleQuantityChange(1)}
                        >
                            <Plus size={16} />
                        </button>
                   </div>

                   <button
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md px-8 py-3.5 text-base font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-md ${
                      added ? 'bg-green-600 shadow-green-200' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
                    }`}
                  >
                    {added ? <CheckCircle className="h-5 w-5"/> : <ShoppingCart className="h-5 w-5"/>}
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                </div>
                
                {currentStock < 10 && currentStock > 0 && (
                    <p className="mt-3 text-sm text-red-600 font-medium animate-pulse">
                        Only {currentStock} left in stock - order soon!
                    </p>
                )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Review List */}
            <div className="lg:col-span-7 space-y-8">
              {reviews.length === 0 ? (
                <p className="text-gray-500 italic">No reviews yet. Be the first to share your thoughts!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="flex space-x-4 p-6 bg-gray-50 rounded-xl">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-brand-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">{review.userName}</h3>
                        <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-1 flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Write Review Form */}
            <div className="lg:col-span-5">
               <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
                  <form onSubmit={handleSubmitReview}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                      <textarea
                        rows={4}
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                        placeholder="How was the taste? freshness?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                       <p className="text-xs text-gray-500">Posting as <span className="font-semibold">{user.name}</span></p>
                       <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 transition-colors"
                      >
                        Submit Review
                      </button>
                    </div>
                  </form>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};