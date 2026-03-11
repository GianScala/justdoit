import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import WorkflowSection from "./WorkflowSection";
import CtaSection from "./CtaSection";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <CtaSection />
    </div>
  );
}