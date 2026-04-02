import { GitBranch, Code2, Award, Briefcase, Globe, BookOpen } from "lucide-react";

const integrations = [
  {
    name: "GitHub",
    description: "Commits, repos, contributions",
    icon: GitBranch,
  },
  {
    name: "HackerRank",
    description: "Coding challenges & ranks",
    icon: Code2,
  },
  {
    name: "Credly",
    description: "Certifications & badges",
    icon: Award,
  },
  {
    name: "LinkedIn",
    description: "Work history & connections",
    icon: Briefcase,
  },
  {
    name: "LeetCode",
    description: "Problem solving stats",
    icon: Globe,
  },
  {
    name: "Coursera",
    description: "Courses & specializations",
    icon: BookOpen,
  },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">Integrations</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Connect your developer ecosystem
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Import data from platforms you already use. Your skills get verified automatically.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-accent/50"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                <integration.icon className="h-6 w-6" />
              </div>
              <h3 className="font-medium">{integration.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{integration.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
