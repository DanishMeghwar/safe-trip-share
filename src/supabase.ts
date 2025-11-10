// src/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Get credentials from environment variables (important for security!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
