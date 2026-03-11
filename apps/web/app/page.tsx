import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Integrations } from "@/components/landing/integrations";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="relative overflow-hidden">
        <DottedGlowBackground className="pointer-events-none absolute inset-0 -z-10" />
        <div className="relative z-10">
          <Hero />
          <Stats />
          <Features />
          <HowItWorks />
          <Integrations />
          <Pricing />
          <CTA />
        </div>
      </main>
      <Footer />
    </div>
  );
}
