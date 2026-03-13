import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="landing-cta">
      <div className="page-container">
        <div className="landing-cta-box">
          <h2 className="landing-cta-title">
            Stop planning and let AI take over
          </h2>

          <p className="landing-cta-text">
            Go from a messy goal to a clear plan, tasks, and next steps in under
            a minute.
          </p>

          <div className="landing-cta-actions">
            <Link href="/auth/register" className="btn btn-primary">
              Start Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
