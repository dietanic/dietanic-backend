
import { Review, ChatSession, ChatMessage, Visitor, Product, Order } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { SalesService } from './sales';
import { CatalogService } from './catalog';

export const chatEvents = new EventTarget();

export const EngagementService = {
  // Reviews
  getReviews: async (): Promise<Review[]> => {
    await delay();
    return getLocalStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
  },

  getProductReviews: async (productId: string): Promise<Review[]> => {
    await delay();
    const reviews = getLocalStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
    return reviews.filter(r => r.productId === productId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addReview: async (review: Review): Promise<void> => {
    await delay();
    const reviews = getLocalStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
    reviews.push(review);
    setLocalStorage(STORAGE_KEYS.REVIEWS, reviews);
  },

  // Wishlist
  getWishlist: async (): Promise<string[]> => {
    await delay(100);
    return getLocalStorage<string[]>(STORAGE_KEYS.WISHLIST, []);
  },

  saveWishlist: async (list: string[]): Promise<void> => {
    setLocalStorage(STORAGE_KEYS.WISHLIST, list);
  },

  // Recently Viewed Tracking
  addToRecentlyViewed: (productId: string) => {
      const MAX_ITEMS = 6;
      const key = 'dietanic_recently_viewed';
      let recent = getLocalStorage<string[]>(key, []);
      recent = recent.filter(id => id !== productId);
      recent.unshift(productId);
      if (recent.length > MAX_ITEMS) recent.pop();
      setLocalStorage(key, recent);
  },

  getRecentlyViewed: async (): Promise<string[]> => {
      await delay(100);
      return getLocalStorage<string[]>('dietanic_recently_viewed', []);
  },

  // TrackComm Chat (Simulating WebSocket)
  getSessions: async (): Promise<ChatSession[]> => {
     await delay(200);
     return getLocalStorage<ChatSession[]>(STORAGE_KEYS.CHATS, []);
  },
  
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
      const m = getLocalStorage<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
      return m.filter(msg => msg.sessionId === sessionId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  createOrGetSession: async (userId: string, userName: string): Promise<ChatSession> => {
    await delay(300);
    const sessions = getLocalStorage<ChatSession[]>(STORAGE_KEYS.CHATS, []);
    let session = sessions.find(s => s.userId === userId && s.status === 'active');
    
    if (!session) {
        session = {
            id: `session_${Date.now()}`,
            userId,
            userName,
            status: 'active',
            lastMessage: 'Session started',
            lastActive: new Date().toISOString(),
            unreadCount: 0,
            isAiHandled: true
        };
        sessions.push(session);
        setLocalStorage(STORAGE_KEYS.CHATS, sessions);
        chatEvents.dispatchEvent(new Event('update'));
    }
    return session;
  },

  closeSession: async (sessionId: string): Promise<void> => {
      await delay(200);
      const sessions = getLocalStorage<ChatSession[]>(STORAGE_KEYS.CHATS, []);
      const idx = sessions.findIndex(s => s.id === sessionId);
      if (idx !== -1) {
          sessions[idx].status = 'closed';
          setLocalStorage(STORAGE_KEYS.CHATS, sessions);
          chatEvents.dispatchEvent(new Event('update'));
      }
  },

  submitFeedback: async (sessionId: string, rating: number): Promise<void> => {
      await delay(200);
      console.log(`Feedback received for session ${sessionId}: ${rating} stars`);
  },

  sendMessage: async (sessionId: string, text: string, sender: 'user' | 'agent' | 'system'): Promise<ChatMessage> => {
    await delay(100); 
    const messages = getLocalStorage<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
    
    const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sessionId,
        sender,
        text,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    messages.push(newMessage);
    setLocalStorage(STORAGE_KEYS.MESSAGES, messages);

    const sessions = getLocalStorage<ChatSession[]>(STORAGE_KEYS.CHATS, []);
    const sessionIdx = sessions.findIndex(s => s.id === sessionId);
    if (sessionIdx !== -1) {
        sessions[sessionIdx].lastMessage = text;
        sessions[sessionIdx].lastActive = newMessage.timestamp;
        if (sender === 'user') {
            sessions[sessionIdx].unreadCount += 1;
        }
        setLocalStorage(STORAGE_KEYS.CHATS, sessions);
    }

    chatEvents.dispatchEvent(new Event('update'));
    return newMessage;
  },

  markSessionRead: async (sessionId: string): Promise<void> => {
    const sessions = getLocalStorage<ChatSession[]>(STORAGE_KEYS.CHATS, []);
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
        sessions[idx].unreadCount = 0;
        setLocalStorage(STORAGE_KEYS.CHATS, sessions);
        chatEvents.dispatchEvent(new Event('update'));
    }
  },

  getMockVisitors: async (): Promise<Visitor[]> => {
    await delay();
    return [
        { id: 'v1', name: 'Guest (Delhi)', currentPage: '/shop', timeOnSite: '2m 30s', device: 'Mobile', status: 'browsing' },
        { id: 'v2', name: 'Guest (Mumbai)', currentPage: '/cart', timeOnSite: '5m 12s', device: 'Desktop', status: 'idle' },
        { id: 'v3', name: 'Jane Smith', currentPage: '/account', timeOnSite: '10m', device: 'Mobile', status: 'chatting' },
    ];
  },

  // --- Neural System: Context Retrieval ---
  getCustomerContext: async (userId: string) => {
      // Aggregate data for the "Brain"
      const [orders, products] = await Promise.all([
          SalesService.getOrdersByUser(userId),
          CatalogService.getProducts()
      ]);

      // Mock Active Cart (Random subset of products)
      const cartItems = products.slice(0, 2); 

      // Calculate Metrics
      const totalSpend = orders.reduce((acc, o) => acc + o.total, 0);
      const lastOrder = orders[0]; // Most recent because of sort in SalesService

      return {
          metrics: {
              totalSpend,
              orderCount: orders.length,
              ltvGrade: totalSpend > 5000 ? 'High Value' : 'Standard',
              sentiment: 'Positive' // Mock
          },
          lastOrder,
          activeCart: cartItems
      };
  },

  // --- Neural System: Trends ---
  getLiveTrends: async () => {
      // Mock analyzing chat logs for keywords
      return [
          { topic: 'Late Delivery', volume: 'High', sentiment: 'Negative', type: 'logistics' },
          { topic: 'Green Goddess', volume: 'Medium', sentiment: 'Positive', type: 'product' },
          { topic: 'Discount Code', volume: 'Low', sentiment: 'Neutral', type: 'marketing' }
      ];
  }
};
