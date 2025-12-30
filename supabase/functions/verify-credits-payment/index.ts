import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CREDITS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role for updating credits
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("No session ID provided");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify the session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);
    if (creditsToAdd <= 0) {
      throw new Error("Invalid credits amount");
    }

    // Check if this session was already processed
    const { data: existingTx } = await supabaseClient
      .from('credit_transactions')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingTx) {
      logStep("Session already processed", { transactionId: existingTx.id });
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyProcessed: true,
        credits: creditsToAdd 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current credits
    const { data: currentCredits } = await supabaseClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle();

    const newTotal = (currentCredits?.credits || 0) + creditsToAdd;

    // Update or insert credits
    const { error: creditsError } = await supabaseClient
      .from('user_credits')
      .upsert({ 
        user_id: user.id, 
        credits: newTotal 
      }, { 
        onConflict: 'user_id' 
      });

    if (creditsError) {
      logStep("Error updating credits", { error: creditsError });
      throw new Error("Failed to update credits");
    }

    // Record the transaction
    const { error: txError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: creditsToAdd,
        transaction_type: 'purchase',
        description: `Purchased ${creditsToAdd} credits`,
        stripe_session_id: sessionId,
      });

    if (txError) {
      logStep("Error recording transaction", { error: txError });
      // Don't throw - credits were added successfully
    }

    logStep("Credits added successfully", { 
      creditsAdded: creditsToAdd, 
      newTotal 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      credits: creditsToAdd,
      newTotal 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
