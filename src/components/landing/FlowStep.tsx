type FlowStepProps = {
    number: string;
    title: string;
    desc: string;
  };
  
  export default function FlowStep({
    number,
    title,
    desc,
  }: FlowStepProps) {
    return (
      <div className="landing-flow-step">
        <div className="landing-flow-number">{number}</div>
  
        <div>
          <div className="landing-flow-title">{title}</div>
          <div className="landing-flow-desc">{desc}</div>
        </div>
      </div>
    );
  }