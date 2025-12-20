
import { createClient } from '@supabase/supabase-js';

// Configuration for Dietanic Cloud Database
// These keys connect the app to your specific Supabase project
const SUPABASE_URL = 'https://fzkvqrrygygxptxrvtbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6a3ZxcnJ5Z3lneHB0eHJ2dGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzQ1MjYsImV4cCI6MjA4MTc1MDUyNn0.Uef2EPku_BDh8URMutkDVV16B64foN4e_BjN323615Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const checkConnection = async () => {
    try {
        const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Supabase Connection Failed:', error.message);
            return false;
        }
        console.log('✅ Supabase Connection Verified');
        return true;
    } catch (err) {
        console.error('❌ Supabase Connection Error:', err);
        return false;
    }
};
