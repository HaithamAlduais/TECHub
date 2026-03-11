"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authHeaders, getUserId } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_CV_API_URL ?? "http://localhost:8013";

type CVResponse = {
  user: { id: string; email: string; username: string };
  character: { class: string | null; target_role: string | null; level: string; xp: number };
  skills: Array<{ id: string; name: string; score: number; evidence_count: number; trust_tier: string }>;
};

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<CVResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) setUserId(getUserId());
  }, [userId]);

  async function loadProfile() {
    if (!userId) return;
    setLoading(true);
    setMessage("");
    setData(null);
    try {
      const response = await fetch(`${API_BASE}/cv/${userId}`, { headers: authHeaders() });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body?.detail ?? "Failed to load profile.");
      } else {
        setData(body);
      }
    } catch {
      setMessage("Request failed. Ensure cv-aggregator is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-24">
      <h1 className="text-3xl font-bold">Living CV / Character Profile</h1>
      <p className="mt-3 text-sm text-muted-foreground">Session user: {getUserId() || "not set"}</p>
      <div className="mt-6 flex max-w-xl gap-2">
        <Input placeholder="Paste user_id from register response" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <Button onClick={loadProfile} disabled={loading || !userId}>
          {loading ? "Loading..." : "Load Profile"}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      {data ? (
        <div className="mt-6 space-y-4 rounded-lg border p-4">
          <p className="font-semibold">{data.user.username}</p>
          <p className="text-sm text-muted-foreground">{data.user.email}</p>
          <p className="text-sm">
            Level: <span className="font-medium">{data.character.level}</span> | XP:{" "}
            <span className="font-medium">{data.character.xp}</span>
          </p>
          <p className="text-sm">
            Class: {data.character.class ?? "N/A"} | Target Role: {data.character.target_role ?? "N/A"}
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Skills</p>
            {data.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills yet.</p>
            ) : (
              data.skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between text-sm">
                  <span>{skill.name}</span>
                  <span className="text-muted-foreground">
                    {skill.score} ({skill.trust_tier})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
