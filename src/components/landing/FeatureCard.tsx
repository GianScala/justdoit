type FeatureCardProps = {
    index: string;
    title: string;
    desc: string;
  };
  
  export default function FeatureCard({
    index,
    title,
    desc,
  }: FeatureCardProps) {
    return (
      <div className="landing-feature-card">
        <div className="landing-feature-index">{index}</div>
        <h3 className="landing-feature-title">{title}</h3>
        <p className="landing-feature-desc">{desc}</p>
      </div>
    );
  }