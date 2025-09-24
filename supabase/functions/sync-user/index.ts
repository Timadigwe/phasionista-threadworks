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

    // Parse request body
    const { user, event } = await req.json()

    console.log('User sync event:', event, user)

    if (event === 'user.created' && user) {
      // Extract user data from auth user
      const userData = {
        id: user.id,
        email: user.email,
        phasion_name: user.user_metadata?.phasion_name || user.email?.split('@')[0] || 'User',
        name: user.user_metadata?.name || user.user_metadata?.phasion_name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'user',
        photo: user.user_metadata?.avatar_url || 'default.jpg',
        solana_wallet: user.user_metadata?.solana_wallet || '',
        active: true,
        email_verified: user.email_confirmed_at ? true : false,
        created_at: user.created_at,
        updated_at: user.updated_at
      }

      console.log('Creating user record:', userData)

      // Insert user into custom users table
      const { data, error } = await supabaseClient
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) {
        console.error('Error creating user record:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create user record', details: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('User record created successfully:', data)

      return new Response(
        JSON.stringify({
          message: 'User synced successfully',
          user: data
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Event not handled' }),
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
