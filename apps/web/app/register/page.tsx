"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_CV_API_URL ?? "http://localhost:8013";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authProvider, setAuthProvider] = useState<"local" | "firebase">("local");
  const [idToken, setIdToken] = useState("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          auth_provider: authProvider,
          id_token: idToken || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(data?.detail ?? "Registration failed.");
      } else {
        setSession(data.user_id, data.developer_id);
        setResult(`Registered: ${data.username} (developer_id: ${data.developer_id})`);
      }
    } catch {
      setResult("Request failed. Ensure cv-aggregator is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your TECHub account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-provider">Auth Provider</Label>
              <select
                id="auth-provider"
                value={authProvider}
                onChange={(e) => setAuthProvider(e.target.value as "local" | "firebase")}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="local">Local</option>
                <option value="firebase">Firebase</option>
              </select>
            </div>
            {authProvider === "firebase" ? (
              <div className="space-y-2">
                <Label htmlFor="id-token">Firebase ID Token (optional)</Label>
                <Input
                  id="id-token"
                  value={idToken}
                  onChange={(e) => setIdToken(e.target.value)}
                  placeholder="Paste token if already signed in"
                />
              </div>
            ) : null}
            <Button className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          {result ? <p className="mt-3 text-sm text-muted-foreground">{result}</p> : null}
          <p className="mt-3 text-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4">
              Already have an account? Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
