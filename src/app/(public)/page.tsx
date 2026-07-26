import { CtaSection } from "@/components/public/cta-section";
import { FeatureHighlights } from "@/components/public/feature-highlights";
import { HeroSection } from "@/components/public/hero-section";
import { ParallaxBackground } from "@/components/public/parallax-background";
import { ScrollDancer } from "@/components/public/scroll-dancer";
import { StatsSection } from "@/components/public/stats-section";

export default function HomePage() {
  return (
    <>
      <ParallaxBackground />
      <HeroSection />
      <FeatureHighlights />
      <ScrollDancer />
      <StatsSection />
      <CtaSection />
    </>
  );
}
