import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="page-container landing-hero-inner">
        <div className="landing-kicker">AI productivity assistant</div>

        <h1 className="landing-title">
          Stop planning tasks.
          <br />
          Let AI organize your work.
        </h1>

        <p className="landing-subtitle">
          Your AI productivity assistant turns messy goals into structured
          plans, tasks, and daily priorities automatically.
        </p>

        <div className="landing-actions">
          <Link href="/auth/register" className="btn btn-primary">
            Start Free
          </Link>

          <Link href="#how-it-works" className="btn btn-outline">
            See how it works
          </Link>
        </div>

        <div className="landing-stats">
          <div className="landing-stat">
            <strong>Goal</strong>
            To plan
          </div>

          <div className="landing-stat">
            <strong>Daily</strong>
            Priorities
          </div>

          <div className="landing-stat">
            <strong>Less</strong>
            Planning
          </div>
        </div>
      </div>
    </section>
  );
}
