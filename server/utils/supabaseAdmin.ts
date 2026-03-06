// Service-role Supabase client — bypasses RLS.
// NEVER import this file from app/ code; it is server-only.
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // @nuxtjs/supabase v2 (was SUPABASE_SERVICE_ROLE_KEY)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
