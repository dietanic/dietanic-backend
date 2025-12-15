
export interface SubscriptionPlan {
  duration: 'weekly' | 'monthly' | 'bi-weekly';
  price: number;
}

export interface ProductVariation {
  id: string;
  name: string; // e.g., "Small", "Large", "Red"
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isSubscription: boolean;
  ingredients: string[];
  stock: number;
  subscriptionDuration?: 'weekly' | 'monthly' | 'bi-weekly'; // Kept for legacy support
  subscriptionFeatures?: string[];
  subscriptionPlans?: SubscriptionPlan[];
  variations?: ProductVariation[];
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId: string; // Unique ID for the line item in cart
  selectedPlan?: SubscriptionPlan;
  selectedVariation?: ProductVariation;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'editor';
  status: 'active' | 'suspended';
  addresses: Address[];
  wishlist: string[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

// TrackComm Types
export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatSession {
  id: string;
  userId: string; // 'guest' or user.id
  userName: string;
  status: 'active' | 'closed';
  lastMessage: string;
  lastActive: string;
  unreadCount: number; // For admin
}

export interface Visitor {
  id: string;
  name: string; // "Guest 123" or User Name
  currentPage: string;
  timeOnSite: string;
  device: 'Desktop' | 'Mobile';
  status: 'browsing' | 'idle' | 'chatting';
}
