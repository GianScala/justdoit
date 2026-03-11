import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="landing-cta">
      <div className="page-container">
        <div className="landing-cta-box">
          <h2 className="landing-cta-title">
            Start organizing your work today
          </h2>

          <p className="landing-cta-text">
            Create a free account and start automating your tasks, projects, and
            daily workflow.
          </p>

          <div className="landing-cta-actions">
            <Link href="/auth/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}