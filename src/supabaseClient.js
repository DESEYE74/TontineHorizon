import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Tant que Supabase n'est pas configuré (voir .env.example), l'application
// tourne en "mode démo" avec les données d'exemple de src/data/mock.js.
export const isDemoMode = !url || !key;

export const supabase = isDemoMode ? null : createClient(url, key);
