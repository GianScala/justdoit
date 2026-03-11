import { ReactNode } from "react";

interface Props { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; }

export default function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <section className="auth-card">
      <div className="center" style={{ marginBottom: 24 }}>
        <h2 className="auth-heading">{title}</h2>
        {subtitle && <p className="auth-subheading">{subtitle}</p>}
      </div>
      {children}
      {footer && <div className="center" style={{ marginTop: 18, fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{footer}</div>}
    </section>
  );
}
