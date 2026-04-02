'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function OpportunitiesPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
      } else {
        router.push('/login')
      }
    })
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <div className="flex h-screen items-center justify-center text-white">Loading dashboard...</div>

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple logged in nav */}
      <nav className="border-b border-white/10 bg-black backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-black">
              <span className="text-sm font-bold">T</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">TECHub</span>
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={handleSignOut} className="rounded-md border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="mt-3 text-gray-400">
            Logged in as {user.email}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Resume Onboarding</h2>
              <p className="text-sm text-gray-400 mb-6">Complete your profile setup to unlock accurate role matching and AI extraction features. Track your progress here.</p>
            </div>
            <Link href="/onboarding?edit=true" className="inline-flex justify-center rounded-md bg-white px-6 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors">
              Go to Onboarding Wizard
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">My Profile (CV)</h2>
              <p className="text-sm text-gray-400 mb-6">View, edit, and export your dynamically generated professional CV based on your AI-extracted data.</p>
            </div>
            <Link href="/profile" className="inline-flex justify-center rounded-md bg-white px-6 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors">
              View Profile
            </Link>
          </div>
          
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-2">Opportunities Feed</h2>
            <p className="text-sm text-gray-400">Sprint 3 skeleton: matched jobs, hackathons, co-op, GDP, and training will be shown here. Complete onboarding to see personalized opportunities.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
