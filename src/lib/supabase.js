import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = new URL(rawSupabaseUrl).origin

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)