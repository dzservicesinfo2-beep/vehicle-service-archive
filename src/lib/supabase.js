import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://upstmxbdtirzqklavxnm.supabase.co'

const supabaseKey = 'sb_publishable_e2L0mEy6bEfQRHEas5Oc5Q_wLkFOWsn'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)