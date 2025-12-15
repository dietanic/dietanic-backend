
import { MarketingData, Order } from '../types';
import { sendEmail } from './mailer';
import { GlobalEventBus, EVENTS } from './eventBus';

const SESSION_KEY_MARKETING = 'dietanic_marketing_params';
const STORAGE_KEY_NEWSLETTER = 'dietanic_newsletter_sub';
const STORAGE_KEY_GA_ID = 'dietanic_ga_measurement_id';

// --- Marketing Microservice Logic ---
GlobalEventBus.on(EVENTS.ORDER_CREATED, (order: Order) => {
    // 1. Clear Abandoned Cart Triggers (Simulated)
    // In a real system, we'd call an API to cancel scheduled emails
    console.log(`📈 Marketing Microservice: Order ${order.id} received. Clearing abandoned cart flows for user.`);
    
    // 2. Track Conversion
    MarketingService.trackEvent('purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: "INR",
        items: order.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity }))
    });
});

export const MarketingService = {
  // 1. Analytics & Tracking
  captureTrafficSource: () => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    // Only overwrite if new UTMs are present, otherwise keep existing session data
    if (utmSource || utmMedium || utmCampaign) {
      const data: MarketingData = {
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        landing_page: window.location.pathname,
        referrer: document.referrer
      };
      sessionStorage.setItem(SESSION_KEY_MARKETING, JSON.stringify(data));
      console.log('📈 Marketing: Traffic source captured', data);
    }
  },

  getMarketingData: (): MarketingData | undefined => {
    const stored = sessionStorage.getItem(SESSION_KEY_MARKETING);
    return stored ? JSON.parse(stored) : undefined;
  },

  // 2. Newsletter Automation
  subscribeToNewsletter: async (email: string): Promise<void> => {
    // In a real app, this sends to Mailchimp/Klaviyo
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`📧 Marketing: ${email} subscribed to newsletter.`);
    localStorage.setItem(STORAGE_KEY_NEWSLETTER, 'true');
    
    // Send welcome email simulation
    await sendEmail(
        email, 
        "Welcome to the Dietanic Family! 🥗", 
        "Thanks for subscribing! Here is a 10% discount code for your first order: FRESH10"
    );
  },

  hasSubscribed: (): boolean => {
    return localStorage.getItem(STORAGE_KEY_NEWSLETTER) === 'true';
  },

  // 3. Abandoned Cart Automation
  triggerAbandonedCartSequence: async (email: string, cartCount: number) => {
    console.log(`🛒 Marketing Automation: Abandoned Cart Detected for ${email} (${cartCount} items)`);
    
    await sendEmail(
        email,
        "You left something fresh behind! 🥑",
        "It looks like you didn't finish your order. Your healthy meal is waiting for you! Click here to complete your purchase."
    );
  },

  // 4. Google Analytics Integration
  setGAMeasurementID: (id: string) => {
      localStorage.setItem(STORAGE_KEY_GA_ID, id);
      // In a real app, this would initialize the gtag.js script
      console.log(`📊 Google Analytics initialized with ID: ${id}`);
  },

  getGAMeasurementID: (): string => {
      return localStorage.getItem(STORAGE_KEY_GA_ID) || '';
  },

  trackEvent: (eventName: string, params: any) => {
      const gaId = localStorage.getItem(STORAGE_KEY_GA_ID);
      // Log event internally regardless of ID for demo purposes
      console.group('📊 Analytics Event');
      console.log('Event:', eventName);
      console.log('Params:', params);
      if(gaId) console.log('Sent to GA Property:', gaId);
      console.groupEnd();
  }
};
