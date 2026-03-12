import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

const stats = [
  { value: "50K+", label: "Developers" },
  { value: "2M+", label: "Skills Verified" },
  { value: "15K+", label: "Jobs Matched" },
  { value: "98%", label: "Match Accuracy" },
];

export function Stats() {
  return (
    <section className="relative border-y border-border bg-secondary/30 py-16 overflow-hidden">
      {/* Dotted background scoped only to this section — tiny canvas, no lag */}
      <DottedGlowBackground
        className="pointer-events-none absolute inset-0 -z-10"
        gap={18}
        radius={1.5}
        opacity={0.5}
        speedScale={0.6}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
