import FlowStep from "./FlowStep";

const steps = [
  {
    number: "01",
    title: "Tell AI the goal",
    desc: "Write what you need to get done in plain language, even if it is messy.",
  },
  {
    number: "02",
    title: "Review the plan",
    desc: "The assistant breaks it into tasks, deadlines, and a focused next step.",
  },
  {
    number: "03",
    title: "Apply and move",
    desc: "Approve the plan and let the AI keep organizing what to do next.",
  },
];

export default function WorkflowSection() {
  return (
    <section className="landing-section" id="how-it-works">
      <div className="page-container">
        <div className="landing-section-header">
          <div>
            <div className="landing-section-kicker">Workflow</div>
            <h2 className="landing-section-title">How the AI handles the planning</h2>
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
