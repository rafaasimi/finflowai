import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Substitua estas variáveis pelos valores do seu projeto Supabase
// Se estiver usando Vite/Webpack, use process.env ou import.meta.env
// Para este exemplo, usamos variáveis que devem ser definidas no seu ambiente
const supabaseUrl = process.env.SUPABASE_URL || 'https://sua-url-do-supabase.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima-publica';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);