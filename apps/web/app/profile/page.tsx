'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  ExternalLink,
  Pen,
  Download,
  RotateCcw,
  Image as ImageIcon,
  GitBranch,
  Plus,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type ExperienceItem = {
  role: string
  company: string
  period: string
  desc: string
  location?: string
}

type EducationItem = {
  degree: string
  school: string
  years: string
  desc?: string
  image?: string
}

type ProjectItem = {
  title: string
  summary: string
  stack: string[]
  link: string
}

type ProfileState = {
  name: string
  email: string
  title: string
  summary: string
  location: string
  phone: string
  linkedin: string
  github: string
  profileImage: string
  skills: string[]
  metrics: { hackerrank: string; kaggle: string; github_commits: string }
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
}

/** No placeholder CV — merged with server `cv_data` when present */
const EMPTY_PROFILE: ProfileState = {
  name: '',
  email: '',
  title: '',
  summary: '',
  location: '',
  phone: '',
  linkedin: '',
  github: '',
  profileImage: '',
  skills: [],
  metrics: { hackerrank: '', kaggle: '', github_commits: '' },
  experience: [],
  education: [],
  projects: [],
}

function normalizeSkillsField(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(String).map((s) => s.trim()).filter(Boolean))]
  }
  if (raw && typeof raw === 'object') {
    const o = raw as { verified?: unknown[]; unverified?: unknown[] }
    const a = [
      ...(Array.isArray(o.verified) ? o.verified : []),
      ...(Array.isArray(o.unverified) ? o.unverified : []),
    ]
    return [...new Set(a.map(String).map((s) => s.trim()).filter(Boolean))]
  }
  return []
}

function normalizeExperience(raw: unknown): ExperienceItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((e: any) => ({
    role: String(e.role ?? ''),
    company: String(e.company ?? ''),
    period: String(e.period ?? e.years ?? ''),
    desc: String(e.desc ?? ''),
    location: e.location ? String(e.location) : '',
  }))
}

function normalizeEducation(raw: unknown): EducationItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((e: any) => ({
    degree: String(e.degree ?? ''),
    school: String(e.school ?? ''),
    years: String(e.years ?? ''),
    desc: e.desc ? String(e.desc) : undefined,
    image: e.image ? String(e.image) : undefined,
  }))
}

function normalizeProjects(raw: unknown): ProjectItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p: any) => ({
    title: String(p.title ?? ''),
    summary: String(p.summary ?? ''),
    stack: Array.isArray(p.stack) ? p.stack.map(String) : [],
    link: String(p.link ?? '#'),
  }))
}

function mergeCvIntoProfile(cv: Record<string, any>, base: ProfileState): ProfileState {
  let linkedin = base.linkedin
  let github = base.github
  if (typeof cv.linkedin === 'string') {
    linkedin = cv.linkedin.replace(/^https?:\/\//, '')
  }
  if (typeof cv.github === 'string') {
    github = cv.github.replace(/^https?:\/\//, '')
  }
  if (Array.isArray(cv.socials)) {
    for (const s of cv.socials as string[]) {
      const u = String(s).replace(/^https?:\/\//, '')
      if (u.toLowerCase().includes('linkedin')) linkedin = u
      if (u.toLowerCase().includes('github')) github = u
    }
  }

  return {
    ...base,
    name: cv.name ?? base.name,
    email: cv.email ?? base.email,
    title: cv.title ?? base.title,
    summary: cv.summary ?? base.summary ?? '',
    location: cv.location ?? base.location ?? '',
    phone: cv.phone ?? base.phone ?? '',
    linkedin,
    github,
    skills: cv.skills != null ? normalizeSkillsField(cv.skills) : base.skills,
    experience:
      Array.isArray(cv.experience) && cv.experience.length > 0
        ? normalizeExperience(cv.experience)
        : base.experience,
    education:
      Array.isArray(cv.education) && cv.education.length > 0
        ? normalizeEducation(cv.education)
        : base.education,
    projects:
      Array.isArray(cv.projects) && cv.projects.length > 0
        ? normalizeProjects(cv.projects)
        : base.projects,
    metrics: cv.metrics
      ? {
          hackerrank: String((cv.metrics as any).hackerrank ?? ''),
          kaggle: String((cv.metrics as any).kaggle ?? ''),
          github_commits: String((cv.metrics as any).github_commits ?? ''),
        }
      : base.metrics,
  }
}

function profileToCvData(p: ProfileState): Record<string, unknown> {
  return {
    name: p.name,
    email: p.email,
    title: p.title,
    summary: p.summary,
    location: p.location,
    phone: p.phone,
    linkedin: p.linkedin,
    github: p.github,
    skills: p.skills.filter(Boolean),
    experience: p.experience.map((e) => ({
      role: e.role,
      company: e.company,
      period: e.period,
      desc: e.desc,
      location: e.location ?? '',
    })),
    education: p.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      years: e.years,
      desc: e.desc ?? '',
    })),
    projects: p.projects,
    metrics: p.metrics,
  }
}

type EditSection =
  | null
  | 'header'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'metrics'

export default function ProfileDashboard() {
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE)
  const [editing, setEditing] = useState<EditSection>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [refreshCooldown, setRefreshCooldown] = useState(false)
  const [isConnectingGithub, setIsConnectingGithub] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const persistProfile = useCallback(async (next: ProfileState) => {
    try {
      setSaveState('saving')
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setSaveState('idle')
        return
      }
      const { error } = await supabase
        .from('developers')
        .upsert({ id: session.user.id, cv_data: profileToCvData(next) })
      if (error) throw error
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (e) {
      console.error(e)
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [])

  const saveAndClose = (section: EditSection, next: ProfileState) => {
    setProfile(next)
    setEditing((e) => (e === section ? null : e))
    void persistProfile(next)
  }

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const { data: devData } = await supabase
            .from('developers')
            .select('cv_data')
            .eq('id', session.user.id)
            .single()

          if (devData?.cv_data) {
            const cv = devData.cv_data as Record<string, any>
            setProfile(mergeCvIntoProfile(cv, EMPTY_PROFILE))
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
            }),
          ])

          const repos = await reposRes.json()
          const userData = await userRes.json()

          setProfile((prev) => {
            const updated: ProfileState = { ...prev }

            if (Array.isArray(repos) && repos.length > 0) {
              updated.projects = repos.map((repo: any) => ({
                title: repo.name,
                summary: repo.description || 'No description provided.',
                stack: repo.language ? [repo.language] : [],
                link: repo.html_url,
              }))
            }

            if (userData?.login) {
              updated.github = `github.com/${userData.login}`
            }

            if (userData?.public_repos !== undefined) {
              updated.metrics = {
                ...updated.metrics,
                github_commits: `${userData.public_repos} Repos`,
              }
            }

            void persistProfile(updated)
            return updated
          })
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsConnectingGithub(false)
        const searchParams = new URLSearchParams(window.location.search)
        if (searchParams.get('github') === 'true') {
          window.history.replaceState({}, '', '/profile')
        }
      }
    }

    loadProfileData()
  }, [persistProfile])

  const connectGithub = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user repo',
        redirectTo: `${window.location.origin}/auth/callback?next=/profile?github=true`,
      },
    })
  }

  const triggerRefresh = () => {
    setRefreshCooldown(true)
    setTimeout(() => setRefreshCooldown(false), 3000)
  }

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setProfile((prev) => ({ ...prev, profileImage: url }))
    }
  }

  const contactLine = [profile.location, profile.email, profile.phone, profile.linkedin, profile.github]
    .filter((s) => s && String(s).trim())
    .join('  |  ')

  const hasMetrics =
    profile.metrics.hackerrank.trim() ||
    profile.metrics.kaggle.trim() ||
    profile.metrics.github_commits.trim()

  const expBullets = (desc: string) =>
    desc
      .split(/\n+/)
      .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean)

  const SectionLabel = ({
    id,
    children,
  }: {
    id: EditSection
    children: React.ReactNode
  }) => (
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-black pb-1">
      <h2 className="text-sm font-bold uppercase tracking-[0.12em]">{children}</h2>
      <button
        type="button"
        onClick={() => setEditing((e) => (e === id ? null : id))}
        className="shrink-0 rounded border border-neutral-300 p-1.5 text-neutral-600 hover:border-black hover:text-black"
        aria-label={`Edit ${String(id)}`}
      >
        <Pen className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white text-black antialiased">
      <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center border border-black text-sm font-bold">T</span>
            <span className="uppercase tracking-widest">TECHub</span>
          </Link>
          <div className="flex items-center gap-3">
            {saveState === 'saving' && <span className="text-xs text-neutral-500">Saving…</span>}
            {saveState === 'saved' && (
              <span className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Saved
              </span>
            )}
            {saveState === 'error' && <span className="text-xs text-red-600">Save failed</span>}
            <button
              type="button"
              onClick={() => void persistProfile(profile)}
              className="text-xs font-medium uppercase tracking-wide text-neutral-600 hover:text-black"
            >
              Save
            </button>
            <button
              type="button"
              onClick={triggerRefresh}
              disabled={refreshCooldown}
              className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-black disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${refreshCooldown ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/opportunities" className="text-xs font-semibold uppercase tracking-wide hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12 pb-24">
        {/* Header — centered ATS style */}
        <header className="relative mb-12 text-center z-10">
          <button
            type="button"
            onClick={() => setEditing((e) => (e === 'header' ? null : 'header'))}
            className="absolute right-0 top-0 rounded border border-neutral-300 p-1.5 text-neutral-600 hover:border-black"
            aria-label="Edit header"
          >
            <Pen className="h-3.5 w-3.5" />
          </button>

          <label className="mx-auto mb-6 flex h-28 w-24 cursor-pointer items-center justify-center border border-dashed border-neutral-400 bg-neutral-50 text-xs text-neutral-500 hover:border-black">
            <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center">Photo</span>
            )}
          </label>

          {editing === 'header' ? (
            <HeaderEditor
              profile={profile}
              onCancel={() => setEditing(null)}
              onSave={(p) => saveAndClose('header', p)}
            />
          ) : (
            <>
              <h1 className="text-2xl font-bold uppercase tracking-[0.08em] md:text-3xl">{profile.name}</h1>
              <p className="mt-2 text-center text-sm font-semibold leading-snug text-neutral-800 md:text-base">
                {profile.title}
              </p>
              <p className="mt-4 text-center text-xs leading-relaxed text-neutral-600 md:text-sm">{contactLine}</p>
            </>
          )}

          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex flex-col items-center gap-1 text-xs text-neutral-600 hover:text-black"
            >
              <Download className="h-5 w-5" />
              <span className="font-medium uppercase tracking-wide">Export ATS CV</span>
            </button>
            {dropdownOpen && (
              <div className="absolute z-20 mt-24 w-56 border border-black bg-white shadow-lg">
                <div className="border-b border-neutral-200 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Proven export
                </div>
                <button type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-neutral-100">
                  PDF
                </button>
                <button type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-neutral-100">
                  DOCX
                </button>
                <button type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-neutral-100">
                  JSON
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Summary */}
        <section className="mb-10">
          <SectionLabel id="summary">Summary</SectionLabel>
          {editing === 'summary' ? (
            <SummaryEditor
              value={profile.summary}
              onCancel={() => setEditing(null)}
              onSave={(summary) => saveAndClose('summary', { ...profile, summary })}
            />
          ) : profile.summary.trim() ? (
            <p className="text-sm leading-relaxed text-neutral-800 text-left">{profile.summary}</p>
          ) : (
            <p className="text-sm text-neutral-400">Add a summary with the edit control above.</p>
          )}
        </section>

        {/* Skills */}
        <section className="mb-10">
          <SectionLabel id="skills">Skills</SectionLabel>
          {editing === 'skills' ? (
            <SkillsEditor
              skills={profile.skills}
              onCancel={() => setEditing(null)}
              onSave={(skills) => saveAndClose('skills', { ...profile, skills })}
            />
          ) : profile.skills.length > 0 ? (
            <p className="text-sm leading-relaxed">{profile.skills.join(', ')}</p>
          ) : (
            <p className="text-sm text-neutral-400">No skills yet. Click edit to add.</p>
          )}
        </section>

        {/* Experience */}
        <section className="mb-10">
            <SectionLabel id="experience">Experience</SectionLabel>
            {editing === 'experience' ? (
              <ExperienceEditor
                items={profile.experience}
                onCancel={() => setEditing(null)}
                onSave={(experience) => saveAndClose('experience', { ...profile, experience })}
              />
            ) : profile.experience.length > 0 ? (
              <div className="space-y-8">
                {profile.experience.map((exp, i) => (
                  <article key={i}>
                    <h3 className="text-sm font-bold">{exp.role}</h3>
                    <p className="mt-1 text-sm italic text-neutral-700">
                      {[exp.company, exp.location, exp.period].filter(Boolean).join('  |  ')}
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-800">
                      {expBullets(exp.desc).map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No work history. Click edit to add roles.</p>
            )}
        </section>

        {/* Projects */}
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-black pb-1">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Projects</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={connectGithub}
                disabled={isConnectingGithub}
                className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 hover:border-black disabled:opacity-50"
              >
                {isConnectingGithub ? (
                  <RotateCcw className="h-3 w-3 animate-spin" />
                ) : (
                  <GitBranch className="h-3 w-3" />
                )}
                GitHub
              </button>
              <button
                type="button"
                onClick={() => setEditing((e) => (e === 'projects' ? null : 'projects'))}
                className="rounded border border-neutral-300 p-1.5 text-neutral-600 hover:border-black"
              >
                <Pen className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {editing === 'projects' ? (
            <ProjectsEditor
              items={profile.projects}
              onCancel={() => setEditing(null)}
              onSave={(projects) => saveAndClose('projects', { ...profile, projects })}
            />
          ) : profile.projects.length > 0 ? (
            <div className="space-y-8">
              {profile.projects.map((proj, i) => (
                <article key={i}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-bold">{proj.title}</h3>
                    {proj.link && proj.link !== '#' && (
                      <a
                        href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-neutral-500 hover:text-black"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-800">{proj.summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No projects. Connect GitHub or click edit.</p>
          )}
        </section>

        {/* Education */}
        <section className="mb-10">
          <SectionLabel id="education">Education</SectionLabel>
          {editing === 'education' ? (
            <EducationEditor
              items={profile.education}
              onCancel={() => setEditing(null)}
              onSave={(education) => saveAndClose('education', { ...profile, education })}
            />
          ) : profile.education.length > 0 ? (
            <div className="space-y-8">
              {profile.education.map((edu, i) => (
                <article key={i}>
                  <h3 className="text-sm font-bold">{edu.degree}</h3>
                  <p className="mt-1 text-sm italic text-neutral-700">
                    {[edu.school, edu.years].filter(Boolean).join('  |  ')}
                  </p>
                  {edu.desc && <p className="mt-2 text-sm text-neutral-800">{edu.desc}</p>}
                  {edu.image && (
                    <img src={edu.image} alt="" className="mt-4 max-h-48 border border-neutral-200 object-contain" />
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No education entries. Click edit to add.</p>
          )}
        </section>

        {/* Metrics — optional ATS footer */}
        <section className="mb-10">
          <SectionLabel id="metrics">Highlights</SectionLabel>
          {editing === 'metrics' ? (
            <MetricsEditor
              metrics={profile.metrics}
              onCancel={() => setEditing(null)}
              onSave={(metrics) => saveAndClose('metrics', { ...profile, metrics })}
            />
          ) : hasMetrics ? (
            <div className="space-y-4 text-sm">
              {profile.metrics.hackerrank.trim() ? (
                <p>
                  <span className="font-bold">HackerRank: </span>
                  {profile.metrics.hackerrank}
                </p>
              ) : null}
              {profile.metrics.kaggle.trim() ? (
                <p>
                  <span className="font-bold">Kaggle: </span>
                  {profile.metrics.kaggle}
                </p>
              ) : null}
              {profile.metrics.github_commits.trim() ? (
                <p>
                  <span className="font-bold">GitHub: </span>
                  {profile.metrics.github_commits}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No highlights. Click edit to add optional metrics.</p>
          )}
        </section>
      </main>
    </div>
  )
}

function HeaderEditor({
  profile,
  onCancel,
  onSave,
}: {
  profile: ProfileState
  onCancel: () => void
  onSave: (p: ProfileState) => void
}) {
  const [draft, setDraft] = useState(profile)
  return (
    <div className="mx-auto max-w-lg space-y-3 text-left">
      {(['name', 'title', 'email', 'location', 'phone', 'linkedin', 'github'] as const).map((field) => (
        <div key={field}>
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{field}</label>
          <input
            className="mt-0.5 w-full border border-neutral-300 px-2 py-1.5 text-sm focus:border-black focus:outline-none"
            value={draft[field]}
            onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          onClick={() => onSave(draft)}
        >
          Save
        </button>
        <button type="button" className="px-4 py-2 text-xs text-neutral-600 hover:text-black" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function SummaryEditor({
  value,
  onCancel,
  onSave,
}: {
  value: string
  onCancel: () => void
  onSave: (s: string) => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <div>
      <textarea
        className="min-h-[140px] w-full border border-neutral-300 p-3 text-sm focus:border-black focus:outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
          onClick={() => onSave(draft)}
        >
          Save
        </button>
        <button type="button" className="text-xs text-neutral-600" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function SkillsEditor({
  skills,
  onCancel,
  onSave,
}: {
  skills: string[]
  onCancel: () => void
  onSave: (skills: string[]) => void
}) {
  const [str, setStr] = useState(skills.join(', '))
  return (
    <div className="space-y-3 text-sm">
      <div>
        <label className="text-[10px] font-bold uppercase text-neutral-500">Skills (comma-separated)</label>
        <input
          className="mt-1 w-full border border-neutral-300 px-2 py-1.5 focus:border-black focus:outline-none"
          value={str}
          onChange={(e) => setStr(e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
          onClick={() =>
            onSave(
              str
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        >
          Save
        </button>
        <button type="button" className="text-xs text-neutral-600" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function ExperienceEditor({
  items,
  onCancel,
  onSave,
}: {
  items: ExperienceItem[]
  onCancel: () => void
  onSave: (items: ExperienceItem[]) => void
}) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(items)) as ExperienceItem[])
  const update = (i: number, patch: Partial<ExperienceItem>) => {
    setDraft((d) => d.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  return (
    <div className="space-y-6 border border-neutral-200 p-4">
      {draft.map((row, i) => (
        <div key={i} className="space-y-2 border-b border-neutral-100 pb-4 last:border-0">
          <input
            placeholder="Role"
            className="w-full border border-neutral-300 px-2 py-1 text-sm font-semibold focus:border-black focus:outline-none"
            value={row.role}
            onChange={(e) => update(i, { role: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              placeholder="Company"
              className="border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
              value={row.company}
              onChange={(e) => update(i, { company: e.target.value })}
            />
            <input
              placeholder="Location"
              className="border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
              value={row.location ?? ''}
              onChange={(e) => update(i, { location: e.target.value })}
            />
            <input
              placeholder="Dates"
              className="border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
              value={row.period}
              onChange={(e) => update(i, { period: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Bullets (one per line, optional • prefix)"
            className="min-h-[80px] w-full border border-neutral-300 p-2 text-xs focus:border-black focus:outline-none"
            value={row.desc}
            onChange={(e) => update(i, { desc: e.target.value })}
          />
          <button
            type="button"
            className="text-xs text-red-600 hover:underline"
            onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
          >
            Remove role
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-1 text-xs font-semibold uppercase text-neutral-700 hover:text-black"
        onClick={() =>
          setDraft((d) => [...d, { role: '', company: '', period: '', desc: '', location: '' }])
        }
      >
        <Plus className="h-3 w-3" /> Add role
      </button>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
          onClick={() => onSave(draft)}
        >
          Save
        </button>
        <button type="button" className="text-xs text-neutral-600" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function EducationEditor({
  items,
  onCancel,
  onSave,
}: {
  items: EducationItem[]
  onCancel: () => void
  onSave: (items: EducationItem[]) => void
}) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(items)) as EducationItem[])
  const update = (i: number, patch: Partial<EducationItem>) => {
    setDraft((d) => d.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  const uploadImage = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) update(i, { image: URL.createObjectURL(file) })
  }
  return (
    <div className="space-y-6 border border-neutral-200 p-4">
      {draft.map((row, i) => (
        <div key={i} className="space-y-2 border-b border-neutral-100 pb-4 last:border-0">
          <input
            placeholder="Degree"
            className="w-full border border-neutral-300 px-2 py-1 text-sm font-semibold focus:border-black focus:outline-none"
            value={row.degree}
            onChange={(e) => update(i, { degree: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              placeholder="School"
              className="border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
              value={row.school}
              onChange={(e) => update(i, { school: e.target.value })}
            />
            <input
              placeholder="Years"
              className="border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
              value={row.years}
              onChange={(e) => update(i, { years: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Notes / honors (optional)"
            className="min-h-[50px] w-full border border-neutral-300 p-2 text-xs focus:border-black focus:outline-none"
            value={row.desc ?? ''}
            onChange={(e) => update(i, { desc: e.target.value })}
          />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-600 hover:text-black">
            <ImageIcon className="h-4 w-4" />
            Certificate image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(i, e)} />
          </label>
          {row.image && <img src={row.image} alt="" className="max-h-32 border object-contain" />}
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-1 text-xs font-semibold uppercase"
        onClick={() => setDraft((d) => [...d, { degree: '', school: '', years: '' }])}
      >
        <Plus className="h-3 w-3" /> Add education
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
          onClick={() => onSave(draft)}
        >
          Save
        </button>
        <button type="button" className="text-xs text-neutral-600" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function ProjectsEditor({
  items,
  onCancel,
  onSave,
}: {
  items: ProjectItem[]
  onCancel: () => void
  onSave: (items: ProjectItem[]) => void
}) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(items)) as ProjectItem[])
  const update = (i: number, patch: Partial<ProjectItem>) => {
    setDraft((d) => d.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  return (
    <div className="space-y-6 border border-neutral-200 p-4">
      {draft.map((row, i) => (
        <div key={i} className="space-y-2 border-b border-neutral-100 pb-4 last:border-0">
          <input
            placeholder="Title"
            className="w-full border border-neutral-300 px-2 py-1 text-sm font-semibold focus:border-black focus:outline-none"
            value={row.title}
            onChange={(e) => update(i, { title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="min-h-[60px] w-full border border-neutral-300 p-2 text-xs focus:border-black focus:outline-none"
            value={row.summary}
            onChange={(e) => update(i, { summary: e.target.value })}
          />
          <input
            placeholder="Stack (comma-separated)"
            className="w-full border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
            value={row.stack.join(', ')}
            onChange={(e) =>
              update(i, {
                stack: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <input
            placeholder="URL"
            className="w-full border border-neutral-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
            value={row.link}
            onChange={(e) => update(i, { link: e.target.value })}
          />
          <button type="button" className="text-xs text-red-600" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}>
            <Trash2 className="mr-1 inline h-3 w-3" />
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-1 text-xs font-semibold uppercase"
        onClick={() => setDraft((d) => [...d, { title: '', summary: '', stack: [], link: '#' }])}
      >
        <Plus className="h-3 w-3" /> Add project
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
          onClick={() => onSave(draft)}
        >
          Save
        </button>
        <button type="button" className="text-xs text-neutral-600" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function MetricsEditor({
  metrics,
  onCancel,
  onSave,
}: {
  metrics: ProfileState['metrics']
  onCancel: () => void
  onSave: (m: ProfileState['metrics']) => void
}) {
  const [draft, setDraft] = useState(metrics)
  return (
    <div className="space-y-2 text-sm">
      {(['hackerrank', 'kaggle', 'github_commits'] as const).map((k) => (
        <div key={k}>
          <label className="text-[10px] font-bold uppercase text-neutral-500">{k.replace(/_/g, ' ')}</label>
          <input
            className="mt-0.5 w-full border border-neutral-300 px-2 py-1 focus:border-black focus:outline-none"
            value={draft[k]}
            onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
          onClick={() => onSave(draft)}
        >
          Save
        </button>
        <button type="button" className="text-xs text-neutral-600" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
