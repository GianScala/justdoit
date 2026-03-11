import FeatureCard from "./FeatureCard";

const features = [
  {
    index: "01",
    title: "Smart Scheduling",
    desc: "Tasks automatically sort by deadline and priority so the most important work always appears first.",
  },
  {
    index: "02",
    title: "Project Folders",
    desc: "Group tasks into folders to manage projects, teams, and workflows in a clean structure.",
  },
  {
    index: "03",
    title: "Task Automation",
    desc: "Create repeating tasks, automated reminders, and scheduled workflows.",
  },
  {
    index: "04",
    title: "Deadlines",
    desc: "Track upcoming deadlines and keep projects moving without missing critical dates.",
  },
  {
    index: "05",
    title: "Productivity Metrics",
    desc: "Get insight into completed tasks and overall productivity trends.",
  },
  {
    index: "06",
    title: "Focused Workflow",
    desc: "A clean interface designed to remove distractions and keep you focused.",
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
              Organize work without friction
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