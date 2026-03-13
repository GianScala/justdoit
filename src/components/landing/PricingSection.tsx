import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "Free",
    detail: "Basic task manager",
    features: [
      "Projects",
      "Tasks",
      "Deadlines",
      "Manual task management",
      "Limited AI usage",
      "Daily AI token limit",
    ],
    cta: "Start Free",
    href: "/auth/register",
  },
  {
    name: "Pro",
    price: "$12/month",
    detail: "$120/year",
    features: [
      "Unlimited AI planning",
      "Start My Day",
      "What should I do now",
      "Fix my week",
      "Goal to AI plan generation",
      "Proactive AI assistant",
    ],
    cta: "Upgrade to Pro",
    href: "/auth/register",
  },
];

export default function PricingSection() {
  return (
    <section className="landing-section">
      <div className="page-container">
        <div className="landing-section-header">
          <div>
            <div className="landing-section-kicker">Pricing</div>
            <h2 className="landing-section-title">Choose how much AI planning you want</h2>
          </div>
        </div>

        <div className="landing-pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className="landing-price-card">
              <div className="landing-price-header">
                <div className="landing-price-name">{plan.name} Plan</div>
                <div className="landing-price-value">{plan.price}</div>
                <div className="landing-price-detail">{plan.detail}</div>
              </div>

              <div className="landing-price-list">
                {plan.features.map((feature) => (
                  <div key={feature} className="landing-price-item">
                    {feature}
                  </div>
                ))}
              </div>

              <div className="landing-price-action">
                <Link href={plan.href} className="btn btn-primary">
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
