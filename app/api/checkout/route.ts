import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

const PRICE_IDS = {
  plus: "price_1U2OSVPMO38BtkfdvIkjWVaI",
  pro: "price_1U2OSqPMO38Btkfdzz6iZs21",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const plan = body.plan as "plus" | "pro";

    if (!["plus", "pro"].includes(plan)) {
      return NextResponse.json(
        {
          error: "Invalid plan.",
        },
        {
          status: 400,
        }
      );
    }

    const priceId = PRICE_IDS[plan];

    const origin =
      request.headers.get("origin") ||
      "http://localhost:3000";

    const session =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        success_url:
          `${origin}/pricing?success=true`,

        cancel_url:
          `${origin}/pricing?canceled=true`,
      });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(
      "Stripe checkout error:",
      error
    );

    return NextResponse.json(
      {
        error: "Could not start checkout.",
      },
      {
        status: 500,
      }
    );
  }
}