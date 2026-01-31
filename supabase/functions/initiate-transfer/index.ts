// @ts-ignore: Deno global
// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { from_account_id, to_account_id, amount, description, recipient_email, recipient_user_id } = await req.json()

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Verify source account belongs to user
    const { data: fromAccount, error: fromError } = await supabaseClient
      .from('accounts')
      .select('balance, user_id')
      .eq('id', from_account_id)
      .single()

    if (fromError || !fromAccount || fromAccount.user_id !== user.id) {
      throw new Error('Invalid source account')
    }

    // Verify sufficient balance
    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance')
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create transfer record
    const { data: transfer, error: transferError } = await supabaseClient
      .from('transfers')
      .insert({
        user_id: user.id,
        from_account_id,
        to_account_id,
        amount,
        description,
        status: 'pending',
        otp_verified: false,
      })
      .select()
      .single()

    if (transferError) {
      throw transferError
    }

    // Store OTP in profiles (or create a separate OTP table)
    const { error: otpError } = await supabaseClient
      .from('profiles')
      .update({
        otp_code: otp,
        otp_expires_at: otpExpiry.toISOString(),
      })
      .eq('id', recipient_user_id)

    if (otpError) {
      throw otpError
    }

    // Send OTP email to recipient
    // Note: You'll need to implement email sending functionality
    // For now, we'll log it (in production, use a service like Resend, SendGrid, etc.)
    console.log(`OTP for transfer ${transfer.id}: ${otp}`)
    console.log(`Recipient email: ${recipient_email}`)

    return new Response(
      JSON.stringify({
        success: true,
        transferId: transfer.id,
        message: 'OTP sent to recipient email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
