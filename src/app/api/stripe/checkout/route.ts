import { NextRequest, NextResponse } from "next/server";

function getStripePriceId(plan: "monthly" | "yearly"): string | undefined {
  return plan === "monthly"
    ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
    : process.env.STRIPE_PRO_YEARLY_PRICE_ID;
}

function getBaseUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  const plan = body?.plan === "yearly" ? "yearly" : "monthly";
  const uid = typeof body?.uid === "string" ? body.uid : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const priceId = getStripePriceId(plan);

  if (!uid) {
    return NextResponse.json({ error: "Missing uid." }, { status: 400 });
  }

  if (!priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price id for ${plan} plan.` },
      { status: 500 },
    );
  }

  const baseUrl = getBaseUrl(req);
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${baseUrl}/dashboard/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${baseUrl}/dashboard/profile?checkout=cancelled`);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[uid]", uid);
  params.set("metadata[plan]", plan);

  if (email) {
    params.set("customer_email", email);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.url) {
    return NextResponse.json(
      { error: data?.error?.message || "Unable to create Stripe checkout session." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: data.url });
}
