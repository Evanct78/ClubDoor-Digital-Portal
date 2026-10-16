import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const { supabaseUrl, supabaseAnonKey } = {
      supabaseUrl: Deno.env.get("SUPABASE_URL")!,
      supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY")!,
    };

    const authHeader = req.headers.get("Authorization") || "";
    const body = await req.json();
    const { clubId, plan, modules, userEmail, clubName } = body;

    if (!clubId || !plan || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Define product prices (in cents)
    const PRICE_FULL = 2900; // 29.00 EUR
    const PRICE_MODULE = 1499; // 14.99 EUR

    const price = plan === "full" ? PRICE_FULL : PRICE_MODULE;
    const productName = plan === "full"
      ? `ClubDoor — Abonnement complet (${clubName})`
      : `ClubDoor — Abonnement module (${clubName})`;

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { clubId },
      });
    }

    // Create checkout session with subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: productName },
            recurring: { interval: "month" },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/?subscription=canceled`,
      metadata: {
        clubId,
        plan,
        modules: modules ? modules.join(",") : "",
      },
    });

    // Insert or update subscription record in DB
    const subRes = await fetch(`${supabaseUrl}/rest/v1/club_subscriptions?club_id=eq.${clubId}`, {
      method: "GET",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });
    const subData = await subRes.json();

    if (subData && subData.length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/club_subscriptions?club_id=eq.${clubId}`, {
        method: "PATCH",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          plan,
          status: "trialing",
          stripe_customer_id: customer.id,
          active_modules: modules || [],
          updated_at: new Date().toISOString(),
        }),
      });
    } else {
      await fetch(`${supabaseUrl}/rest/v1/club_subscriptions`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          club_id: clubId,
          plan,
          status: "trialing",
          stripe_customer_id: customer.id,
          active_modules: modules || [],
        }),
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
