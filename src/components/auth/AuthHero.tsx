interface Props { badge: string; title: React.ReactNode; subtitle: string; features?: string[]; }

export default function AuthHero({ badge, title, subtitle, features }: Props) {
  return (
    <section>
      <div className="auth-hero-badge">{badge}</div>
      <h1 className="auth-hero-title">{title}</h1>
      <p className="auth-hero-sub">{subtitle}</p>
      {features && (
        <ul className="auth-features">
          {features.map((f) => (
            <li key={f}><span className="auth-check">✓</span> {f}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
