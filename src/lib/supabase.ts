import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Configuration:');
console.log('  URL:', supabaseUrl);
console.log('  Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');
console.log('  Environment:', import.meta.env.MODE);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not set!');
  console.error('Please create a .env.local file with your Supabase credentials.');
  console.error('See env.example for the required variables.');
  console.error('This will cause authentication timeouts.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    detectSessionInUrl: true
  }
})

console.log('✅ Supabase client created successfully');
console.log('  Client URL:', supabase.supabaseUrl);
console.log('  Auth URL:', supabase.auth.url);

