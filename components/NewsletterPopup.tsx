
import React, { useState, useEffect } from 'react';
import { X, Mail, Check } from 'lucide-react';
import { MarketingService } from '../services/storeService';

export const NewsletterPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Show popup after 5 seconds if not already subscribed
    if (!MarketingService.hasSubscribed()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await MarketingService.subscribeToNewsletter(email);
      setSubscribed(true);
      setTimeout(() => setIsVisible(false), 2000);
    }
  };

  const handleClose = () => {
      setIsVisible(false);
      // Mark as seen in session so it doesn't pop up again immediately on refresh
      sessionStorage.setItem('dietanic_popup_dismissed', 'true');
  };

  // Don't show if dismissed this session
  if (sessionStorage.getItem('dietanic_popup_dismissed') === 'true') return null;
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 text-center">
            {subscribed ? (
                <div className="py-8 animate-scale-in">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                        <Check size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">You're on the list!</h3>
                    <p className="text-gray-500 mt-2">Check your inbox for a special welcome gift.</p>
                </div>
            ) : (
                <>
                    <div className="mx-auto h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center mb-4 text-brand-600">
                        <Mail size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Green Club</h2>
                    <p className="text-gray-600 mb-6">
                        Get nutrition tips, new menu alerts, and <span className="font-bold text-brand-600">10% OFF</span> your first order!
                    </p>

                    <form onSubmit={handleSubscribe} className="space-y-3">
                        <input
                            type="email"
                            required
                            placeholder="Enter your email address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-colors shadow-md"
                        >
                            Subscribe & Save
                        </button>
                    </form>
                    <p className="text-xs text-gray-400 mt-4">
                        We respect your privacy. Unsubscribe at any time.
                    </p>
                </>
            )}
        </div>
        
        {/* Decorative Bottom Bar */}
        <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600 w-full"></div>
      </div>
    </div>
  );
};
