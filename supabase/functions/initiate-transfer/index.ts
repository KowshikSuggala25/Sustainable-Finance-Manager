// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import { Resend } from "npm:resend@2.0.0";
declare const Deno: any;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { from_account_id, to_account_id, amount, description } = await req.json();

    // Validate input
    if (!from_account_id || !to_account_id || !amount) {
      throw new Error("Missing required fields");
    }

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Verify accounts belong to user
    const { data: accounts, error: accountsError } = await supabaseClient
      .from("accounts")
      .select("id, balance")
      .eq("user_id", user.id)
      .in("id", [from_account_id, to_account_id]);

    if (accountsError || !accounts || accounts.length !== 2) {
      throw new Error("Invalid accounts");
    }

    const fromAccount = accounts.find((a: any) => a.id === from_account_id);
    
    const balance = Number(fromAccount.balance);
    const transferAmount = Number(amount);

    if (balance < transferAmount) {
      throw new Error("Insufficient balance");
    }

    // Generate 6-digit OTP
    const otpArray = new Uint32Array(1);
    crypto.getRandomValues(otpArray);
    const otp = (otpArray[0] % 900000 + 100000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create transfer record
    const { data: transfer, error: transferError } = await supabaseClient
      .from("transfers")
      .insert({
        user_id: user.id,
        from_account_id,
        to_account_id,
        amount,
        description,
        status: "pending",
      })
      .select()
      .single();

    if (transferError) {
      throw transferError;
    }

    // Store OTP in user profile
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        otp_code: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile with OTP:", updateError);
      throw new Error("Failed to generate verification code");
    }

    // Send OTP via email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    // Default to the verified domain if configured, otherwise fallback to testing domain
    // You should set RESEND_SENDER_EMAIL in your Supabase secrets: npx supabase secrets set RESEND_SENDER_EMAIL="noreply@your-domain.com"
    const senderEmail = Deno.env.get("RESEND_SENDER_EMAIL") || "Finance Manager <onboarding@resend.dev>";

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      try {
        await resend.emails.send({
          from: senderEmail,
          to: [user.email!],
          subject: "Transfer Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">Transfer Verification</h1>
              <p style="color: #666; font-size: 16px;">You have initiated a transfer of <strong>₹${amount.toLocaleString("en-IN")}</strong>.</p>
              <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <p style="color: #888; margin-bottom: 10px;">Your verification code is:</p>
                <h2 style="color: #333; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h2>
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you did not initiate this transfer, please ignore this email or contact support.</p>
            </div>
          `,
        });
        console.log("OTP email sent successfully to:", user.email);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue even if email fails - OTP is stored in database
      }
    } else {
      console.log("RESEND_API_KEY not configured - OTP stored in database:", otp);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transferId: transfer.id,
        message: "OTP sent to your email",
        debugOtp: otp // TODO: Remove in production
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in initiate-transfer:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
