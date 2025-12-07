import { createClient } from "@supabase/supabase-js";

// --- CONFIGURAÇÃO DO SUPABASE ---
// Substitua estas variáveis pelos valores do seu projeto Supabase
// Se estiver usando Vite/Webpack, use process.env ou import.meta.env
// Para este exemplo, usamos variáveis que devem ser definidas no seu ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;

export const supabase = createClient(supabaseUrl, supabasePublicKey);
