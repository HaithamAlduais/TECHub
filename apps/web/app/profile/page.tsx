'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, ExternalLink, Pen, Download, RotateCcw, X, Image as ImageIcon, Github } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const INITIAL_PROFILE = {
  name: "Alex Developer",
  email: "alex@techub.dev",
  title: "Senior Full Stack Engineer",
  socials: ["github.com/alexdev", "linkedin.com/in/alexdev"],
  profileImage: "",
  skills: {
    verified: ["React", "TypeScript", "Node.js", "PostgreSQL", "Python"],
    unverified: ["Docker", "AWS", "Figma", "Agile", "C++"]
  },
  metrics: {
    hackerrank: "Top 5% Algorithms",
    kaggle: "Notebooks Expert",
    github_commits: "1,204 (Last yr)"
  },
  experience: [
    { role: "Frontend Lead", company: "TechCorp", years: "2021 - Present", desc: "Led migration to Next.js." },
    { role: "Software Engineer", company: "StartupX", years: "2018 - 2021", desc: "Built RESTful integrations." }
  ],
  education: [
    { degree: "BSc Computer Science", school: "State University", years: "2014 - 2018", image: "" },
    { degree: "AWS Certified Developer", school: "Amazon", years: "2022", desc: "Associate Level Certification", image: "" }
  ],
  projects: [
    { title: "E-Commerce Microservices", summary: "A scalable backend architecture using Docker and Node.", stack: ["Node.js", "Docker", "Redis"], link: "#" },
    { title: "Portfolio Generator", summary: "CLI tool to build static sites from markdown.", stack: ["TypeScript", "React"], link: "#" },
    { title: "Kaggle Dataset Analyzer", summary: "Jupyter notebooks for extracting trends in NLP.", stack: ["Python", "Pandas"], link: "#" }
  ]
}

export default function ProfileDashboard() {
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(false)
  const [isConnectingGithub, setIsConnectingGithub] = useState(false)

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          const { data: devData } = await supabase
            .from('developers')
            .select('cv_data')
            .eq('id', session.user.id)
            .single()

          if (devData && devData.cv_data) {
            setProfile(prev => ({
              ...prev,
              ...devData.cv_data
            }))
          }
        }

        if (session?.provider_token) {
          setIsConnectingGithub(true)
          const [reposRes, userRes] = await Promise.all([
            fetch('https://api.github.com/user/repos?visibility=public&sort=updated&per_page=10', {
              headers: {
                Authorization: `Bearer ${session.provider_token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }),
            fetch('https://api.github.com/user', {
              headers: {
                Authorization: `Bearer ${session.provider_token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            })
          ])

          const repos = await reposRes.json()
          const userData = await userRes.json()

          setProfile(prev => {
            const updatedProfile = { ...prev }

            if (Array.isArray(repos) && repos.length > 0) {
              updatedProfile.projects = repos.map((repo: any) => ({
                title: repo.name,
                summary: repo.description || "No description provided.",
                stack: repo.language ? [repo.language] : [],
                link: repo.html_url
              }))
            }

            if (userData?.login) {
              const githubUrl = `github.com/${userData.login}`
              updatedProfile.socials = prev.socials.map(s =>
                s.includes('github.com') ? githubUrl : s
              )
              if (!prev.socials.some(s => s.includes('github.com'))) {
                updatedProfile.socials.push(githubUrl)
              }
            }

            if (userData?.public_repos !== undefined) {
              updatedProfile.metrics = {
                ...prev.metrics,
                github_commits: `${userData.public_repos} Repos`
              }
            }

            return updatedProfile
          })
        }
      } catch (error) {
        console.error("Failed to fetch pinned repos:", error)
      } finally {
        setIsConnectingGithub(false)
        const searchParams = new URLSearchParams(window.location.search)
        if (searchParams.get('github') === 'true') {
          window.history.replaceState({}, '', '/profile')
        }
      }
    }

    loadProfileData()
  }, [])

  const connectGithub = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user repo',
        redirectTo: `${window.location.origin}/auth/callback?next=/profile?github=true`
      }
    })
  }

  // Edit Modals State
  const [editingHeader, setEditingHeader] = useState(false)
  const [editingSkills, setEditingSkills] = useState(false)
  const [editingKnowledge, setEditingKnowledge] = useState<number | null>(null)

  // Temp Edit States
  const [newSkill, setNewSkill] = useState("")

  const triggerRefresh = () => {
    setRefreshCooldown(true)
    setTimeout(() => setRefreshCooldown(false), 3000)
  }

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setProfile(prev => ({ ...prev, profileImage: url }))
    }
  }

  const handleKnowledgeImageUpload = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setProfile(prev => {
        const newEdu = [...prev.education]
        newEdu[idx] = { ...newEdu[idx], image: url }
        return { ...prev, education: newEdu }
      })
    }
  }

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkill.trim()) return
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        unverified: [...prev.skills.unverified, newSkill.trim()]
      }
    }))
    setNewSkill("")
  }

  const SectionHeader = ({ title, onEdit }: { title: string, onEdit?: () => void }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 group">
      <h2 className="text-4xl md:text-5xl font-black font-mono uppercase tracking-tighter text-white border-b-[6px] border-[#2563eb] pb-2 inline-block shadow-[0_4px_0_0_rgba(255,255,255,0.05)]">
        {title}
      </h2>
      {onEdit && (
        <button onClick={onEdit} className="mt-4 md:mt-0 p-3 border-4 border-[rgba(255,255,255,0.2)] hover:border-[#3b82f6] bg-black hover:bg-[#3b82f6]/10 rounded-none transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:translate-y-1 active:shadow-none self-start md:self-auto">
          <Pen className="w-5 h-5 text-gray-400 group-hover:text-[#60a5fa]" />
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">

      {/* Top Navigation */}
      <nav className="border-b-4 border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] sticky top-0 z-40 shadow-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none border-2 border-white bg-[#2563eb] text-white shadow-[2px_2px_0px_0px_white]">
              <span className="text-xl font-bold font-mono">T</span>
            </div>
            <span className="text-2xl font-black tracking-widest uppercase font-mono shadow-black drop-shadow-md">TECHub</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={triggerRefresh}
              disabled={refreshCooldown}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[rgba(255,255,255,0.2)] bg-black text-xs md:text-sm font-mono font-bold uppercase hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:translate-y-1 active:shadow-none transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${refreshCooldown ? 'animate-spin' : ''}`} />
              {refreshCooldown ? 'Cooldown (6d 23h)' : 'Refresh APIs'}
            </button>
            <Link href="/opportunities" className="rounded-none border-2 border-[#3b82f6] bg-[#3b82f6] text-black px-6 py-3 text-xs md:text-sm font-black font-mono uppercase hover:bg-[#60a5fa] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-1 active:shadow-none transition-all">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-16">

        {/* HEADER SECTION (ULTRA PREMIUM BRUTALIST) */}
        <section className="relative flex flex-col xl:flex-row gap-10 items-start mb-32 p-10 md:p-14 border-[6px] border-[rgba(255,255,255,0.1)] bg-[#0a0a0a] shadow-[16px_16px_0px_0px_rgba(255,255,255,0.05)] group">
          <button onClick={() => setEditingHeader(true)} className="absolute top-6 right-6 p-4 border-4 border-[rgba(255,255,255,0.2)] bg-black hover:border-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-none hidden group-hover:block transition-all z-10 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
            <Pen className="w-6 h-6 text-gray-400 group-hover:text-[#60a5fa]" />
          </button>

          <label className="w-48 h-48 border-4 border-dashed border-[rgba(255,255,255,0.3)] bg-black flex flex-col items-center justify-center text-gray-500 shrink-0 hover:border-[#3b82f6] hover:text-[#60a5fa] cursor-pointer transition-all relative overflow-hidden group/image shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
            <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base uppercase font-black font-mono text-center px-4 pointer-events-none">Add Photo</span>
            )}
            <div className={`absolute inset-0 bg-[#2563eb]/80 flex items-center justify-center transition-opacity ${profile.profileImage ? 'opacity-0 group-hover/image:opacity-100' : 'opacity-0'}`}>
              <Pen className="w-10 h-10 text-white" />
            </div>
          </label>

          <div className="flex-1 mt-2">
            <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#60a5fa] leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{profile.name}</h1>
            <p className="text-3xl text-[#60a5fa] font-mono font-bold mb-8 tracking-tight drop-shadow-md">{profile.title}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-4 text-base md:text-lg text-gray-300 font-mono uppercase font-bold">
              <span className="bg-[#111] px-4 py-2 border-[3px] border-[rgba(255,255,255,0.1)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">{profile.email}</span>
              {profile.socials.map(s => <a href={`https://${s}`} target="_blank" rel="noopener noreferrer" key={s} className="bg-[#111] px-4 py-2 border-[3px] border-[rgba(255,255,255,0.1)] hover:border-[#60a5fa] hover:text-[#60a5fa] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">{s}</a>)}
            </div>
          </div>

          {/* Export Action CTA - EXACT TEAM 1 REQUIREMENTS */}
          <div className="w-full xl:w-auto mt-12 xl:mt-0 relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full xl:w-[340px] flex flex-col items-center justify-center gap-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black uppercase tracking-[0.15em] px-8 py-8 border-[6px] border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] active:translate-y-2 active:shadow-none transition-all group"
            >
              <Download className="w-10 h-10 mb-2 group-hover:-translate-y-1 transition-transform" />
              <span className="text-2xl text-center leading-tight">Export<br />ATS CV</span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-6 right-0 w-full bg-[#0a0a0a] border-[6px] border-[#3b82f6] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-20 flex flex-col font-mono text-base uppercase font-bold">
                <div className="p-6 border-b-[4px] border-[#3b82f6] bg-[#2563eb] text-white font-black flex items-center justify-center gap-3 tracking-[0.2em] shadow-inner">
                  <CheckCircle className="w-5 h-5" /> TECHub Proven
                </div>
                <button className="px-6 py-5 text-center hover:bg-[#111] border-b-2 border-white/10 transition-colors">.PDF Format</button>
                <button className="px-6 py-5 text-center hover:bg-[#111] border-b-2 border-white/10 transition-colors">.DOCX Format</button>
                <button className="px-6 py-5 text-center hover:bg-[#111] transition-colors">.JSON Format</button>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-20 gap-y-24">

          {/* LEFT COLUMN: Main Timelines & Projects */}
          <div className="lg:col-span-7 space-y-24">

            {/* WORK HISTORY MAP */}
            <section className="relative">
              <SectionHeader title="Work History" onEdit={() => { }} />
              {/* Continuous vertical timeline track */}
              <div className="absolute left-[38px] top-[140px] bottom-10 w-[4px] bg-[rgba(255,255,255,0.05)]" />

              <div className="space-y-16 pl-4 mt-12 relative">
                {profile.experience.map((exp, i) => (
                  <div key={i} className="relative pl-16 group hover:-translate-y-1 transition-transform">
                    {/* Retro chunky node explicitly mounted on the timeline */}
                    <div className="absolute w-6 h-6 bg-white top-2 left-[27px] outline outline-[10px] outline-[#050505] group-hover:bg-[#3b82f6] transition-colors shadow-[0_0_20px_rgba(255,255,255,0.5)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10" />

                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white drop-shadow-sm">{exp.role}</h3>

                    <div className="flex flex-col sm:flex-row sm:items-center text-sm md:text-lg font-mono font-bold text-[#60a5fa] mb-6 bg-[#0a0a0a] border-[3px] border-[rgba(255,255,255,0.1)] border-l-[6px] border-l-[#2563eb] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
                      <span className="uppercase tracking-widest">{exp.company}</span>
                      <span className="sm:ml-auto text-gray-500 tracking-wider mt-2 sm:mt-0">{exp.years}</span>
                    </div>

                    <p className="text-gray-400 leading-relaxed text-xl font-medium tracking-wide border-l-4 border-transparent hover:border-[rgba(255,255,255,0.1)] pl-4 transition-all">{exp.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* KNOWLEDGE HISTORY */}
            <section className="relative">
              <SectionHeader title="Knowledge Base" />
              <div className="absolute left-[38px] top-[140px] bottom-10 w-[4px] bg-[rgba(59,130,246,0.1)]" />

              <div className="space-y-16 pl-4 mt-12 relative">
                {profile.education.map((edu, i) => (
                  <div key={i} className="relative pl-16 group hover:-translate-y-1 transition-transform">
                    <button onClick={() => setEditingKnowledge(i)} className="absolute top-0 right-0 p-4 border-4 border-[rgba(255,255,255,0.2)] bg-black hover:border-[#3b82f6] hover:text-[#60a5fa] rounded-none hidden xl:group-hover:block transition-all shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] z-20">
                      <Pen className="w-5 h-5" />
                    </button>
                    {/* Fixed blue Square node */}
                    <div className="absolute w-6 h-6 bg-[#2563eb] top-2 left-[27px] shadow-[0_0_25px_rgba(37,99,235,1)] outline outline-[10px] outline-[#050505] z-10 group-hover:bg-[#60a5fa]" />

                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 pr-20 text-white drop-shadow-sm leading-tight">{edu.degree}</h3>

                    <div className="flex flex-col sm:flex-row sm:items-center text-sm md:text-lg font-mono font-bold text-gray-300 mb-5 uppercase bg-[#0a0a0a] border-[3px] border-[rgba(255,255,255,0.1)] border-l-[6px] border-l-[#60a5fa] p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
                      <span className="tracking-widest">{edu.school}</span>
                      <span className="sm:ml-auto text-gray-500 tracking-wider mt-2 sm:mt-0">{edu.years}</span>
                    </div>

                    {edu.desc && <p className="text-gray-400 text-lg mb-6 italic tracking-wide pl-4 border-l-4 border-transparent group-hover:border-[rgba(255,255,255,0.1)] transition-all">{edu.desc}</p>}

                    {edu.image && (
                      <div className="mt-6 border-4 border-[#3b82f6] p-2 max-w-[300px] bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] group-hover:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.3)] transition-all">
                        <img src={edu.image} alt="Certificate" className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Skills & Metrics */}
          <div className="lg:col-span-5 space-y-24">

            {/* SKILLS SET MATRIX */}
            <section>
              <SectionHeader title="Skills Matrix" onEdit={() => setEditingSkills(true)} />

              <div className="mt-12 bg-[#0a0a0a] p-10 border-[6px] border-[rgba(255,255,255,0.1)] shadow-[12px_12px_0px_0px_rgba(34,197,94,0.15)] relative overflow-hidden group hover:border-[#22c55e]/50 transition-colors">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#22c55e]/10 blur-[80px] rounded-full point-events-none transition-opacity duration-1000 group-hover:bg-[#22c55e]/20" />

                <h3 className="text-base font-black font-mono uppercase text-[#4ade80] mb-8 flex items-center gap-4 tracking-[0.2em] border-b-4 border-[#22c55e]/30 pb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  <CheckCircle className="w-6 h-6" /> AI-Verified Set
                </h3>

                {/* As per user Team 1 rule: "Verified Skills (Blue/Green Tags with a checkmark)" */}
                <div className="flex flex-wrap gap-4 relative z-10">
                  {profile.skills.verified.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-3 px-5 py-3 bg-[#2563eb] border-2 border-[rgba(255,255,255,0.3)] text-white text-base md:text-lg font-bold font-mono tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default">
                      {skill} <CheckCircle className="w-5 h-5 text-[#86efac]" />
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-12 bg-[#0a0a0a] p-10 border-[6px] border-[rgba(255,255,255,0.05)] shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] relative overflow-hidden">
                <h3 className="text-base font-black font-mono uppercase text-gray-500 mb-8 flex items-center gap-4 tracking-[0.2em] border-b-4 border-[rgba(255,255,255,0.1)] pb-4">
                  Manual Unverified
                </h3>

                {/* As per user Team 1 rule: "Unverified Skills (White/Gray Tags, muted)" */}
                <div className="flex flex-wrap gap-3 relative z-10">
                  {profile.skills.unverified.map(skill => (
                    <span key={skill} className="px-5 py-3 bg-black border-2 border-[rgba(255,255,255,0.2)] text-gray-400 text-sm font-bold font-mono tracking-widest transition-colors cursor-default hover:border-white hover:text-white hover:-translate-y-1">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* PROJECTS SECTION */}
            <section>
              <SectionHeader title="Projects Grid" onEdit={() => { }} />

              <div className="mb-8 mt-4 relative flex justify-end">
                <button
                  onClick={connectGithub}
                  disabled={isConnectingGithub}
                  className="flex items-center gap-3 px-6 py-4 bg-black text-white border-[4px] border-[rgba(255,255,255,0.2)] hover:border-[#3b82f6] font-mono font-black uppercase transition-all shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:shadow-[6px_6px_0_0_rgba(59,130,246,0.3)] active:translate-y-1 active:shadow-none group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnectingGithub ? (
                    <RotateCcw className="w-6 h-6 animate-spin text-[#60a5fa]" />
                  ) : (
                    <Github className="w-6 h-6 text-gray-400 group-hover:text-[#60a5fa]" />
                  )}
                  {isConnectingGithub ? "Syncing Repos..." : (profile.projects.length > 0 ? "Sync GitHub" : "Connect GitHub")}
                </button>
              </div>

              <div className="space-y-8">
                {profile.projects.map((proj, i) => (
                  <div key={i} className="border-[6px] border-[rgba(255,255,255,0.1)] p-8 bg-[#0a0a0a] hover:border-[#3b82f6]/60 transition-all flex flex-col h-full shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(59,130,246,0.3)] hover:-translate-x-2 group">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="font-bold text-3xl uppercase tracking-tighter leading-none pr-4 text-white drop-shadow-sm">{proj.title}</h3>
                      <a href={proj.link} className="p-3 border-4 border-[rgba(255,255,255,0.2)] hover:border-[#60a5fa] hover:text-[#60a5fa] bg-black transition-colors shrink-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none translate-x-[4px] translate-y-[-4px] hover:translate-x-0 hover:translate-y-0">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    <p className="text-lg text-gray-400 mb-8 flex-1 leading-relaxed font-mono font-medium">{proj.summary}</p>
                    <div className="flex flex-wrap gap-3 mt-auto">
                      {proj.stack.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-black border-2 border-[#3b82f6]/50 text-xs font-mono font-black uppercase text-[#60a5fa]">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* METRICS WIDGET */}
            <section>
              <SectionHeader title="Live Metrics" />
              <div className="mt-12 border-[6px] border-[rgba(255,255,255,0.1)] bg-gradient-to-br from-[#0a0a0a] to-[#111] p-10 space-y-12 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] group hover:border-[#3b82f6]/40 transition-colors">
                <div className="border-l-[6px] border-[#2563eb] pl-8 hover:pl-10 transition-all">
                  <h4 className="text-base font-black font-mono uppercase text-gray-400 mb-3 tracking-[0.2em]">HackerRank</h4>
                  <p className="font-black text-4xl xl:text-5xl text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{profile.metrics.hackerrank}</p>
                </div>
                <div className="border-l-[6px] border-[#60a5fa] pl-8 hover:pl-10 transition-all">
                  <h4 className="text-base font-black font-mono uppercase text-gray-400 mb-3 tracking-[0.2em]">Kaggle</h4>
                  <p className="font-black text-4xl xl:text-5xl text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{profile.metrics.kaggle}</p>
                </div>
                <div className="border-l-[6px] border-[rgba(255,255,255,0.3)] pl-8 hover:pl-10 transition-all">
                  <h4 className="text-base font-black font-mono uppercase text-gray-400 mb-3 tracking-[0.2em]">GitHub Activity</h4>
                  <p className="font-black text-4xl xl:text-5xl text-white tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{profile.metrics.github_commits}</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* EDIT MODALS OVERLAYS */}
      {editingHeader && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0a0a0a] border-[6px] border-[#3b82f6] p-8 md:p-14 w-full max-w-2xl relative shadow-[20px_20px_0px_0px_rgba(37,99,235,0.4)] animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditingHeader(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-black border-4 border-[rgba(255,255,255,0.1)] p-3">
              <X className="w-8 h-8" />
            </button>
            <h2 className="text-4xl font-black uppercase mb-10 font-mono tracking-tight text-[#60a5fa] border-b-4 border-[rgba(255,255,255,0.1)] pb-6">Edit Profile Header</h2>
            <div className="space-y-8 font-mono text-sm uppercase font-bold text-gray-400">
              <div className="space-y-3">
                <label className="block pl-1 tracking-widest text-[#60a5fa]">Full Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full bg-black border-4 border-[rgba(255,255,255,0.2)] p-5 text-white focus:outline-none focus:border-[#3b82f6] transition-colors text-xl font-sans font-black" />
              </div>
              <div className="space-y-3">
                <label className="block pl-1 tracking-widest text-[#60a5fa]">Job Title</label>
                <input type="text" value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} className="w-full bg-black border-4 border-[rgba(255,255,255,0.2)] p-5 text-white focus:outline-none focus:border-[#3b82f6] transition-colors text-xl font-sans font-black" />
              </div>
              <div className="space-y-3">
                <label className="block pl-1 tracking-widest text-[#60a5fa]">Social Links (Comma separated)</label>
                <input type="text" value={profile.socials.join(", ")} onChange={(e) => setProfile({ ...profile, socials: e.target.value.split(",").map(s => s.trim()) })} className="w-full bg-black border-4 border-[rgba(255,255,255,0.2)] p-5 text-gray-300 focus:outline-none focus:border-[#3b82f6] transition-colors text-lg normal-case font-mono" placeholder="twitter.com/dev, instagr.am/dev" />
              </div>
              <button onClick={() => setEditingHeader(false)} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black uppercase p-8 mt-10 transition-colors border-[6px] border-white text-2xl tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-2 active:shadow-none">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {editingSkills && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border-[6px] border-[#3b82f6] p-8 md:p-14 w-full max-w-3xl relative shadow-[20px_20px_0px_0px_rgba(37,99,235,0.4)] animate-in slide-in-from-bottom-8 duration-300">
            <button onClick={() => setEditingSkills(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-black border-4 border-[rgba(255,255,255,0.1)] p-3">
              <X className="w-8 h-8" />
            </button>
            <h2 className="text-4xl font-black uppercase mb-6 font-mono tracking-tight text-[#60a5fa]">Manual Skills Input</h2>
            <p className="text-gray-400 text-base mb-10 font-mono leading-relaxed bg-[#111] p-6 border-l-[6px] border-[#3b82f6]">User-added skills will strictly format to the standard Unverified gray block. Only our AI matrix crawler upgrades them to Green/Verified tags.</p>

            <form onSubmit={handleAddSkill} className="flex gap-4 font-mono mb-12">
              <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="flex-1 bg-black border-4 border-[rgba(255,255,255,0.2)] p-5 text-white focus:outline-none focus:border-[#3b82f6] transition-colors text-xl" placeholder="Type a new skill (e.g., Ruby)..." />
              <button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-4 border-white px-10 font-black uppercase tracking-[0.2em] text-xl shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-1 active:shadow-none transition-all">Add</button>
            </form>

            <div className="flex flex-wrap gap-4 max-h-[400px] overflow-y-auto p-2 pr-4">
              {profile.skills.unverified.map((skill, idx) => (
                <span key={idx} className="inline-flex items-center gap-4 px-5 py-3 bg-[#111] border-2 border-[rgba(255,255,255,0.2)] text-gray-300 text-lg font-bold font-mono group">
                  {skill}
                  <button
                    onClick={() => setProfile(prev => ({ ...prev, skills: { ...prev.skills, unverified: prev.skills.unverified.filter((_, i) => i !== idx) } }))}
                    className="p-1.5 bg-black hover:bg-red-500 text-gray-500 hover:text-white border-2 border-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingKnowledge !== null && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border-[6px] border-[#3b82f6] p-8 md:p-14 w-full max-w-2xl relative shadow-[20px_20px_0px_0px_rgba(37,99,235,0.4)] animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditingKnowledge(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors bg-black border-4 border-[rgba(255,255,255,0.1)] p-3">
              <X className="w-8 h-8" />
            </button>
            <h2 className="text-4xl font-black uppercase mb-10 font-mono tracking-tight text-[#60a5fa]">Attach Proof Document</h2>
            <div className="space-y-8 font-mono text-base">
              <div className="bg-black border-[6px] border-[rgba(255,255,255,0.1)] p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-4 bg-[#2563eb]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-none blur-3xl" />
                <p className="text-[#60a5fa] font-black text-2xl mb-3 uppercase tracking-tighter pl-6">{profile.education[editingKnowledge].degree}</p>
                <p className="text-gray-400 font-bold uppercase tracking-widest pl-6">{profile.education[editingKnowledge].school}</p>
              </div>

              <label className="flex flex-col items-center justify-center p-16 border-[6px] border-dashed border-[rgba(255,255,255,0.2)] cursor-pointer hover:border-[#3b82f6] hover:bg-[#3b82f6]/5 transition-all group bg-[#111] shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleKnowledgeImageUpload(e, editingKnowledge)} />
                <ImageIcon className="w-16 h-16 mb-8 text-gray-500 group-hover:text-[#60a5fa] transition-colors" />
                <span className="text-gray-400 group-hover:text-white text-center font-black uppercase tracking-[0.15em] text-lg px-8">Upload an image of the certificate or proof</span>
              </label>

              {profile.education[editingKnowledge].image && (
                <div className="mt-10 p-6 border-[6px] border-[rgba(255,255,255,0.1)] bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                  <span className="block text-[#60a5fa] font-black uppercase tracking-[0.2em] mb-6">Preview Attached Proof</span>
                  <img src={profile.education[editingKnowledge].image} alt="Preview" className="w-full h-auto grayscale border-4 border-white/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
