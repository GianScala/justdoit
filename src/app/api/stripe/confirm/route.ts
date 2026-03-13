import { NextRequest, NextResponse } from "next/server";

function toIso(seconds?: number | null): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export async function GET(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 500 },
    );
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  const sessionResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=subscription`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  const session = await sessionResponse.json().catch(() => null);
  if (!sessionResponse.ok || !session) {
    return NextResponse.json(
      { error: session?.error?.message || "Unable to verify Stripe session." },
      { status: 502 },
    );
  }

  const subscription = session.subscription;
  const plan = session.metadata?.plan === "yearly" ? "pro_yearly" : "pro_monthly";
  const status = typeof subscription?.status === "string" ? subscription.status : "inactive";

  return NextResponse.json({
    subscriptionType: plan,
    subscriptionStatus: status === "active" || status === "trialing" ? "active" : status,
    subscriptionStartDate: toIso(subscription?.current_period_start),
    subscriptionRenewalDate: toIso(subscription?.current_period_end),
  });
}
