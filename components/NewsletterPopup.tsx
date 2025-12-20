
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Mail, Check, Leaf, AlertCircle } from 'lucide-react';
import { MarketingService } from '../services/storeService';

export const NewsletterPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    // Show popup after 5 seconds if not already subscribed AND we are on the homepage
    // Check session storage to prevent showing it multiple times in one session
    const isDismissed = sessionStorage.getItem('dietanic_popup_dismissed') === 'true';
    const isSubscribed = MarketingService.hasSubscribed();

    if (location.pathname === '/' && !isSubscribed && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    if (email) {
      await MarketingService.subscribeToNewsletter(email);
      setSubscribed(true);
      setTimeout(() => setIsVisible(false), 2500);
    }
  };

  const handleClose = () => {
      setIsVisible(false);
      // Mark as seen in session so it doesn't pop up again immediately on refresh
      sessionStorage.setItem('dietanic_popup_dismissed', 'true');
  };

  // Logic: Only render on Homepage
  if (location.pathname !== '/') return null;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] animate-fade-in">
      {/* Light Theme Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl transition-all transform animate-scale-in">
        
        {/* Decorative background blobs for glow effect (Pastel for light theme) */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-400/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-[80px] pointer-events-none"></div>

        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-20"
          aria-label="Close popup"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center relative z-10">
            {subscribed ? (
                <div className="py-10 animate-fade-in">
                    <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-inner ring-1 ring-green-200">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the list!</h3>
                    <p className="text-slate-600 font-medium">Check your inbox for a special welcome gift.</p>
                </div>
            ) : (
                <>
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mb-6 text-brand-600 shadow-lg shadow-brand-100 transform rotate-3 border border-white">
                        <Leaf size={32} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Join the Green Club</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                        Get nutrition tips, new menu alerts, and <br/>
                        <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 mt-1 inline-block uppercase tracking-wider">10% OFF</span> your first order!
                    </p>

                    <form onSubmit={handleSubscribe} className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={18} className="text-slate-400 group-focus-within:text-brand-600 transition-colors"/>
                            </div>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 focus:bg-white transition-all shadow-inner"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-xs flex items-center justify-center gap-1 animate-fade-in font-medium">
                                <AlertCircle size={12}/> {error}
                            </p>
                        )}
                        <button 
                            type="submit"
                            className="w-full bg-[#04EA77] hover:bg-[#03d36b] text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            disabled={!email}
                        >
                            Subscribe & Save
                        </button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-6 font-medium">
                        We respect your privacy. Unsubscribe at any time.
                    </p>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
