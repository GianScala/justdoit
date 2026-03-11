import FlowStep from "./FlowStep";

const steps = [
  {
    number: "01",
    title: "Create Tasks",
    desc: "Add tasks with priorities, deadlines, and notes.",
  },
  {
    number: "02",
    title: "Organize Projects",
    desc: "Group tasks into folders and project boards.",
  },
  {
    number: "03",
    title: "Automate Workflow",
    desc: "Set recurring tasks and automated schedules.",
  },
];

export default function WorkflowSection() {
  return (
    <section className="landing-section">
      <div className="page-container">
        <div className="landing-section-header">
          <div>
            <div className="landing-section-kicker">Workflow</div>
            <h2 className="landing-section-title">How JustDoIt works</h2>
          </div>
        </div>

        <div className="landing-flow">
          {steps.map((step) => (
            <FlowStep
              key={step.number}
              number={step.number}
              title={step.title}
              desc={step.desc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}