const steps = [
  {
    step: "01",
    title: "Connect Your Accounts",
    description:
      "Link GitHub, HackerRank, Credly, and other platforms. We securely analyze your activity to build your skill profile.",
  },
  {
    step: "02",
    title: "Build Your Character",
    description:
      "Complete the onboarding quest to set your goals, preferences, and career aspirations. Watch your XP grow.",
  },
  {
    step: "03",
    title: "Get Matched & Apply",
    description:
      "Our AI finds opportunities that match your verified skills. Auto-apply with one click and track your progress.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-secondary/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">How It Works</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to your dream job
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-full hidden h-px w-full bg-border md:block" />
                )}
                <div className="flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-mono text-xl font-bold text-accent">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
