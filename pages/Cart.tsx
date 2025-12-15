import React, { useState } from 'react';
import { useCart, useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard, Calendar, CheckCircle, Tag, Loader } from 'lucide-react';
import { SalesService, DiscountService } from '../services/storeService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { Order } from '../types';

export const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  // Discount State
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = Math.max(0, subtotal + tax - discountAmount);

  const handleApplyPromo = async () => {
    setPromoMessage(null);
    const code = promoCode.trim().toUpperCase();
    
    if (!code) return;

    setIsCheckingPromo(true);
    const discount = await DiscountService.validateDiscount(code);
    setIsCheckingPromo(false);

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
    } else {
        setDiscountAmount(0);
        setAppliedPromo(null);
        setPromoMessage({ text: 'Invalid or expired promo code', type: 'error' });
    }
  };

  const removePromo = () => {
      setPromoCode('');
      setDiscountAmount(0);
      setAppliedPromo(null);
      setPromoMessage(null);
  };

  const handleCheckoutClick = () => {
    setIsCheckoutModalOpen(true);
  };

  const confirmCheckout = async () => {
    setIsProcessing(true);
    const newOrder: Order = {
        id: Date.now().toString(),
        userId: user.id,
        items: [...cartItems],
        total: total,
        status: 'pending',
        date: new Date().toISOString(),
        shippingAddress: user.addresses[0] || { street: 'N/A', city: 'N/A', state: 'N/A', zip: 'N/A' }
    };
    
    // Create Order via Sales Service
    await SalesService.createOrder(newOrder);

    // Send Confirmation Email
    try {
        await sendOrderConfirmationEmail(newOrder, user);
    } catch (error) {
        console.error("Failed to send email", error);
    }

    clearCart();
    setIsProcessing(false);
    setIsCheckoutModalOpen(false);
    navigate('/account');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't added any fresh meals yet.</p>
        <Link to="/shop" className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-500">
          <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
        </Link>
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
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 mt-16 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-6 sm:p-6 lg:p-8">
              <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Tax Estimate (8%)</dt>
                  <dd className="text-sm font-medium text-gray-900">₹{tax.toFixed(2)}</dd>
                </div>
                
                {appliedPromo && (
                  <div className="flex items-center justify-between text-green-600">
                    <dt className="text-sm flex items-center gap-1">
                        <Tag size={14} /> Discount ({appliedPromo})
                    </dt>
                    <dd className="text-sm font-medium">-₹{discountAmount.toFixed(2)}</dd>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Order total</dt>
                  <dd className="text-base font-medium text-gray-900">₹{total.toFixed(2)}</dd>
                </div>
              </dl>

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
                  <CreditCard className="h-5 w-5" /> Checkout
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
                                            <span>Tax</span>
                                            <span>₹{tax.toFixed(2)}</span>
                                        </div>
                                        {appliedPromo && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount ({appliedPromo})</span>
                                                <span>-₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-2">
                                            <span>Total Amount</span>
                                            <span>₹{total.toFixed(2)}</span>
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