import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="page-container landing-hero-inner">
        <div className="landing-kicker">Task automation platform</div>

        <h1 className="landing-title">
          Automate tasks
          <br />
          Stay focused
        </h1>

        <p className="landing-subtitle">
          JustDoIt helps you organize projects, prioritize work, and automate
          repetitive tasks so you can focus on what actually matters.
        </p>

        <div className="landing-actions">
          <Link href="/auth/register" className="btn btn-primary">
            Create Account
          </Link>

          <Link href="/auth/login" className="btn btn-outline">
            Login
          </Link>
        </div>

        <div className="landing-stats">
          <div className="landing-stat">
            <strong>Smart</strong>
            Scheduling
          </div>

          <div className="landing-stat">
            <strong>Folders</strong>
            Projects
          </div>

          <div className="landing-stat">
            <strong>Auto</strong>
            Workflows
          </div>
        </div>
      </div>
    </section>
  );
}