'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset instructions sent to your email.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-white/10 bg-black/50 p-8 backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">Reset password</h2>
          <p className="mt-2 text-sm text-gray-400">We'll send you an email with instructions</p>
        </div>

        <form onSubmit={handleReset} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 py-2 px-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}
          {message && <div className="text-sm text-green-500">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-white py-2 px-4 text-sm font-semibold text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-white hover:text-gray-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
