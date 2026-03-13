"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_CV_API_URL ?? "http://localhost:8013";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    
    try {
      // 1. Create account with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setResult(authError.message);
        setLoading(false);
        return;
      }

      const token = authData.session?.access_token;
      if (!token) {
        // If email confirmation is required, session might be null.
        setResult("Account created! Please check your email to verify your account.");
        setLoading(false);
        return;
      }

      // 2. Sync newly created account with our backend
      const response = await fetch(`${API_BASE}/auth/sync`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setResult(data?.detail ?? "Registration failed during backend sync.");
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
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
