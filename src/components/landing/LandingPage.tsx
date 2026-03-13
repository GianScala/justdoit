import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import WorkflowSection from "./WorkflowSection";
import PricingSection from "./PricingSection";
import CtaSection from "./CtaSection";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <PricingSection />
      <CtaSection />
    </div>
  );
}
