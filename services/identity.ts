
import { User } from '../types';
import { supabase } from './supabase';
import { GlobalEventBus, EVENTS } from './eventBus';

// Microservice: Identity & Access Management (Supabase Implementation)
export const IdentityService = {
  
  // Get currently logged in user from Supabase Session
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // 1. Attempt to fetch profile
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // 2. Retry Logic: Supabase triggers (like auto-profile creation) might be slightly delayed
    if (!profile) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const retry = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        profile = retry.data;
    }

    // 3. Self-Healing: If profile is still missing but user is authenticated, create a default profile
    if (!profile) {
        console.warn("User authenticated but profile missing. Attempting recovery...");
        const newProfile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: 'customer',
            wallet_balance: 0,
            wishlist: []
        };
        
        // Use upsert to handle potential race conditions with triggers
        const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
        
        if (insertError) {
            console.error("Profile recovery failed:", JSON.stringify(insertError));
            
            // Final fetch attempt in case upsert/trigger succeeded in parallel
            const finalTry = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (finalTry.data) {
                profile = finalTry.data;
            } else {
                // Fallback to transient user object so app doesn't crash
                // This allows the user to browse, though profile actions might fail until backend resolves
                return {
                    id: session.user.id,
                    email: session.user.email!,
                    name: newProfile.name,
                    role: 'customer',
                    status: 'active',
                    addresses: [],
                    wishlist: [],
                    phone: ''
                };
            }
        } else {
            profile = newProfile;
        }
    }

    // Auto-promote dietanic.co emails to admin for demo purposes if they are customers
    let role = profile.role;
    if (profile.email && profile.email.endsWith('@dietanic.co') && role !== 'admin') {
        role = 'admin';
        // Attempt to persist this fix
        supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id).then(() => console.log("Auto-promoted to Admin"));
    }

    // Map Supabase Profile to App User Type
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name || session.user.email?.split('@')[0] || 'User',
      role: role as 'admin' | 'customer' | 'editor' | 'driver',
      status: 'active',
      addresses: [], // Address management would need its own table or column
      wishlist: profile.wishlist || [], // Load persistent wishlist
      phone: profile.phone
    };
  },

  // Login (Email/Password)
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    // Do not reload page here, state management in store handles reset
  },

  // Register (Sign Up)
  register: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name } // Metadata
      }
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      // Auto-assign role based on domain
      const role = email.endsWith('@dietanic.co') ? 'admin' : 'customer';

      // Create Profile Record
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        name: name,
        role: role,
        wallet_balance: 0,
        wishlist: []
      });
      
      if (profileError) {
          // Log specific error object for debugging
          console.error("Profile creation failed", JSON.stringify(profileError));
          // We don't throw here to allow flow to continue; getCurrentUser will attempt recovery/healing
      }
      
      GlobalEventBus.emit(EVENTS.USER_REGISTERED, { ...data.user, name, role });
    }
    return data;
  },

  // List Users (Admin Only)
  getUsers: async (): Promise<User[]> => {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
      // Return empty list if error (e.g. permission denied)
      return [];
    }
    
    return profiles.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        role: p.role,
        status: 'active',
        addresses: [],
        wishlist: p.wishlist || []
    }));
  },

  updateUser: async (u: User) => { 
      const { error } = await supabase.from('profiles').update({
          name: u.name,
          role: u.role,
          phone: u.phone
      }).eq('id', u.id);
      
      if(error) throw new Error(error.message);
  },

  addUser: async (u: User) => {
      // This function is for admin adding manual users, might fail in pure auth context
      // Requires admin role in RLS
      const { error } = await supabase.from('profiles').insert({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          phone: u.phone,
      });
      if (error) throw new Error(error.message);
  },

  deleteUser: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw new Error(error.message);
  },

  // Legacy support for mock switching (Removed in Prod, but kept empty to prevent crash)
  switchUserSession: async (id: string) => { console.warn("Switch user disabled in Cloud Mode"); },
  getUserById: async (id: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      return data as unknown as User;
  }
};
