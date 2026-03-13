import FeatureCard from "./FeatureCard";

const features = [
  {
    index: "01",
    title: "AI Planning",
    desc: "Turn a messy goal into a structured plan with tasks, deadlines, and the right project in seconds.",
  },
  {
    index: "02",
    title: "Start My Day",
    desc: "Open the app and see what matters now without manually sorting through every task yourself.",
  },
  {
    index: "03",
    title: "Fix My Week",
    desc: "Let the assistant spread deadlines, reduce overload, and reorganize your schedule when things pile up.",
  },
  {
    index: "04",
    title: "Projects",
    desc: "Keep work separated into clean folders while the assistant still sees the full picture across everything.",
  },
  {
    index: "05",
    title: "What Now",
    desc: "When focus breaks, ask one question and get the single next task you should work on.",
  },
  {
    index: "06",
    title: "Manual Control",
    desc: "Edit, move, and manage tasks yourself whenever needed without losing the AI planning layer.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="landing-section">
      <div className="page-container">
        <div className="landing-section-header">
          <div>
            <div className="landing-section-kicker">Features</div>
            <h2 className="landing-section-title">
              AI first. Tasks second.
            </h2>
          </div>
        </div>

        <div className="landing-feature-grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.index}
              index={feature.index}
              title={feature.title}
              desc={feature.desc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
