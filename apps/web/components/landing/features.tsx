import { Award, GitBranch, Zap, Target, FileDown, ListChecks } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Living CV",
    description:
      "Your profile automatically updates with every commit, contribution, and certification. No more outdated resumes.",
  },
  {
    icon: Award,
    title: "Verified Skills",
    description:
      "Connect GitHub, HackerRank, Kaggle, and more to prove your skills with real data, not just self-assessments.",
  },
  {
    icon: FileDown,
    title: "ATS Export",
    description:
      "Export your CV as JSON, PDF, or Word. ATS-optimized so your applications pass automated screening.",
  },
  {
    icon: ListChecks,
    title: "Application Tracker",
    description:
      "Track every application in one place. Status pipeline from Applied to Viewed, Interview, Offer, or Rejected.",
  },
  {
    icon: Target,
    title: "Smart Matching",
    description:
      "Opportunities matched to your evidence-backed profile: jobs, hackathons, co-ops, GDP programs, and training.",
  },
  {
    icon: Zap,
    title: "Auto-Apply",
    description:
      "One-tap apply. Our agent fills and submits forms using your CV data. Live preview so you stay in control.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">Features</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to level up
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From skill verification to job automation, TECHub gives you the complete toolkit for
            your developer career.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50 hover:bg-card/80"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
