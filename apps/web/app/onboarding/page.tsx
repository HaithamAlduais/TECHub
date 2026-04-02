'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { GitBranch, UploadCloud, CheckCircle, Briefcase, Code, PenTool, LayoutDashboard, ArrowRight, X } from 'lucide-react'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step 1 State
  const [githubConnected, setGithubConnected] = useState(false)
  const [linkedinUploaded, setLinkedinUploaded] = useState(false)

  // Step 2 State
  const [optionalConnections, setOptionalConnections] = useState<Record<string, boolean>>({
    Behance: false,
    Dribbble: false,
    HackerRank: false,
    Kaggle: false
  })

  // Step 3 State
  const [terminalLines, setTerminalLines] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()
  const API_BASE = 'http://localhost:8001'

  useEffect(() => {
    fetchProgress()
    
    // Check if returning from GitHub OAuth
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('github') === 'true') {
      setGithubConnected(true)
      window.history.replaceState({}, '', '/onboarding')
    }
  }, [])

  const fetchProgress = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')

    const providers = session.user?.app_metadata?.providers || []
    if (providers.includes('github')) {
      setGithubConnected(true)
    }

    try {
      const res = await fetch(`${API_BASE}/onboarding/progress`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        
        const searchParams = new URLSearchParams(window.location.search)
        const isEditMode = searchParams.get('edit') === 'true' || searchParams.get('github') === 'true'

        if (isEditMode) {
          setCurrentStep(1)
        } else {
          setCurrentStep(data.current_step || 1)
          if (data.is_completed) {
            router.push('/profile') 
            return
          }
        }
        
        if (data.steps?.['1']) {
          setGithubConnected(prev => prev || data.steps['1'].github_connected)
          setLinkedinUploaded(data.steps['1'].linkedin_uploaded)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const connectGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user repo',
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding?github=true`
      }
    })
  }

  const saveStep = async (stepNum: number, dataPayload: any) => {
    setSaving(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()

    try {
      const res = await fetch(`${API_BASE}/onboarding/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ step: stepNum, data: dataPayload })
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to save step')
      }
      
      const resData = await res.json()
      setCurrentStep(stepNum + 1) // Force progression to next step for proper UI rendering
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleNextStep1 = () => {
    saveStep(1, { github_connected: githubConnected, linkedin_uploaded: linkedinUploaded, skip_validation_for_dev: true })
  }

  const handleNextStep2 = () => {
    saveStep(2, { optionalConnections })
  }

  // Step 3 Terminal Effect
  useEffect(() => {
    if (currentStep === 3) {
      const lines = [
        "> Scraping GitHub repositories...",
        "> Reading LinkedIn PDF...",
        "> Extracting API stats...",
        "> AI building your profile... PLEASE WAIT."
      ]
      
      let currentLine = 0
      const interval = setInterval(() => {
        setTerminalLines(prev => [...prev, lines[currentLine]])
        currentLine++
        
        if (currentLine >= lines.length) {
          clearInterval(interval)
          setTimeout(() => {
            saveStep(3, { complete: true }).then(() => {
              router.push('/profile')
            })
          }, 1500)
        }
      }, 1200)

      return () => clearInterval(interval)
    }
  }, [currentStep])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSaving(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to parse PDF")
      }

      setLinkedinUploaded(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleOptionalConnection = (platform: string) => {
    setOptionalConnections(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }))
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white bg-black">Loading...</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white font-sans">
      <div className="relative w-full max-w-4xl space-y-8 rounded-none border-2 border-white/20 bg-[#0a0a0a] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
        
        <button 
          onClick={() => router.push('/opportunities')}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-white/50 hover:text-white uppercase font-mono text-xs md:text-sm tracking-widest p-2 transition-colors z-50 flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        
        {/* Progress Tracker */}
        <div className="mb-8 text-center uppercase tracking-widest font-mono pt-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Phase 0{currentStep} / 03</h1>
          <div className="h-2 w-full bg-white/10 flex rounded-none">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(currentStep / 3) * 100}%` }} />
          </div>
        </div>

        {error && <div className="border border-red-500 bg-red-500/10 p-4 text-red-500 font-mono mb-6">{error}</div>}

        {/* STEP 1: Mandatory Connections */}
        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Identity Verification</h2>
              <p className="text-white/50">Connect your core platforms offline to establish your baseline CV.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GitHub Card */}
              <button 
                onClick={connectGithub}
                className={`flex flex-col items-center justify-center p-8 md:p-12 border-2 transition-colors duration-200 ${
                  githubConnected 
                  ? 'border-accent bg-accent/20 text-accent' 
                  : 'border-white/20 bg-white/5 hover:border-white hover:bg-white/10 text-white'
                }`}
              >
                {githubConnected ? <CheckCircle className="w-16 h-16 md:w-20 md:h-20 mb-6" /> : <GitBranch className="w-16 h-16 md:w-20 md:h-20 mb-6" />}
                <span className="text-xl md:text-2xl font-bold uppercase tracking-wider text-center">
                  {githubConnected ? 'GitHub Connected' : 'Connect GitHub'}
                </span>
              </button>

              {/* LinkedIn Card */}
              <label 
                className={`flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed transition-colors duration-200 cursor-pointer ${
                  linkedinUploaded 
                  ? 'border-accent bg-accent/20 text-accent' 
                  : 'border-white/40 bg-white/5 hover:border-white hover:bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                {linkedinUploaded ? <CheckCircle className="w-16 h-16 md:w-20 md:h-20 mb-6" /> : <UploadCloud className="w-16 h-16 md:w-20 md:h-20 mb-6" />}
                <span className="text-xl md:text-2xl font-bold uppercase tracking-wider text-center">
                  {linkedinUploaded ? 'PDF Uploaded' : 'Upload LinkedIn (PDF)'}
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={handleNextStep1}
                disabled={saving}
                className="w-full py-4 text-xl md:text-2xl border-2 border-accent uppercase tracking-widest font-bold flex items-center justify-center gap-3 transition-colors bg-accent text-black hover:bg-accent/80 hover:border-accent/80 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Next Step'}
                {!saving && <ArrowRight className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Optional Connections */}
        {currentStep === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Better Results</h2>
              <p className="text-white/50">Enhance your AI-generated profile by connecting more platforms.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Optional Platforms */}
              {[
                { name: 'Behance', icon: <PenTool className="w-8 h-8 mb-3" /> },
                { name: 'Dribbble', icon: <LayoutDashboard className="w-8 h-8 mb-3" /> },
                { name: 'HackerRank', icon: <Code className="w-8 h-8 mb-3" /> },
                { name: 'Kaggle', icon: <Briefcase className="w-8 h-8 mb-3" /> },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => toggleOptionalConnection(platform.name)}
                  className={`flex flex-col items-center justify-center aspect-square p-4 border-2 transition-colors ${
                    optionalConnections[platform.name]
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-white/20 hover:border-white text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {platform.icon}
                  <span className="font-mono text-xs md:text-sm uppercase font-bold">{platform.name}</span>
                </button>
              ))}
            </div>

            {/* Secondary Dropzone */}
            <div className="mt-8">
              <label className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-white/40 cursor-pointer hover:bg-white/5 hover:border-white transition-colors group">
                <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,image/*" />
                <UploadCloud className="w-10 h-10 mb-4 text-white/50 group-hover:text-white transition-colors" />
                <span className="font-mono uppercase text-sm md:text-base text-white/50 group-hover:text-white tracking-wider text-center">Drop older CVs or Certificates here</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/')}
                className="w-full sm:w-1/3 py-4 text-xl border-2 border-white/20 tracking-widest uppercase font-bold text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                disabled={saving}
              >
                Back
              </button>
              <button
                onClick={handleNextStep2}
                disabled={saving}
                className="w-full sm:w-2/3 py-4 text-xl md:text-2xl border-2 border-accent uppercase tracking-widest font-bold flex items-center justify-center gap-3 transition-colors bg-accent text-black hover:bg-accent/80 hover:border-accent/80 disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Generate Profile'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AI Scraping Screen */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="h-[300px] md:h-[400px] w-full bg-black border-2 border-accent/50 p-6 font-mono text-accent overflow-hidden relative shadow-[0_4px_30px_rgba(0,255,0,0.15)]">
              <div className="space-y-4 relative z-20 text-sm md:text-base">
                <div className="flex items-center gap-2 mb-6 text-accent/50 border-b border-accent/20 pb-4">
                  <span className="font-bold tracking-widest">sysadmin@techub:~/generation</span>
                </div>
                
                {terminalLines.map((line, idx) => (
                  <div key={idx} className="animate-in slide-in-from-bottom-2 fade-in">{line}</div>
                ))}
                
                {terminalLines.length < 4 && (
                  <div className="animate-pulse font-bold text-xl">_</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
