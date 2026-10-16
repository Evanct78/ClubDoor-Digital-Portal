import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: `Webhook signature failed: ${message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clubId = session.metadata?.clubId;
        const plan = session.metadata?.plan;
        const modulesRaw = session.metadata?.modules || "";
        const modules = modulesRaw ? modulesRaw.split(",").filter(Boolean) : [];
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (clubId) {
          const { data: existing } = await supabase
            .from("club_subscriptions")
            .select("id")
            .eq("club_id", clubId)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("club_subscriptions")
              .update({
                plan,
                status: "active",
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                active_modules: modules,
                updated_at: new Date().toISOString(),
              })
              .eq("club_id", clubId);
          } else {
            await supabase.from("club_subscriptions").insert({
              club_id: clubId,
              plan,
              status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              active_modules: modules,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: sub } = await supabase
          .from("club_subscriptions")
          .select("club_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (sub) {
          const status = subscription.status === "active" ? "active"
            : subscription.status === "past_due" ? "past_due"
            : subscription.status === "canceled" ? "canceled"
            : subscription.status === "trialing" ? "trialing"
            : "inactive";

          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          await supabase
            .from("club_subscriptions")
            .update({
              status,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("club_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
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
