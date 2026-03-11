"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_CV_API_URL ?? "http://localhost:8013";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.detail ?? "Failed to request reset.");
      } else {
        setToken(data.reset_token ?? "");
        setMessage("Reset requested. Use the generated token below.");
      }
    } catch {
      setMessage("Request failed. Ensure cv-aggregator is running.");
    } finally {
      setLoading(false);
    }
  }

  async function submitReset() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.detail ?? "Reset failed.");
      } else {
        setMessage(data?.message ?? "Password reset.");
      }
    } catch {
      setMessage("Request failed. Ensure cv-aggregator is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-3xl font-bold">Forgot Password</h1>
      <div className="mt-6 grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button onClick={requestReset} disabled={loading || !email}>
          Request reset link
        </Button>
        <div className="space-y-2">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <Button onClick={submitReset} disabled={loading || !token || !newPassword}>
          Reset password
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </main>
  );
}
