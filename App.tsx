import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Admin } from './pages/Admin';
import { Customer } from './pages/Customer';
import { ProductDetail } from './pages/ProductDetail';
import { TrackCommWidget } from './components/TrackCommWidget';
import { initStore, IdentityService, EngagementService } from './services/storeService';
import { Product, CartItem, SubscriptionPlan, User, ProductVariation } from './types';

// Auth Context
interface AuthContextType {
  user: User;
  login: (userId: string) => void;
  usersList: User[];
  isAdmin: boolean;
  isEditor: boolean;
  canManageStore: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Cart Context setup
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, selectedPlan?: SubscriptionPlan, selectedVariation?: ProductVariation, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// Wishlist Context setup
interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
        initStore();
        
        // Load Wishlist from Engagement Service
        const w = await EngagementService.getWishlist();
        setWishlist(w);

        // Load Auth from Identity Service
        await refreshAuth();
        setIsLoadingAuth(false);
    };
    bootstrap();
  }, []);

  const refreshAuth = async () => {
      const [users, me] = await Promise.all([
          IdentityService.getUsers(),
          IdentityService.getCurrentUser()
      ]);
      setUsersList(users);
      setCurrentUser(me);
  };

  const handleLogin = async (userId: string) => {
      setIsLoadingAuth(true);
      await IdentityService.switchUserSession(userId);
      await refreshAuth();
      setIsLoadingAuth(false);
  };

  const addToCart = (product: Product, selectedPlan?: SubscriptionPlan, selectedVariation?: ProductVariation, quantity: number = 1) => {
    setCartItems(prev => {
      // Check if item with same ID and same plan exists
      const existing = prev.find(item => {
        const sameId = item.id === product.id;
        // Check Plan equality
        const samePlan = product.isSubscription 
            ? item.selectedPlan?.duration === selectedPlan?.duration 
            : true;
        // Check Variation equality
        const sameVariation = item.selectedVariation?.id === selectedVariation?.id;
        
        return sameId && samePlan && sameVariation;
      });

      if (existing) {
        return prev.map(item => 
          item.cartItemId === existing.cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      
      const price = selectedVariation ? selectedVariation.price : (selectedPlan ? selectedPlan.price : product.price);

      const newItem: CartItem = {
        ...product,
        quantity: quantity,
        cartItemId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        selectedPlan: selectedPlan,
        selectedVariation: selectedVariation,
        price: price
      };
      
      return [...prev, newItem];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => setCartItems([]);

  const toggleWishlist = async (productId: string) => {
    const newList = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    
    setWishlist(newList); // Optimistic UI update
    await EngagementService.saveWishlist(newList); // Async save
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Derived Auth State
  const isAdmin = currentUser?.role === 'admin';
  const isEditor = currentUser?.role === 'editor';
  const canManageStore = isAdmin || isEditor;

  if (isLoadingAuth || !currentUser) return <div className="min-h-screen flex items-center justify-center text-brand-600">Loading Application...</div>;

  return (
    <AuthContext.Provider value={{ user: currentUser, login: handleLogin, usersList, isAdmin, isEditor, canManageStore, isLoading: isLoadingAuth }}>
      <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
          <Router>
            <div className="min-h-screen bg-white flex flex-col">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/account" element={<Customer />} />
                  <Route path="/about" element={<Navigate to="/" />} />
                </Routes>
              </main>
              
              <footer className="bg-gray-800 text-white py-12">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                       <h3 className="text-xl font-bold mb-4">Dietanic</h3>
                       <p className="text-gray-400 text-sm">Eat fresh, stay healthy. The best salad subscription in town.</p>
                    </div>
                    <div>
                       <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                       <ul className="space-y-2 text-sm text-gray-400">
                          <li><a href="#/shop" className="hover:text-white">Shop</a></li>
                          <li><a href="#/account" className="hover:text-white">Account</a></li>
                          <li><a href="#/admin" className="hover:text-white">Admin</a></li>
                       </ul>
                    </div>
                    <div>
                       <h4 className="text-lg font-semibold mb-4">Contact</h4>
                       <p className="text-gray-400 text-sm">support@dietanic.com</p>
                       <p className="text-gray-400 text-sm">1-800-SALAD-GO</p>
                    </div>
                 </div>
              </footer>

              {/* TrackComm Engagement Widget - Only visible to non-admins */}
              <TrackCommWidget />
            </div>
          </Router>
        </WishlistContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;