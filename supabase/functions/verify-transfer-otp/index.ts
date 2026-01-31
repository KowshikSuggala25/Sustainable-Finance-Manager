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

    const { transferId, otp } = await req.json()

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get transfer details
    const { data: transfer, error: transferError } = await supabaseClient
      .from('transfers')
      .select('*')
      .eq('id', transferId)
      .eq('user_id', user.id)
      .single()

    if (transferError || !transfer) {
      throw new Error('Transfer not found')
    }

    if (transfer.status !== 'pending') {
      throw new Error('Transfer already processed')
    }

    // Get recipient's account to find their user_id
    const { data: toAccount, error: toAccountError } = await supabaseClient
      .from('accounts')
      .select('user_id')
      .eq('id', transfer.to_account_id)
      .single()

    if (toAccountError || !toAccount) {
      throw new Error('Recipient account not found')
    }

    // Verify OTP from recipient's profile
    const { data: recipientProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('otp_code, otp_expires_at')
      .eq('id', toAccount.user_id)
      .single()

    if (profileError || !recipientProfile) {
      throw new Error('Recipient profile not found')
    }

    // Check if OTP matches and is not expired
    const otpExpiry = new Date(recipientProfile.otp_expires_at)
    const now = new Date()

    if (recipientProfile.otp_code !== otp) {
      return new Response(
        JSON.stringify({ verified: false, message: 'Invalid OTP' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (now > otpExpiry) {
      return new Response(
        JSON.stringify({ verified: false, message: 'OTP expired' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // OTP is valid, process the transfer
    // 1. Deduct from source account
    const { data: fromAccount } = await supabaseClient
      .from('accounts')
      .select('balance')
      .eq('id', transfer.from_account_id)
      .single()

    if (!fromAccount || fromAccount.balance < transfer.amount) {
      throw new Error('Insufficient balance')
    }

    const { error: deductError } = await supabaseClient
      .from('accounts')
      .update({ balance: fromAccount.balance - transfer.amount })
      .eq('id', transfer.from_account_id)

    if (deductError) {
      throw deductError
    }

    // 2. Add to destination account
    const { data: destAccount } = await supabaseClient
      .from('accounts')
      .select('balance')
      .eq('id', transfer.to_account_id)
      .single()

    const { error: addError } = await supabaseClient
      .from('accounts')
      .update({ balance: (destAccount?.balance || 0) + transfer.amount })
      .eq('id', transfer.to_account_id)

    if (addError) {
      // Rollback: add back to source account
      await supabaseClient
        .from('accounts')
        .update({ balance: fromAccount.balance })
        .eq('id', transfer.from_account_id)
      throw addError
    }

    // 3. Update transfer status
    const { error: updateError } = await supabaseClient
      .from('transfers')
      .update({
        status: 'completed',
        otp_verified: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transferId)

    if (updateError) {
      throw updateError
    }

    // 4. Clear OTP from recipient's profile
    await supabaseClient
      .from('profiles')
      .update({
        otp_code: null,
        otp_expires_at: null,
      })
      .eq('id', toAccount.user_id)

    return new Response(
      JSON.stringify({
        verified: true,
        message: 'Transfer completed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
