import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Substitua estas variáveis pelos valores do seu projeto Supabase
// Se estiver usando Vite/Webpack, use process.env ou import.meta.env
// Para este exemplo, usamos variáveis que devem ser definidas no seu ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublicKey = process.env.SUPABASE_PUBLIC_KEY;

export const supabase = createClient(supabaseUrl, supabasePublicKey);