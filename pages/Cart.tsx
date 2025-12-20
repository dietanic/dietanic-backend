
import React, { useState, useEffect } from 'react';
import { useCart, useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard, Calendar, CheckCircle, Tag, Loader, AlertTriangle, Wallet, Truck, Zap, Clock, ShieldCheck, ChevronRight, X, Lock, User, MapPin, Mail, Phone, Plus, Minus, Store } from 'lucide-react';
import { APIGateway, MarketingService, CustomerService, IdentityService } from '../services/storeService';
import { Order, CustomerProfile, TaxSettings } from '../types';
import { ProductRecommender } from '../components/ProductRecommender';
import { DeliveryConfigurator, getDeliveryCost, DeliveryMethodType } from '../components/DeliveryConfigurator';

export const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Customer Profile for Wallet & Pre-fill
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [useWallet, setUseWallet] = useState(false);

  // Checkout Form State (Pre-filled)
  const [checkoutForm, setCheckoutForm] = useState({
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip: ''
  });

  // Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>('standard');
  const [pickupLocationId, setPickupLocationId] = useState<string | undefined>(undefined);

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
                APIGateway.Identity.CRM.getProfile(user),
                APIGateway.Finance.Tax.getSettings()
            ]);
            setProfile(p);
            setTaxSettings(t);

            // Pre-fill Checkout Form with Safe Access
            setCheckoutForm({
                name: user.name,
                email: user.email,
                phone: p?.phone || '',
                street: user.addresses?.[0]?.street || '',
                city: user.addresses?.[0]?.city || '',
                state: user.addresses?.[0]?.state || '',
                zip: user.addresses?.[0]?.zip || ''
            });
        }
    };
    fetchData();
  }, [user]);

  // Streamlined Checkout Logic: Load Profile by Email
  const handleLoadProfile = async () => {
      if (!checkoutForm.email) return;
      
      const allUsers = await IdentityService.getUsers();
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === checkoutForm.email.toLowerCase());
      
      if (matchedUser) {
          const profile = await CustomerService.ensureCustomerProfile(matchedUser);
          setCheckoutForm(prev => ({
              ...prev,
              name: matchedUser.name,
              phone: profile.phone || prev.phone,
              street: matchedUser.addresses?.[0]?.street || prev.street,
              city: matchedUser.addresses?.[0]?.city || prev.city,
              state: matchedUser.addresses?.[0]?.state || prev.state,
              zip: matchedUser.addresses?.[0]?.zip || prev.zip
          }));
          alert(`Profile loaded for ${matchedUser.name}`);
      } else {
          alert('No account found with this email. Proceeding as guest.');
      }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Calculate Shipping automatically using the shared utility
  const shippingCost = getDeliveryCost(deliveryMethod, subtotal);

  // Fiscal Position Logic (GST)
  const userState = checkoutForm.state || user?.addresses?.[0]?.state || '';
  const storeState = taxSettings.state || 'Maharashtra';
  const isIntraState = !userState || userState.toLowerCase() === storeState.toLowerCase() || (userState.toLowerCase() === 'mh' && storeState === 'Maharashtra');
  
  // Tax Calculation
  const totalTax = taxSettings.isRegistered ? subtotal * GST_RATE_FOOD : 0;
  const taxDetails = taxSettings.isRegistered 
    ? (isIntraState 
        ? { type: 'INTRA', cgst: totalTax / 2, sgst: totalTax / 2 }
        : { type: 'INTER', igst: totalTax }
      )
    : { type: 'UR', amount: 0 }; 

  const grandTotal = Math.max(0, subtotal + totalTax + shippingCost - discountAmount);

  // Wallet Logic Implementation
  const walletBalance = profile?.walletBalance || 0;
  
  // Calculate how much wallet balance can be applied (capped at grandTotal)
  const walletDeduction = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  
  // Calculate the final amount the user needs to pay via other methods
  const finalPayable = Math.max(0, grandTotal - walletDeduction);

  const handleApplyPromo = async () => {
    setPromoMessage(null);
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setIsCheckingPromo(true);
    try {
        const cartCategories = Array.from(new Set(cartItems.map(item => item.category))) as string[];
        const discount = await APIGateway.Commerce.Pricing.validateDiscount(code, subtotal, cartCategories);
        
        if (discount) {
            let calculatedDiscount = 0;
            if (discount.type === 'percentage') {
                calculatedDiscount = subtotal * (discount.value / 100);
                setPromoMessage({ text: `${discount.value}% discount applied!`, type: 'success' });
            } else {
                calculatedDiscount = discount.value;
                setPromoMessage({ text: `₹${discount.value} discount applied!`, type: 'success' });
            }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setCheckoutForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMethodChange = (method: DeliveryMethodType, pickupLocId?: string) => {
      setDeliveryMethod(method);
      if (pickupLocId) {
          setPickupLocationId(pickupLocId);
      } else {
          setPickupLocationId(undefined);
      }
  };

  const confirmCheckout = async (forceWallet: boolean = false) => {
    // Validation
    if (!checkoutForm.name) { setCheckoutError("Name is required."); return; }
    if (deliveryMethod === 'pickup' && !pickupLocationId) { setCheckoutError("Select a pickup store."); return; }
    if (deliveryMethod !== 'pickup' && (!checkoutForm.street || !checkoutForm.city || !checkoutForm.zip)) {
        setCheckoutError("Complete shipping details."); return;
    }

    setIsProcessing(true);
    setCheckoutError(null);
    
    // Auto-apply wallet if Force Wallet (One Click) is true
    const deduction = forceWallet ? Math.min(walletBalance, grandTotal) : walletDeduction;

    const newOrder: Order = {
        id: Date.now().toString(),
        userId: user ? user.id : 'guest',
        items: [...cartItems],
        total: grandTotal, 
        subtotal: subtotal,
        taxAmount: totalTax,
        taxType: taxSettings.isRegistered ? (isIntraState ? 'INTRA' : 'INTER') : 'UR',
        paidWithWallet: deduction, 
        status: 'pending',
        date: new Date().toISOString(),
        shippingAddress: {
            street: deliveryMethod === 'pickup' ? 'Store Pickup' : checkoutForm.street,
            city: deliveryMethod === 'pickup' ? '' : checkoutForm.city,
            state: deliveryMethod === 'pickup' ? '' : checkoutForm.state,
            zip: deliveryMethod === 'pickup' ? '' : checkoutForm.zip
        },
        marketingData: MarketingService.getMarketingData(),
        shippingMethod: deliveryMethod,
        shippingCost: shippingCost,
        fulfillmentType: deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
        pickupLocationId: pickupLocationId
    };
    
    try {
        await APIGateway.Commerce.Sales.createOrder(newOrder);
        // Allocate stock from specific warehouse if pickup, or main if delivery
        await APIGateway.Commerce.Inventory.allocate(newOrder);
        
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center pt-28">
        <div className="flex justify-center mb-6">
            <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-50"></div>
                <img 
                    src="https://images.unsplash.com/photo-1586769852044-692d6e37d0d2?q=80&w=500&auto=format&fit=crop" 
                    alt="Empty Cart" 
                    className="w-64 h-64 object-cover rounded-full shadow-xl relative z-10 mx-auto border-4 border-white"
                />
            </div>
        </div>
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
    // Added pt-28 to push content below fixed navbar
    <div className="bg-gray-50 min-h-screen pt-28 pb-12">
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
                      className="w-24 h-24 rounded-xl object-center object-cover sm:w-32 sm:h-32 border border-gray-100 shadow-sm"
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
                         {item.priceTier === 'wholesale' && (
                            <div className="mt-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit font-bold uppercase tracking-wider">
                                Wholesale Price
                            </div>
                         )}
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9 w-full flex items-center justify-between sm:justify-end">
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm h-9">
                            <button 
                                onClick={() => updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                                className="px-3 h-full text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                            <button 
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                className="px-3 h-full text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors rounded-r-lg flex items-center justify-center"
                                aria-label="Increase quantity"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="absolute top-0 right-0 -mr-2 inline-flex p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Embed Delivery Method Configurator */}
            <DeliveryConfigurator 
                subtotal={subtotal}
                selectedMethod={deliveryMethod}
                onMethodChange={handleMethodChange}
            />

            {/* Cross-Sell */}
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
                  <dt className="text-sm text-gray-600">Delivery ({deliveryMethod === 'pickup' ? 'Pickup' : deliveryMethod})</dt>
                  <dd className="text-sm font-medium text-gray-900">{shippingCost === 0 ? <span className="text-green-600">Free</span> : `₹${shippingCost.toFixed(2)}`}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Tax ({taxSettings.isRegistered ? taxDetails.type : 'UR'})</dt>
                    <dd className="text-sm font-medium text-gray-900">₹{totalTax.toFixed(2)}</dd>
                </div>
                
                {appliedPromo && (
                  <div className="flex items-center justify-between text-green-600 border-t border-dashed border-gray-200 pt-2">
                    <dt className="text-sm flex items-center gap-1"><Tag size={14} /> Discount ({appliedPromo})</dt>
                    <dd className="text-sm font-medium">-₹{discountAmount.toFixed(2)}</dd>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">₹{grandTotal.toFixed(2)}</dd>
                </div>
              </dl>
                
                {/* Wallet Balance Application Controls */}
                {walletBalance > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className={`flex items-center gap-2 cursor-pointer ${grandTotal === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={useWallet} 
                                    onChange={(e) => setUseWallet(e.target.checked)} 
                                    disabled={grandTotal === 0}
                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
                                />
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-1"><Wallet size={16} className="text-brand-600" /> Use Wallet Balance</span>
                            </label>
                            <span className="text-sm text-gray-500">Available: ₹{walletBalance.toFixed(2)}</span>
                        </div>
                        {useWallet && (
                            <div className="flex items-center justify-between text-brand-700 bg-brand-50 px-3 py-2 rounded-md text-sm">
                                <span>Wallet Deduction</span>
                                <span className="font-bold">-₹{walletDeduction.toFixed(2)}</span>
                            </div>
                        )}
                        {useWallet && finalPayable === 0 && (
                            <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                                <CheckCircle size={12}/> Fully covered by wallet balance.
                            </div>
                        )}
                    </div>
                )}

              {/* Promo Code Input */}
              <div className="mt-6">
                  <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo Code"
                        disabled={!!appliedPromo || isCheckingPromo}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2 uppercase"
                      />
                      {appliedPromo ? (
                          <button 
                            onClick={removePromo}
                            className="bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                              Remove
                          </button>
                      ) : (
                          <button 
                            onClick={handleApplyPromo}
                            disabled={!promoCode || isCheckingPromo}
                            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                              {isCheckingPromo ? <Loader className="animate-spin h-4 w-4"/> : 'Apply'}
                          </button>
                      )}
                  </div>
                  {promoMessage && (
                      <p className={`text-xs mt-2 ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                          {promoMessage.text}
                      </p>
                  )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCheckoutClick}
                  disabled={cartItems.length === 0}
                  className="w-full rounded-md border border-transparent bg-brand-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout
                </button>
              </div>
              
              {walletBalance >= grandTotal && grandTotal > 0 && !useWallet && (
                  <button 
                    onClick={() => { setUseWallet(true); setTimeout(() => confirmCheckout(true), 200); }}
                    className="w-full mt-3 rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-base font-bold text-brand-700 shadow-sm hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                  >
                      <Wallet size={18} /> Pay Instantly with Wallet
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsCheckoutModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full animate-scale-in">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Confirm Details
                    </h3>
                    <div className="mt-4 space-y-4">
                        {checkoutError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2">
                                <AlertTriangle size={16} /> {checkoutError}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" name="name" value={checkoutForm.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (for receipt)</label>
                            <div className="flex gap-2">
                                <input type="email" name="email" value={checkoutForm.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                                <button type="button" onClick={handleLoadProfile} className="mt-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded-md text-xs font-bold whitespace-nowrap">Load Profile</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" name="phone" value={checkoutForm.phone} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                        </div>

                        {deliveryMethod !== 'pickup' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                    <input type="text" name="street" value={checkoutForm.street} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input type="text" name="city" value={checkoutForm.city} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ZIP / PIN</label>
                                        <input type="text" name="zip" value={checkoutForm.zip} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">State</label>
                                    <input type="text" name="state" value={checkoutForm.state} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2" />
                                </div>
                            </>
                        )}
                        
                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mt-2">
                            <p className="flex justify-between font-bold text-gray-900"><span>Payable Amount:</span> <span>₹{finalPayable.toFixed(2)}</span></p>
                            {useWallet && <p className="flex justify-between text-xs mt-1"><span>Wallet Used:</span> <span>₹{walletDeduction.toFixed(2)}</span></p>}
                        </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => confirmCheckout()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : `Pay ₹${finalPayable.toFixed(2)}`}
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsCheckoutModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
