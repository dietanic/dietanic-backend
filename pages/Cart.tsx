
import React, { useState, useEffect } from 'react';
import { useCart, useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard, Calendar, CheckCircle, Tag, Loader, AlertTriangle, Wallet, Truck, Zap, Clock } from 'lucide-react';
import { APIGateway, MarketingService } from '../services/storeService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { Order, CustomerProfile, TaxSettings } from '../types';
import { ProductRecommender } from '../components/ProductRecommender';

export const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Customer Profile for Wallet
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [useWallet, setUseWallet] = useState(false);

  // Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'scheduled'>('standard');

  // Discount State
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Tax Settings State
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({ isRegistered: false, gstin: '', state: 'Maharashtra' });

  // Constants
  const GST_RATE_FOOD = 0.05; // 5% for restaurant services/food

  useEffect(() => {
    const fetchData = async () => {
        if(user) {
            const [p, t] = await Promise.all([
                APIGateway.customer.getProfile(user),
                APIGateway.settings.getTax()
            ]);
            setProfile(p);
            setTaxSettings(t);
        }
    };
    fetchData();
  }, [user]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Calculate Shipping
  const getShippingCost = () => {
    if (deliveryMethod === 'standard') {
        return subtotal > 500 ? 0 : 50;
    }
    if (deliveryMethod === 'express') return 150;
    if (deliveryMethod === 'scheduled') return 100;
    return 0;
  };
  const shippingCost = getShippingCost();

  // Fiscal Position Logic (GST)
  // Only apply tax if registered
  const userState = user?.addresses[0]?.state || '';
  const storeState = taxSettings.state || 'Maharashtra';
  const isIntraState = !userState || userState.toLowerCase() === storeState.toLowerCase() || (userState.toLowerCase() === 'mh' && storeState === 'Maharashtra');
  
  // Tax Calculation
  const totalTax = taxSettings.isRegistered ? subtotal * GST_RATE_FOOD : 0;
  
  const taxDetails = taxSettings.isRegistered 
    ? (isIntraState 
        ? { type: 'INTRA', cgst: totalTax / 2, sgst: totalTax / 2 }
        : { type: 'INTER', igst: totalTax }
      )
    : { type: 'UR', amount: 0 }; // Unregistered

  const grandTotal = Math.max(0, subtotal + totalTax + shippingCost - discountAmount);

  // Wallet Logic
  const walletBalance = profile?.walletBalance || 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  const finalPayable = Math.max(0, grandTotal - walletDeduction);

  const handleApplyPromo = async () => {
    setPromoMessage(null);
    const code = promoCode.trim().toUpperCase();
    
    if (!code) return;

    setIsCheckingPromo(true);
    try {
        // Collect categories in cart for validation
        const cartCategories = Array.from(new Set(cartItems.map(item => item.category))) as string[];
        const discount = await APIGateway.promotion.validate(code, subtotal, cartCategories);
        
        if (discount) {
            let calculatedDiscount = 0;
            if (discount.type === 'percentage') {
                calculatedDiscount = subtotal * (discount.value / 100);
                setPromoMessage({ text: `${discount.value}% discount applied!`, type: 'success' });
            } else {
                calculatedDiscount = discount.value;
                setPromoMessage({ text: `₹${discount.value} discount applied!`, type: 'success' });
            }
            
            // Cap discount at subtotal
            if (calculatedDiscount > subtotal) calculatedDiscount = subtotal;

            setDiscountAmount(calculatedDiscount);
            setAppliedPromo(discount.code);
        }
    } catch (err: any) {
        setDiscountAmount(0);
        setAppliedPromo(null);
        setPromoMessage({ text: err.message || 'Invalid or expired promo code', type: 'error' });
    } finally {
        setIsCheckingPromo(false);
    }
  };

  const removePromo = () => {
      setPromoCode('');
      setDiscountAmount(0);
      setAppliedPromo(null);
      setPromoMessage(null);
  };

  const handleCheckoutClick = () => {
    setCheckoutError(null);
    setIsCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    setIsProcessing(true);
    setCheckoutError(null);
    
    const newOrder: Order = {
        id: Date.now().toString(),
        userId: user.id,
        items: [...cartItems],
        total: grandTotal, 
        subtotal: subtotal,
        taxAmount: totalTax,
        taxType: taxSettings.isRegistered ? (isIntraState ? 'INTRA' : 'INTER') : 'UR',
        paidWithWallet: walletDeduction, 
        status: 'pending',
        date: new Date().toISOString(),
        shippingAddress: user.addresses[0] || { street: 'N/A', city: 'N/A', state: 'N/A', zip: 'N/A' },
        marketingData: MarketingService.getMarketingData(),
        shippingMethod: deliveryMethod,
        shippingCost: shippingCost
    };
    
    try {
        // Using API Gateway to Create Order
        // This invokes the SAGA Orchestrator for distributed transaction reliability
        await APIGateway.order.create(newOrder);

        clearCart();
        setIsProcessing(false);
        setIsCheckoutModalOpen(false);
        navigate('/account');
    } catch (error: any) {
        console.error("Checkout failed:", error);
        setCheckoutError(error.message || "Failed to process order. Please try again.");
        setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't added any fresh meals yet.</p>
        <Link to="/shop" className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
        </Link>
        <div className="mt-12 text-left">
            <ProductRecommender title="Recommended for You" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          <div className="lg:col-span-7">
            <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
              {cartItems.map((item) => (
                <li key={item.cartItemId} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 rounded-md object-center object-cover sm:w-48 sm:h-48"
                    />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <span className="font-medium text-gray-700 hover:text-gray-800">
                              {item.name}
                            </span>
                          </h3>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900">₹{item.price.toFixed(2)}</p>
                         <p className="mt-1 text-xs text-gray-500">{item.category}</p>
                         {item.selectedPlan && (
                            <div className="mt-2 flex items-center text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded w-fit">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="capitalize">{item.selectedPlan.duration} Plan</span>
                            </div>
                         )}
                         {item.selectedVariation && (
                            <div className="mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                                Option: {item.selectedVariation.name}
                            </div>
                         )}
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <label htmlFor={`quantity-${item.cartItemId}`} className="sr-only">
                          Quantity, {item.name}
                        </label>
                        <select
                          id={`quantity-${item.cartItemId}`}
                          name={`quantity-${item.cartItemId}`}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.cartItemId, Number(e.target.value))}
                          className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="absolute top-0 right-0 -mr-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Remove</span>
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Delivery Configurator */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Truck className="text-brand-600" size={20} /> Delivery Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Standard */}
                    <div 
                        onClick={() => setDeliveryMethod('standard')}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${deliveryMethod === 'standard' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-900 text-sm">Standard</span>
                            {subtotal > 500 ? <span className="text-xs font-bold text-green-600">FREE</span> : <span className="text-xs font-bold text-gray-900">₹50</span>}
                        </div>
                        <p className="text-xs text-gray-500">Delivered within 24 hours.</p>
                    </div>
                    
                    {/* Express */}
                    <div 
                        onClick={() => setDeliveryMethod('express')}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${deliveryMethod === 'express' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-900 flex items-center gap-1 text-sm"><Zap size={12} className="fill-yellow-400 text-yellow-400"/> Express</span>
                            <span className="text-xs font-bold text-gray-900">₹150</span>
                        </div>
                        <p className="text-xs text-gray-500">Delivered within 2 hours.</p>
                    </div>

                    {/* Scheduled */}
                    <div 
                        onClick={() => setDeliveryMethod('scheduled')}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${deliveryMethod === 'scheduled' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-900 flex items-center gap-1 text-sm"><Clock size={12}/> Scheduled</span>
                            <span className="text-xs font-bold text-gray-900">₹100</span>
                        </div>
                        <p className="text-xs text-gray-500">Select a convenient slot.</p>
                    </div>
                </div>
                {deliveryMethod === 'standard' && subtotal <= 500 && (
                    <p className="text-xs text-brand-600 mt-3 flex items-center gap-1">
                        <Tag size={12} /> Add ₹{(500 - subtotal).toFixed(0)} more for free standard delivery!
                    </p>
                )}
            </div>

            {/* Cross-Sell Section */}
            <div className="mt-10 pt-6 border-t border-gray-200">
                <ProductRecommender title="Don't Forget These!" limit={4} />
            </div>

          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 mt-16 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-6 sm:p-6 lg:p-8 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
                </div>
                
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Delivery ({deliveryMethod})</dt>
                  <dd className="text-sm font-medium text-gray-900">
                      {shippingCost === 0 ? <span className="text-green-600">Free</span> : `₹${shippingCost.toFixed(2)}`}
                  </dd>
                </div>

                {/* Dynamic GST Display based on settings */}
                {taxSettings.isRegistered ? (
                    taxDetails.type === 'INTRA' ? (
                        <>
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-gray-600">CGST (2.5%)</dt>
                                <dd className="text-sm font-medium text-gray-900">₹{taxDetails.cgst?.toFixed(2)}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-gray-600">SGST (2.5%)</dt>
                                <dd className="text-sm font-medium text-gray-900">₹{taxDetails.sgst?.toFixed(2)}</dd>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between">
                            <dt className="text-sm text-gray-600">IGST (5%)</dt>
                            <dd className="text-sm font-medium text-gray-900">₹{taxDetails.igst?.toFixed(2)}</dd>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-between">
                        <dt className="text-sm text-gray-600">Tax (UR)</dt>
                        <dd className="text-sm font-medium text-gray-900">₹0.00</dd>
                    </div>
                )}
                
                {/* Tax Note */}
                {taxSettings.isRegistered && (
                    <div className="text-[10px] text-gray-400 italic mt-1">
                        GST applied based on shipping state: {userState || 'Unknown (Default Intra)'}. Store Location: {storeState}.
                    </div>
                )}
                
                {appliedPromo && (
                  <div className="flex items-center justify-between text-green-600 border-t border-dashed border-gray-200 pt-2">
                    <dt className="text-sm flex items-center gap-1">
                        <Tag size={14} /> Discount ({appliedPromo})
                    </dt>
                    <dd className="text-sm font-medium">-₹{discountAmount.toFixed(2)}</dd>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">₹{grandTotal.toFixed(2)}</dd>
                </div>
              </dl>
                
                {/* Wallet Payment Option */}
                {walletBalance > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={useWallet}
                                    onChange={(e) => setUseWallet(e.target.checked)}
                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
                                />
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <Wallet size={16} className="text-brand-600" /> Use Wallet Balance
                                </span>
                            </label>
                            <span className="text-sm text-gray-500">Available: ₹{walletBalance.toFixed(2)}</span>
                        </div>
                        {useWallet && (
                            <div className="flex items-center justify-between text-brand-700 bg-brand-50 p-2 rounded">
                                <span className="text-sm">Wallet Applied</span>
                                <span className="text-sm font-bold">-₹{walletDeduction.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Final Payable */}
                {useWallet && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
                        <dt className="text-lg font-bold text-gray-900">To Pay</dt>
                        <dd className="text-lg font-bold text-gray-900">₹{finalPayable.toFixed(2)}</dd>
                    </div>
                )}

              {/* Promo Code Input */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                  <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700">Promo Code</label>
                  <div className="mt-2 flex space-x-2">
                       <input 
                          type="text" 
                          id="promo-code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          disabled={!!appliedPromo || isCheckingPromo}
                          placeholder="Try DIETANIC10"
                          className="block w-full rounded-md border-gray-300 border shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2"
                       />
                       {appliedPromo ? (
                           <button
                              type="button"
                              onClick={removePromo}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
                           >
                               Remove
                           </button>
                       ) : (
                           <button 
                              type="button"
                              onClick={handleApplyPromo}
                              disabled={isCheckingPromo}
                              className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                           >
                               {isCheckingPromo ? <Loader size={14} className="animate-spin" /> : 'Apply'}
                           </button>
                       )}
                  </div>
                  {promoMessage && (
                      <p className={`mt-2 text-xs ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {promoMessage.text}
                      </p>
                  )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full bg-brand-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-brand-500 flex justify-center items-center gap-2"
                >
                  <CreditCard className="h-5 w-5" /> 
                  {finalPayable === 0 ? 'Place Order' : 'Checkout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => !isProcessing && setIsCheckoutModalOpen(false)}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 sm:mx-0 sm:h-10 sm:w-10">
                                <CheckCircle className="h-6 w-6 text-brand-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Confirm Your Order
                                </h3>
                                
                                {checkoutError && (
                                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        <span className="block sm:inline text-sm">{checkoutError}</span>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Please review your order details before finalizing.
                                    </p>
                                    
                                    <div className="bg-gray-50 rounded-md p-3 mb-4 max-h-60 overflow-y-auto">
                                        {cartItems.map((item) => (
                                            <div key={item.cartItemId} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                                                <img src={item.image} alt={item.name} className="h-12 w-12 rounded-md object-cover border border-gray-200 bg-white" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} {item.selectedPlan ? `• ${item.selectedPlan.duration}` : ''}</p>
                                                    {item.selectedVariation && <p className="text-xs text-gray-500">{item.selectedVariation.name}</p>}
                                                </div>
                                                <span className="font-medium text-gray-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-200 pt-3 space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Delivery ({deliveryMethod})</span>
                                            <span>{shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`}</span>
                                        </div>
                                         <div className="flex justify-between text-sm text-gray-600">
                                            <span>Tax ({taxSettings.isRegistered ? taxDetails.type : 'UR'})</span>
                                            <span>₹{totalTax.toFixed(2)}</span>
                                        </div>
                                        {appliedPromo && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount ({appliedPromo})</span>
                                                <span>-₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {useWallet && (
                                            <div className="flex justify-between text-sm text-brand-600 font-medium">
                                                <span>Wallet Balance Used</span>
                                                <span>-₹{walletDeduction.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
                                            <span>Total Amount Due</span>
                                            <span>₹{finalPayable.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-200 pt-3">
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Shipping To</p>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {user.addresses && user.addresses.length > 0 
                                                ? `${user.addresses[0].street}, ${user.addresses[0].city}, ${user.addresses[0].state}`
                                                : "No shipping address found"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            disabled={isProcessing}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${isProcessing ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500'}`}
                            onClick={confirmCheckout}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader className="animate-spin h-4 w-4 mr-2" /> Processing...
                                </>
                            ) : (
                                'Confirm Order'
                            )}
                        </button>
                        <button
                            type="button"
                            disabled={isProcessing}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            onClick={() => setIsCheckoutModalOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
