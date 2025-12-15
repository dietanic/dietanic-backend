import { Review, ChatSession, ChatMessage, Visitor } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';

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
    // Background sync, no await needed mostly
    setLocalStorage(STORAGE_KEYS.WISHLIST, list);
  },

  // TrackComm Chat (Simulating WebSocket)
  getSessions: async (): Promise<ChatSession[]> => {
     await delay(200);
     return getLocalStorage<ChatSession[]>(STORAGE_KEYS.CHATS, []);
  },
  
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
      // Fast fetch for chat
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
            unreadCount: 0
        };
        sessions.push(session);
        setLocalStorage(STORAGE_KEYS.CHATS, sessions);
        chatEvents.dispatchEvent(new Event('update'));
    }
    return session;
  },

  sendMessage: async (sessionId: string, text: string, sender: 'user' | 'agent' | 'system'): Promise<ChatMessage> => {
    await delay(100); // Fast send
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

    // Update Session Metadata
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
  }
};
