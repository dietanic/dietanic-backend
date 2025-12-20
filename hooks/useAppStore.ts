
import { useState, useEffect, useRef } from 'react';
import { User, CartItem, Product, SubscriptionPlan, ProductVariation } from '../types';
import { IdentityService, EngagementService, MarketingService, initStore } from '../services/storeService';
import { checkConnection } from '../services/supabase';

export const useAppStore = () => {
    // --- Domain: Commerce (Cart) ---
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    // --- Domain: Engagement (Wishlist) ---
    const [wishlist, setWishlist] = useState<string[]>([]);
    
    // --- Domain: Identity (Auth) ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [usersList, setUsersList] = useState<User[]>([]);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // --- Domain: Marketing (Automation) ---
    const abandonedCartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Bootstrap Application
    useEffect(() => {
        const bootstrap = async () => {
            console.log("🚀 Bootstrapping Dietanic App...");
            
            // Verify Cloud DB Connection
            const isConnected = await checkConnection();
            if (!isConnected) {
                console.warn("⚠️ Running in Offline/Cached Mode (Supabase disconnected)");
            }

            initStore();
            
            try {
                // Parallel Data Loading
                // We load wishlist and current user. Users list is restricted, so we handle it separately or loosely.
                const [w, me] = await Promise.all([
                    EngagementService.getWishlist(),
                    IdentityService.getCurrentUser()
                ]);

                setWishlist(w);
                setCurrentUser(me);

                // If admin, try to load users list
                if (me && (me.role === 'admin' || me.role === 'editor')) {
                    IdentityService.getUsers().then(setUsersList).catch(err => console.warn("Failed to load users list", err));
                }

            } catch (error) {
                console.error("Bootstrap error:", error);
            } finally {
                setIsLoadingAuth(false);
                // Initialize Marketing Tracking
                MarketingService.captureTrafficSource();
            }
        };
        bootstrap();
    }, []);

    // Marketing Logic: Abandoned Cart
    useEffect(() => {
        if (abandonedCartTimer.current) clearTimeout(abandonedCartTimer.current);
        
        if (cartItems.length > 0 && currentUser) {
            abandonedCartTimer.current = setTimeout(() => {
                MarketingService.triggerAbandonedCartSequence(currentUser.email, cartItems.length);
            }, 30000); // 30s demo trigger
        }

        return () => {
            if (abandonedCartTimer.current) clearTimeout(abandonedCartTimer.current);
        };
    }, [cartItems, currentUser]);

    // --- Actions ---

    // Legacy switch for demo, repurposed if needed, but primary auth is now via signIn
    const handleLogin = async (userId: string) => {
        setIsLoadingAuth(true);
        try {
            // Note: In Supabase mode, 'switching' isn't simple without real auth. 
            // We assume this might be used for mock/demo purposes if implemented in IdentityService.
            await IdentityService.switchUserSession(userId);
            const me = await IdentityService.getCurrentUser();
            setCurrentUser(me);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const signIn = async (email: string, pass: string) => {
        setIsLoadingAuth(true);
        try {
            await IdentityService.login(email, pass);
            const me = await IdentityService.getCurrentUser();
            setCurrentUser(me);
            return true;
        } catch (e: any) {
            alert(e.message);
            return false;
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const signUp = async (email: string, pass: string, name: string) => {
        setIsLoadingAuth(true);
        try {
            await IdentityService.register(email, pass, name);
            // Auto login usually handled by Supabase if email confirmation off, or wait for email.
            // For now we try to fetch user
            const me = await IdentityService.getCurrentUser();
            if (me) setCurrentUser(me);
            else alert("Account created! Please check your email to confirm.");
            return true;
        } catch (e: any) {
            alert(e.message);
            return false;
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const signOut = async () => {
        setIsLoadingAuth(true);
        await IdentityService.logout();
        setCurrentUser(null);
        setIsLoadingAuth(false);
        window.location.href = '/';
    };

    const addToCart = (product: Product, selectedPlan?: SubscriptionPlan, selectedVariation?: ProductVariation, quantity: number = 1, priceTier?: 'standard' | 'wholesale') => {
        setCartItems(prev => {
            // Check existing item logic
            const existing = prev.find(item => {
                const sameId = item.id === product.id;
                const samePlan = product.isSubscription 
                    ? item.selectedPlan?.duration === selectedPlan?.duration 
                    : true;
                const sameVariation = item.selectedVariation?.id === selectedVariation?.id;
                const sameTier = item.priceTier === priceTier;
                return sameId && samePlan && sameVariation && sameTier;
            });

            if (existing) {
                const totalQty = existing.quantity + quantity;
                const limit = selectedVariation ? selectedVariation.stock : product.stock;
                
                if (totalQty > limit) {
                    alert(`Sorry, only ${limit} units available.`);
                    return prev;
                }

                return prev.map(item => 
                    item.cartItemId === existing.cartItemId ? { ...item, quantity: totalQty } : item
                );
            }
            
            // New Item
            const limit = selectedVariation ? selectedVariation.stock : product.stock;
            if (quantity > limit) {
                alert(`Sorry, only ${limit} units available.`);
                return prev;
            }
            
            let price = selectedVariation ? selectedVariation.price : (selectedPlan ? selectedPlan.price : product.price);
            if (!selectedVariation && !selectedPlan && priceTier === 'wholesale' && product.wholesalePrice) {
                price = product.wholesalePrice;
            }

            const newItem: CartItem = {
                ...product,
                quantity: quantity,
                cartItemId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                selectedPlan: selectedPlan,
                selectedVariation: selectedVariation,
                price: price,
                priceTier: priceTier
            };
            
            return [...prev, newItem];
        });
    };

    const removeFromCart = (cartItemId: string) => {
        setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, quantity: number) => {
        setCartItems(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity } : item));
    };

    const clearCart = () => setCartItems([]);

    const toggleWishlist = async (productId: string) => {
        const newList = wishlist.includes(productId)
            ? wishlist.filter(id => id !== productId)
            : [...wishlist, productId];
        
        setWishlist(newList);
        await EngagementService.saveWishlist(newList);
    };

    const isInWishlist = (productId: string) => wishlist.includes(productId);

    return {
        // State
        cartItems,
        wishlist,
        user: currentUser,
        usersList,
        isLoadingAuth,
        
        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        
        // Auth Actions
        login: handleLogin, // Deprecated mock login
        signIn,
        signUp,
        signOut,
        
        // Computed Permissions
        isAdmin: currentUser?.role === 'admin',
        isEditor: currentUser?.role === 'editor',
        isDriver: currentUser?.role === 'driver',
        canManageStore: currentUser?.role === 'admin' || currentUser?.role === 'editor'
    };
};
