import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Daily Free",
    price: "0",
    period: " SAR",
    description: "10 free tokens every day",
    features: [
      "10 tokens reset at midnight",
      "Living CV + all 7 proof connections",
      "First opportunity load free per tab",
      "Apply and track applications",
      "No subscription — use as you need",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Token Packs",
    price: "15",
    period: " SAR+",
    description: "Buy more when you need them",
    features: [
      "50 tokens — 15 SAR",
      "150 tokens — 35 SAR",
      "500 tokens — 99 SAR",
      "2000 tokens — 299 SAR",
      "ATS export (JSON/PDF/Word) costs tokens",
      "Refresh opportunities costs tokens",
    ],
    cta: "Buy Tokens",
    popular: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-secondary/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">Pricing</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your path
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            10 free tokens daily. Buy more when you need them. No monthly lock-in.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 sm:p-8 ${
                plan.popular
                  ? "border-accent bg-card shadow-lg shadow-accent/10"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
