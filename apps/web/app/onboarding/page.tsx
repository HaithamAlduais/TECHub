"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_CV_API_URL ?? "http://localhost:8013";

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [university, setUniversity] = useState("");
  const [targetRole, setTargetRole] = useState("backend");
  const [characterClass, setCharacterClass] = useState("mage");
  const [githubConnected, setGithubConnected] = useState(false);
  const [hackerrankConnected, setHackerrankConnected] = useState(false);
  const [credlyConnected, setCredlyConnected] = useState(false);
  const [importUsed, setImportUsed] = useState(false);
  const [experience, setExperience] = useState("");
  const [personality, setPersonality] = useState("");
  const [result, setResult] = useState("");
  const [connectedPlatforms, setConnectedPlatforms] = useState(0);
  const [guardReason, setGuardReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Session state removed. Use local user IDs directly.
  }, [userId, developerId]);

  useEffect(() => {
    if (!developerId || step !== 3) return;
    void refreshStep3Status();
  }, [developerId, step, importUsed]);

  async function loadProgress() {
    if (!userId || !developerId) return;
    setLoading(true);
    setResult("");
    try {
      const response = await fetch(`${API_BASE}/onboarding/${developerId}`, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(data?.detail ?? "Failed to load progress.");
        return;
      }

      const steps = data.steps ?? {};
      setStep(Math.min(Math.max((data.current_step ?? 1) + 1, 1), TOTAL_STEPS));
      if (steps["1"]) {
        setName(steps["1"].name ?? "");
        setCountry(steps["1"].country ?? "");
        setUniversity(steps["1"].university ?? "");
      }
      if (steps["2"]) {
        setTargetRole(steps["2"].target_role ?? "backend");
        setCharacterClass(steps["2"].character_class ?? "mage");
      }
      if (steps["3"]) {
        setImportUsed(Boolean(steps["3"].import_used));
        setGithubConnected(Boolean(steps["3"]?.connected_platforms?.github));
        setHackerrankConnected(Boolean(steps["3"]?.connected_platforms?.hackerrank));
        setCredlyConnected(Boolean(steps["3"]?.connected_platforms?.credly));
      }
      if (steps["5"]) {
        setExperience(steps["5"].experience ?? "");
      }
      if (steps["6"]) {
        setPersonality(steps["6"].personality ?? "");
      }
      setResult("Loaded saved onboarding progress.");
    } catch {
      setResult("Could not load saved onboarding progress.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshStep3Status() {
    if (!userId || !developerId) return;
    try {
      const guardResp = await fetch(
        `${API_BASE}/onboarding/${developerId}/can-continue?step=3&import_used=${importUsed}`,
        { headers: { "Content-Type": "application/json" } },
      );
      const guardData = await guardResp.json();
      setConnectedPlatforms(guardData.connected_platforms ?? 0);
      setGuardReason(guardData.reason ?? null);
    } catch {
      setConnectedPlatforms(0);
      setGuardReason("Could not load platform connection status.");
    }
  }

  async function connectPlatform(platform: "github" | "hackerrank" | "credly") {
    if (!developerId) {
      setResult("Enter developer ID first.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      if (platform === "github") {
        await fetch(`${API_BASE}/integrations/github/callback?developer_id=${developerId}&code=demo-code`, {
          headers: { "Content-Type": "application/json" },
        });
        setGithubConnected(true);
      } else {
        await fetch(`${API_BASE}/integrations/${platform}/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ developer_id: developerId, username: `${platform}_user` }),
        });
        if (platform === "hackerrank") setHackerrankConnected(true);
        if (platform === "credly") setCredlyConnected(true);
      }
      await refreshStep3Status();
      setResult(`${platform} connected.`);
    } catch {
      setResult(`Failed to connect ${platform}.`);
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentStep() {
    if (!developerId || !userId) return;
    setLoading(true);
    setResult("");
    const payloadByStep: Record<number, unknown> = {
      1: { name, country, university },
      2: { target_role: targetRole, character_class: characterClass },
      3: {
        import_used: importUsed,
        connected_platforms: {
          github: githubConnected,
          hackerrank: hackerrankConnected,
          credly: credlyConnected,
        },
      },
      4: { import_used: importUsed },
      5: { experience },
      6: { personality, skipped: personality.trim().length === 0 },
    };

    try {
      if (step === 3) {
        const guardResp = await fetch(
          `${API_BASE}/onboarding/${developerId}/can-continue?step=3&import_used=${importUsed}`,
          { headers: { "Content-Type": "application/json" } },
        );
        const guardData = await guardResp.json();
        if (!guardData.can_continue) {
          setResult(guardData.reason ?? "Connect at least one platform first.");
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE}/onboarding/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_id: developerId,
          step,
          data: payloadByStep[step],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(data?.detail ?? "Save failed.");
      } else {
        const next = Math.min(step + 1, TOTAL_STEPS);
        setStep(next);
        setResult(`Saved step ${step}.`);
      }
    } catch {
      setResult("Request failed. Ensure cv-aggregator is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-24">
      <h1 className="text-3xl font-bold">Onboarding Wizard</h1>
      <p className="mt-3 text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>
      <div className="mt-6 grid max-w-lg gap-4">
        <p className="text-xs text-muted-foreground">Session user: {userId || "not set"}</p>
        <div className="space-y-2">
          <Label htmlFor="developer-id">Developer ID</Label>
          <Input id="developer-id" value={developerId} onChange={(e) => setDeveloperId(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => void loadProgress()} disabled={loading || !userId || !developerId}>
          Load Saved Progress
        </Button>

        {step === 1 ? (
          <>
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Input placeholder="University" value={university} onChange={(e) => setUniversity(e.target.value)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Input placeholder="Target role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            <Input
              placeholder="Character class"
              value={characterClass}
              onChange={(e) => setCharacterClass(e.target.value)}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Label className="text-sm">Connect at least one platform (or use Import Center)</Label>
            <p className="text-xs text-muted-foreground">Server connected platforms: {connectedPlatforms}</p>
            {guardReason ? <p className="text-xs text-muted-foreground">{guardReason}</p> : null}
            <div className="flex gap-2">
              <Button
                variant={githubConnected ? "default" : "outline"}
                onClick={() => void connectPlatform("github")}
                disabled={loading}
              >
                GitHub
              </Button>
              <Button
                variant={hackerrankConnected ? "default" : "outline"}
                onClick={() => void connectPlatform("hackerrank")}
                disabled={loading}
              >
                HackerRank
              </Button>
              <Button
                variant={credlyConnected ? "default" : "outline"}
                onClick={() => void connectPlatform("credly")}
                disabled={loading}
              >
                Credly
              </Button>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <Button variant={importUsed ? "default" : "outline"} onClick={() => setImportUsed((v) => !v)}>
            {importUsed ? "Import Center Used" : "Mark Import Center as Used"}
          </Button>
        ) : null}

        {step === 5 ? (
          <Input
            placeholder="Manual experience summary"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        ) : null}

        {step === 6 ? (
          <Input
            placeholder="Personality/skills preference (leave blank to skip)"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          />
        ) : null}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={loading || step === 1}>
            Back
          </Button>
          <Button onClick={saveCurrentStep} disabled={loading || !developerId || !userId}>
            {loading ? "Saving..." : step === TOTAL_STEPS ? "Finish" : "Save and Continue"}
          </Button>
        </div>
        {result ? <p className="text-sm text-muted-foreground">{result}</p> : null}
      </div>
    </main>
  );
}
