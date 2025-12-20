
import React, { createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Admin } from './pages/Admin';
import { Customer } from './pages/Customer';
import { POS } from './pages/POS';
import { Kitchen } from './pages/Kitchen';
import { BookTable } from './pages/BookTable';
import { ProductDetail } from './pages/ProductDetail';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { RefundPolicy } from './pages/RefundPolicy';
import { About } from './pages/About'; 
import { ChainCommand } from './pages/ChainCommand';
import { FieldAgent } from './pages/FieldAgent';
import { VendorPortal } from './pages/VendorPortal';
import { Login } from './pages/Login';
import { TrackCommWidget } from './components/TrackCommWidget';
import { NewsletterPopup } from './components/NewsletterPopup';
import { ToastSystem } from './components/ToastSystem';
import { ComparisonProvider } from './components/ComparisonSystem';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppStore } from './hooks/useAppStore';
import { Product, CartItem, SubscriptionPlan, User, ProductVariation } from './types';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, name: string) => Promise<boolean>;
  signOut: () => void;
  usersList: User[];
  isAdmin: boolean;
  isEditor: boolean;
  isDriver: boolean;
  canManageStore: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Cart Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, selectedPlan?: SubscriptionPlan, selectedVariation?: ProductVariation, quantity?: number, priceTier?: 'standard' | 'wholesale') => void;
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

// Wishlist Context
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
  // Use Global Store Hook
  const store = useAppStore();

  // Block only on initial auth check, but NOT if user is just null (Guest)
  if (store.isLoadingAuth) {
      return <div className="min-h-screen flex items-center justify-center text-brand-600 animate-pulse">Initializing Dietanic...</div>;
  }

  return (
    <ErrorBoundary>
        <AuthContext.Provider value={{ 
            user: store.user, 
            login: store.login, 
            signIn: store.signIn,
            signUp: store.signUp,
            signOut: store.signOut,
            usersList: store.usersList, 
            isAdmin: store.isAdmin, 
            isEditor: store.isEditor, 
            isDriver: store.isDriver, 
            canManageStore: store.canManageStore, 
            isLoading: store.isLoadingAuth 
        }}>
        <CartContext.Provider value={{ 
            cartItems: store.cartItems, 
            addToCart: store.addToCart, 
            removeFromCart: store.removeFromCart, 
            updateQuantity: store.updateQuantity, 
            clearCart: store.clearCart 
        }}>
            <WishlistContext.Provider value={{ 
                wishlist: store.wishlist, 
                toggleWishlist: store.toggleWishlist, 
                isInWishlist: store.isInWishlist 
            }}>
            <ComparisonProvider>
                <Router>
                <div className="min-h-screen bg-white flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/login" element={<Login />} />
                        
                        {/* Protected Routes */}
                        <Route path="/admin" element={store.canManageStore ? <Admin /> : <Navigate to="/login" />} />
                        <Route path="/account" element={store.user ? <Customer /> : <Navigate to="/login" />} />
                        
                        <Route path="/book-table" element={<BookTable />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/refund-policy" element={<RefundPolicy />} />
                        <Route path="/about" element={<About />} />
                        
                        {/* Operations Routes */}
                        <Route path="/pos" element={store.canManageStore ? <POS /> : <Navigate to="/login" />} />
                        <Route path="/kitchen" element={store.canManageStore ? <Kitchen /> : <Navigate to="/login" />} />
                        {/* Delivery Route */}
                        <Route path="/delivery" element={store.isDriver ? <FieldAgent /> : <Navigate to="/login" />} />
                        {/* New Chain Command Route */}
                        <Route path="/chain-command" element={store.isAdmin ? <ChainCommand /> : <Navigate to="/login" />} />
                        {/* Vendor Portal */}
                        <Route path="/vendor-portal" element={<VendorPortal />} />
                    </Routes>
                    </main>
                    
                    <Footer />

                    {/* Marketing Widgets */}
                    <NewsletterPopup />
                    {store.user && <TrackCommWidget />}
                    <ToastSystem /> 
                </div>
                </Router>
            </ComparisonProvider>
            </WishlistContext.Provider>
        </CartContext.Provider>
        </AuthContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
