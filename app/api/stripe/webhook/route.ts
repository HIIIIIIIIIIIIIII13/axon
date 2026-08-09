import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  const signature =
    request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
      },
      {
        status: 400,
      }
    );
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature error:",
      error
    );

    return NextResponse.json(
      {
        error: "Invalid webhook signature.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const userId =
        session.metadata?.supabase_user_id;

      const plan =
        session.metadata?.plan;

      if (
        !userId ||
        !plan ||
        !["plus", "pro"].includes(plan)
      ) {
        console.error(
          "Missing Stripe metadata:",
          session.metadata
        );

        return NextResponse.json(
          {
            error: "Missing subscription metadata.",
          },
          {
            status: 400,
          }
        );
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan,
        })
        .eq("id", userId);

      if (error) {
        console.error(
          "Supabase plan update error:",
          error
        );

        return NextResponse.json(
          {
            error: "Could not update Axon plan.",
          },
          {
            status: 500,
          }
        );
      }

      console.log(
        `Axon user ${userId} upgraded to ${plan}`
      );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        error: "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}