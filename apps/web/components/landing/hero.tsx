import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import TypingText from "@/components/animata/text/typing-text";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">Now with AI-powered skill matching</span>
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl min-h-[140px] flex items-center justify-center">
            <TypingText
              text="Your developer skills verified and gamified."
              delay={50}
              className="text-accent"
              alwaysVisibleCount={0}
              repeat={false}
              hideCursorOnComplete={true}
            />
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Connect your GitHub, HackerRank, and Credly accounts to build a living CV that
            evolves with you. Earn XP, unlock badges, and let AI match you with perfect
            opportunities.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="px-8 py-4 bg-transparent border-3 border-accent text-white uppercase tracking-widest font-bold"
            >
              I am a Developer
            </Link>
            <Link
              href="/employers"
              className="px-8 py-4 bg-transparent border-2 border-accent text-accent uppercase tracking-widest font-bold hover:bg-accent/10 transition-colors"
            >
              We are Hiring
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              5 min setup
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <span className="ml-2 text-xs text-muted-foreground">techub.io/profile/alex</span>
            </div>
            <div className="p-6 sm:p-8">
              <ProfilePreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfilePreview() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background p-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-secondary" />
            <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              42
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold">Alex Chen</p>
            <p className="text-sm text-muted-foreground">Full Stack Developer</p>
          </div>
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Level 42</span>
              <span className="text-accent">8,420 XP</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-3/4 rounded-full bg-accent" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:col-span-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-medium">Top Skills</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: "TypeScript", level: 92, verified: true },
              { name: "React", level: 88, verified: true },
              { name: "Node.js", level: 85, verified: false },
              { name: "PostgreSQL", level: 78, verified: true },
            ].map((skill) => (
              <div key={skill.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      {skill.name}
                      {skill.verified && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Contributions", value: "2,847" },
            { label: "Badges Earned", value: "24" },
            { label: "Global Rank", value: "#1,205" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-background p-3 text-center"
            >
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
