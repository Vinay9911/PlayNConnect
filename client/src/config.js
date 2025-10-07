const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_KEY,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
};
console.log('Config:', config);
export default config;