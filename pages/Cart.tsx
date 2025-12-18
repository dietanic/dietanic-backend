
import React, { useState, useEffect } from 'react';
import { useCart, useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard, Calendar, CheckCircle, Tag, Loader, AlertTriangle, Wallet, Truck, Zap, Clock, ShieldCheck, ChevronRight, X, Lock, User, MapPin, Mail, Phone, Plus, Minus } from 'lucide-react';
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

            // Pre-fill Checkout Form
            setCheckoutForm({
                name: user.name,
                email: user.email,
                phone: p?.phone || '',
                street: user.addresses[0]?.street || '',
                city: user.addresses[0]?.city || '',
                state: user.addresses[0]?.state || '',
                zip: user.addresses[0]?.zip || ''
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
              street: matchedUser.addresses[0]?.street || prev.street,
              city: matchedUser.addresses[0]?.city || prev.city,
              state: matchedUser.addresses[0]?.state || prev.state,
              zip: matchedUser.addresses[0]?.zip || prev.zip
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
  const userState = checkoutForm.state || user?.addresses[0]?.state || '';
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

  const confirmCheckout = async (forceWallet: boolean = false) => {
    if (!checkoutForm.name || !checkoutForm.street || !checkoutForm.city || !checkoutForm.zip) {
        setCheckoutError("Please complete all shipping details.");
        return;
    }

    setIsProcessing(true);
    setCheckoutError(null);
    
    // Auto-apply wallet if Force Wallet (One Click) is true
    // If using normal checkout, use the calculated walletDeduction
    const deduction = forceWallet ? Math.min(walletBalance, grandTotal) : walletDeduction;

    const newOrder: Order = {
        id: Date.now().toString(),
        userId: user.id,
        items: [...cartItems],
        total: grandTotal, 
        subtotal: subtotal,
        taxAmount: totalTax,
        taxType: taxSettings.isRegistered ? (isIntraState ? 'INTRA' : 'INTER') : 'UR',
        paidWithWallet: deduction, 
        status: 'pending',
        date: new Date().toISOString(),
        shippingAddress: {
            street: checkoutForm.street,
            city: checkoutForm.city,
            state: checkoutForm.state,
            zip: checkoutForm.zip
        },
        marketingData: MarketingService.getMarketingData(),
        shippingMethod: deliveryMethod,
        shippingCost: shippingCost
    };
    
    try {
        await APIGateway.Commerce.Sales.createOrder(newOrder);
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
                onMethodChange={setDeliveryMethod}
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
                  <dt className="text-sm text-gray-600">Delivery ({deliveryMethod})</dt>
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
                            <div className="flex items-center justify-between text-brand-700 bg-brand-50 p-2 rounded">
                                <span className="text-sm">Wallet Applied</span>
                                <span className="text-sm font-bold">-₹{walletDeduction.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}

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
                       <input type="text" id="promo-code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={!!appliedPromo || isCheckingPromo} placeholder="Try DIETANIC10" className="block w-full rounded-md border-gray-300 border shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2"/>
                       {appliedPromo ? (
                           <button type="button" onClick={removePromo} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300">Remove</button>
                       ) : (
                           <button type="button" onClick={handleApplyPromo} disabled={isCheckingPromo} className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2">
                               {isCheckingPromo ? <Loader size={14} className="animate-spin" /> : 'Apply'}
                           </button>
                       )}
                  </div>
                  {promoMessage && <p className={`mt-2 text-xs ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{promoMessage.text}</p>}
              </div>

              <div className="mt-6">
                <button onClick={handleCheckoutClick} className="w-full bg-brand-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-brand-500 flex justify-center items-center gap-2">
                  <CreditCard className="h-5 w-5" /> 
                  {finalPayable === 0 ? 'Place Order' : 'Checkout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODERN SLIDE-OVER CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => !isProcessing && setIsCheckoutModalOpen(false)}></div>
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto w-screen max-w-md animate-slide-in-right">
                        <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
                            {/* Header */}
                            <div className="bg-brand-900 px-4 py-6 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-medium text-white flex items-center gap-2" id="slide-over-title">
                                        <Lock size={18} className="text-green-400" /> Secure Checkout
                                    </h2>
                                    <div className="ml-3 flex h-7 items-center">
                                        <button type="button" className="rounded-md bg-brand-900 text-brand-200 hover:text-white focus:outline-none" onClick={() => setIsCheckoutModalOpen(false)}>
                                            <span className="sr-only">Close panel</span>
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] font-bold uppercase border border-green-500/30">PCI DSS Compliant</span>
                                    <p className="text-sm text-brand-300">Encrypted Transaction</p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                {/* Error Display */}
                                {checkoutError && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        <span className="block sm:inline text-sm">{checkoutError}</span>
                                    </div>
                                )}

                                {/* ONE-TAP PAY OPTION (Super Fast) */}
                                {walletBalance >= grandTotal && !useWallet && (
                                    <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg transform transition-all hover:scale-[1.02] cursor-pointer" onClick={() => confirmCheckout(true)}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-lg flex items-center gap-2"><Zap className="fill-yellow-400 text-yellow-400"/> Super Fast Pay</span>
                                            <span className="bg-white/20 px-2 py-1 rounded text-xs">Recommended</span>
                                        </div>
                                        <p className="text-sm text-purple-100 mb-4">Pay instantly using your available wallet balance.</p>
                                        <div className="flex justify-between items-end">
                                            <div className="text-xs">Balance: ₹{walletBalance.toFixed(2)}</div>
                                            <button className="bg-white text-purple-700 font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-1 hover:bg-gray-50">
                                                Pay ₹{grandTotal.toFixed(2)} <ChevronRight size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Section 1: Shipping Form (Pre-filled) */}
                                    <div className="border-b border-gray-100 pb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2"><Truck size={16} className="text-gray-400"/> Shipping Details</h3>
                                            <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold">Auto-Filled</span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User size={14} className="text-gray-400"/>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        name="name" 
                                                        value={checkoutForm.name} 
                                                        onChange={handleInputChange} 
                                                        placeholder="Full Name"
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail size={14} className="text-gray-400"/>
                                                    </div>
                                                    <input 
                                                        type="email" 
                                                        name="email" 
                                                        value={checkoutForm.email} 
                                                        onChange={handleInputChange} 
                                                        placeholder="Email Address"
                                                        className="w-full pl-9 pr-20 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                    />
                                                    {/* Lookup trigger */}
                                                    <button 
                                                        onClick={handleLoadProfile}
                                                        type="button"
                                                        className="absolute right-1 top-1 bottom-1 px-3 bg-gray-100 text-xs font-medium text-gray-600 rounded hover:bg-gray-200"
                                                    >
                                                        Load Profile
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Phone size={14} className="text-gray-400"/>
                                                    </div>
                                                    <input 
                                                        type="tel" 
                                                        name="phone" 
                                                        value={checkoutForm.phone} 
                                                        onChange={handleInputChange} 
                                                        placeholder="Phone Number"
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin size={14} className="text-gray-400"/>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="street" 
                                                    value={checkoutForm.street} 
                                                    onChange={handleInputChange} 
                                                    placeholder="Street Address"
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-2">
                                                <input 
                                                    type="text" 
                                                    name="city" 
                                                    value={checkoutForm.city} 
                                                    onChange={handleInputChange} 
                                                    placeholder="City"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                                                />
                                                <input 
                                                    type="text" 
                                                    name="state" 
                                                    value={checkoutForm.state} 
                                                    onChange={handleInputChange} 
                                                    placeholder="State"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                                                />
                                                <input 
                                                    type="text" 
                                                    name="zip" 
                                                    value={checkoutForm.zip} 
                                                    onChange={handleInputChange} 
                                                    placeholder="ZIP"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 text-right mt-1">Method: {deliveryMethod.toUpperCase()}</p>
                                        </div>
                                    </div>

                                    {/* Section 2: Order Review (Compact) */}
                                    <div className="border-b border-gray-100 pb-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-gray-400"/> Order Items ({cartItems.length})</h3>
                                        <div className="max-h-40 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                            {cartItems.map((item) => (
                                                <div key={item.cartItemId} className="flex justify-between text-sm">
                                                    <span className="text-gray-600 truncate w-2/3">{item.quantity}x {item.name}</span>
                                                    <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 3: Payment Summary */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={16} className="text-gray-400"/> Payment</h3>
                                        
                                        {/* Security Badge */}
                                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4 flex gap-3 items-center">
                                            <div className="bg-white p-1.5 rounded-full shadow-sm">
                                                <ShieldCheck className="text-green-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-green-800 uppercase tracking-wide">PCI DSS Compliant</p>
                                                <p className="text-[10px] text-green-700 leading-tight mt-0.5">
                                                    Your payment info is processed securely via tokenization. We do not store raw card details.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Subtotal</span>
                                                <span>₹{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Tax + Shipping</span>
                                                <span>₹{(totalTax + shippingCost).toFixed(2)}</span>
                                            </div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Discount</span>
                                                    <span>-₹{discountAmount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {useWallet && (
                                                <div className="flex justify-between text-sm text-brand-600 font-medium">
                                                    <span>Wallet Used</span>
                                                    <span>-₹{walletDeduction.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900 mt-2">
                                                <span>Total to Pay</span>
                                                <span>₹{finalPayable.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                                        <Lock size={12} className="text-gray-400"/> 256-bit SSL Secure Payment
                                    </div>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="border-t border-gray-200 px-4 py-6 sm:px-6 bg-gray-50">
                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    className={`w-full flex items-center justify-center rounded-lg border border-transparent px-6 py-3 text-base font-medium text-white shadow-sm ${isProcessing ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}
                                    onClick={() => confirmCheckout(false)}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader className="animate-spin h-5 w-5 mr-2" /> Processing...
                                        </>
                                    ) : (
                                        `Confirm & Pay ₹${finalPayable.toFixed(2)}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
