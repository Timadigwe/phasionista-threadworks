// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore
declare const Deno: any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get all auth users
    const { data: { users }, error: authError } = await supabaseClient.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch auth users' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${users.length} auth users`)

    let syncedCount = 0
    let skippedCount = 0

    // Sync each user
    for (const authUser of users) {
      try {
        // Check if user already exists in custom users table
        const { data: existingUser } = await supabaseClient
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single()

        if (existingUser) {
          console.log(`User ${authUser.email} already exists, skipping`)
          skippedCount++
          continue
        }

        // Create user record
        const userData = {
          id: authUser.id,
          email: authUser.email,
          phasion_name: authUser.user_metadata?.phasion_name || authUser.email?.split('@')[0] || 'User',
          name: authUser.user_metadata?.name || authUser.user_metadata?.phasion_name || authUser.email?.split('@')[0],
          role: authUser.user_metadata?.role || 'user',
          photo: authUser.user_metadata?.avatar_url || 'default.jpg',
          solana_wallet: authUser.user_metadata?.solana_wallet || '',
          active: true,
          email_verified: authUser.email_confirmed_at ? true : false,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at
        }

        const { error: insertError } = await supabaseClient
          .from('users')
          .insert(userData)

        if (insertError) {
          console.error(`Error syncing user ${authUser.email}:`, insertError)
          continue
        }

        console.log(`Synced user: ${authUser.email}`)
        syncedCount++

      } catch (error) {
        console.error(`Error processing user ${authUser.email}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'User sync completed',
        total: users.length,
        synced: syncedCount,
        skipped: skippedCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
