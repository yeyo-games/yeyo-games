import { createClient } from '@supabase/supabase-js';

// Cuentas, progreso y rankings. Solo se activa cuando hay credenciales en .env.
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
