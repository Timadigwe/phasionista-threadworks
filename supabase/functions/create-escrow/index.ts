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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { clothId, customerWallet, designerWallet, amount } = await req.json()

    // Validate required fields
    if (!clothId || !customerWallet || !designerWallet || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify cloth exists and get details
    const { data: cloth, error: clothError } = await supabaseClient
      .from('clothes')
      .select('*, users!clothes_created_by_fkey (phasion_name)')
      .eq('id', clothId)
      .single()

    if (clothError || !cloth) {
      return new Response(
        JSON.stringify({ error: 'Cloth item not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create escrow payment record
    const { data, error } = await supabaseClient
      .from('escrow_payments')
      .insert({
        cloth_id: clothId,
        customer_wallet: customerWallet,
        designer_wallet: designerWallet,
        amount: parseFloat(amount),
        status: 'pending',
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating escrow:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create escrow payment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Escrow payment created successfully',
        escrow: data,
        cloth: cloth
      }),
      { 
        status: 201, 
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
