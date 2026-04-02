/**
 * LinkedIn "Save to PDF" exports lead with Contact / Top Skills / Certifications;
 * the profile name and headline appear after that.
 */

export type LinkedInCvShape = {
  name: string
  email: string
  phone: string
  /** e.g. linkedin.com/in/handle — no https */
  linkedin: string
  location: string
  title: string
  summary: string
  experience: { role: string; company: string; period: string; desc: string; location?: string }[]
  education: { school: string; degree: string; years: string; desc: string }[]
  /** Only skills explicitly listed in the PDF (Top Skills + headline), no global keyword guessing */
  skills: string[]
}

const SECTION_HEADER =
  /^(contact|top skills|skills|certifications|summary|education|experience|projects|volunteer|languages|interests|honors|publications|patents|recommendations|courses|test scores|organizations)\s*$/i

const PAGE_FOOTER = /^--\s*\d+\s+of\s+\d+\s*--$/i

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^page\s+\d+/i.test(l) && !PAGE_FOOTER.test(l))
}

function looksLikePersonNameLine(line: string): boolean {
  if (line.length < 4 || line.length > 85) return false
  if (/[\d•|]/.test(line)) return false
  if (/@|linkedin\.com|http/i.test(line)) return false
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 5) return false
  const noisy = /^(aspiring|software|engineering|engineer|student|developer|full|stack|front|end|senior|junior|lead|intern|mba|phd|dr|mr|ms|mrs)$/i
  for (const w of words) {
    if (noisy.test(w)) return false
    if (!/^[\p{L}][\p{L}'.-]*$/u.test(w)) return false
  }
  return true
}

/** Name + multi-line headline + location (e.g. Riyadh, …) */
function findProfileHeader(lines: string[]): {
  name: string
  title: string
  location: string
  startIdx: number
} {
  for (let i = 0; i < lines.length - 1; i++) {
    const next = lines[i + 1]
    if (!looksLikePersonNameLine(lines[i])) continue
    if (!(next.includes('|') || next.includes('•'))) continue

    const name = lines[i]
    let title = next
    let j = i + 2
    while (j < lines.length) {
      const l = lines[j]
      if (
        /^summary$|^education$|^top skills$|^contact$|^certifications$/i.test(l)
      ) {
        break
      }
      if (l.includes('•') || l.includes('|')) {
        title += ' ' + l
        j++
        continue
      }
      if (/,/.test(l) && l.length < 120 && !/@/.test(l) && !l.toLowerCase().includes('linkedin')) {
        return {
          name,
          title: title.replace(/\s+/g, ' ').trim(),
          location: l.trim(),
          startIdx: i,
        }
      }
      break
    }
    return {
      name,
      title: title.replace(/\s+/g, ' ').trim(),
      location: '',
      startIdx: i,
    }
  }
  return { name: '', title: '', location: '', startIdx: -1 }
}

function sectionStart(lines: string[], label: RegExp): number {
  return lines.findIndex((l) => label.test(l))
}

function sliceUntilSection(lines: string[], from: number, stopRegex: RegExp): string[] {
  const out: string[] = []
  for (let i = from; i < lines.length; i++) {
    const l = lines[i]
    if (stopRegex.test(l)) break
    if (SECTION_HEADER.test(l)) break
    out.push(l)
  }
  return out
}

function extractTopSkills(lines: string[]): string[] {
  const idx = sectionStart(lines, /^top skills$/i)
  if (idx === -1) return []
  const chunk = sliceUntilSection(lines, idx + 1, /^certifications$/i)
  return chunk.map((s) => s.trim()).filter(Boolean)
}

function extractSummary(lines: string[]): string {
  const idx = sectionStart(lines, /^summary$/i)
  if (idx === -1) return ''
  const chunk = sliceUntilSection(lines, idx + 1, /^education$/i)
  return chunk.join(' ').replace(/\s+/g, ' ').trim()
}

function extractEducation(lines: string[]): LinkedInCvShape['education'] {
  const idx = sectionStart(lines, /^education$/i)
  if (idx === -1) return []

  let i = idx + 1
  const entries: LinkedInCvShape['education'] = []

  while (i < lines.length) {
    const l = lines[i]
    if (/^experience$/i.test(l)) break
    if (SECTION_HEADER.test(l)) break

    const school = l
    i++
    const degreeParts: string[] = []
    while (i < lines.length) {
      const x = lines[i]
      if (/^experience$/i.test(x)) break
      if (SECTION_HEADER.test(x)) break
      degreeParts.push(x)
      i++
      if (/\)\s*$/.test(x)) break
    }
    const blob = degreeParts.join(' ').replace(/\s+/g, ' ').trim()
    const m = blob.match(/^(.+?)\s*·\s*\(([^)]+)\)\s*$/)
    if (m) {
      entries.push({
        school,
        degree: m[1].trim(),
        years: m[2].replace(/\s+/g, ' ').trim(),
        desc: '',
      })
    } else if (blob) {
      entries.push({ school, degree: blob, years: '', desc: '' })
    } else {
      entries.push({ school, degree: '', years: '', desc: '' })
    }
    if (entries.length >= 6) break
  }

  return entries
}

/** Phone & LinkedIn from Contact section (handles line-wrapped URLs). */
function extractContactFields(lines: string[]): { phone: string; linkedin: string } {
  const idx = sectionStart(lines, /^contact$/i)
  if (idx === -1) return { phone: '', linkedin: '' }

  const raw: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i]
    if (SECTION_HEADER.test(l)) break
    raw.push(l)
  }

  let phone = ''
  for (const line of raw) {
    const m = line.match(/(\+?\d[\d\s().-]{8,})\s*(?:\(Mobile\))?/i)
    if (m) {
      phone = m[1].replace(/\s+/g, ' ').trim()
      break
    }
  }

  let linkedin = ''
  const collapsed = raw.join('').replace(/\s+/g, '')
  const li = collapsed.match(/linkedin\.com\/in\/([\w-]+)/i)
  if (li) {
    linkedin = `linkedin.com/in/${li[1]}`
  }

  return { phone, linkedin }
}

/** Tech tokens only if they appear as whole words in the headline (order: longer patterns first). */
const HEADLINE_SKILL_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bjavascript\b/i, label: 'JavaScript' },
  { re: /\btypescript\b/i, label: 'TypeScript' },
  { re: /\bpython\b/i, label: 'Python' },
  { re: /\breact\b/i, label: 'React' },
  { re: /\bflutter\b/i, label: 'Flutter' },
  { re: /\bnode\.js\b/i, label: 'Node.js' },
  { re: /\bjava\b/i, label: 'Java' },
  { re: /\bgo\b/i, label: 'Go' },
  { re: /\brust\b/i, label: 'Rust' },
  { re: /\bkotlin\b/i, label: 'Kotlin' },
  { re: /\bswift\b/i, label: 'Swift' },
  { re: /\bhtml\b/i, label: 'HTML' },
  { re: /\bcss\b/i, label: 'CSS' },
  { re: /\bsql\b/i, label: 'SQL' },
]

function headlineSkills(title: string): string[] {
  const out: string[] = []
  for (const { re, label } of HEADLINE_SKILL_PATTERNS) {
    if (re.test(title)) out.push(label)
  }
  return out
}

/** Conservative tech list: only languages/tools that appear as whole words in the PDF text. */
export function extractMentionedTechSkills(fullText: string): string[] {
  const out: string[] = []
  for (const { re, label } of HEADLINE_SKILL_PATTERNS) {
    if (re.test(fullText)) out.push(label)
  }
  return [...new Set(out)]
}

function mergeSkillLists(sectionSkills: string[], fromHeadline: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of [...sectionSkills, ...fromHeadline]) {
    const t = s.trim()
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

export function reorderLinkedInExportForModel(text: string): string {
  const lines = normalizeLines(text)
  const { name, title, startIdx } = findProfileHeader(lines)
  if (!name || startIdx <= 0) return text.trim()

  const headerBlock = [name, title, ...lines.slice(startIdx + 2, startIdx + 5)].filter(Boolean)
  const before = lines.slice(0, startIdx).join('\n')
  const after = lines.slice(startIdx + 2).join('\n')
  return [...headerBlock, '', '—', '', before, after].join('\n').trim()
}

export function parseLinkedInExportPdfText(fullText: string): LinkedInCvShape {
  const normalized = fullText.replace(/\r\n/g, '\n').trim()
  const emailMatch = normalized.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)
  const email = emailMatch?.[0] ?? ''

  const lines = normalizeLines(fullText)
  const { name, title, location: locFromHeader } = findProfileHeader(lines)
  const { phone, linkedin } = extractContactFields(lines)

  const topSkills = extractTopSkills(lines)
  const summary = extractSummary(lines)
  const education = extractEducation(lines)
  const hlSkills = headlineSkills(title)
  const skills = mergeSkillLists(topSkills, hlSkills)

  return {
    name,
    email,
    phone,
    linkedin,
    location: locFromHeader,
    title,
    summary,
    experience: [],
    education,
    skills,
  }
}

export function shouldPreferLinkedInStructure(
  aligned: LinkedInCvShape,
  ai: LinkedInCvShape,
): boolean {
  const badName =
    !ai.name ||
    /^(contact|summary|education|experience|top skills|certifications)\s*$/i.test(ai.name)
  const badTitle =
    !ai.title ||
    /\(mobile\)|^\d[\d\s().-]{8,}$/.test(ai.title) ||
    /^www\.linkedin/i.test(ai.title)
  const weakEducation = !ai.education?.length && aligned.education.length > 0
  const weakSummary =
    (!ai.summary || ai.summary.length < 40 || /^contact\s+\d/i.test(ai.summary)) &&
    aligned.summary.length > 40
  const weakContact =
    (!ai.linkedin && aligned.linkedin) ||
    (!ai.phone && aligned.phone) ||
    (!ai.location && aligned.location)

  return Boolean(
    aligned.name &&
      (badName ||
        badTitle ||
        weakEducation ||
        weakSummary ||
        !ai.education?.length ||
        weakContact),
  )
}

function migrateSkills(sk: unknown): string[] {
  if (Array.isArray(sk)) return sk.map(String).map((s) => s.trim()).filter(Boolean)
  if (sk && typeof sk === 'object') {
    const o = sk as { verified?: unknown[]; unverified?: unknown[] }
    const a = [...(Array.isArray(o.verified) ? o.verified : []), ...(Array.isArray(o.unverified) ? o.unverified : [])]
    return [...new Set(a.map(String).map((s) => s.trim()).filter(Boolean))]
  }
  return []
}

function jsonStr(v: unknown): string {
  if (v == null || v === 'null') return ''
  return String(v).trim()
}

export function normalizeParsedCvJson(raw: Record<string, unknown>): LinkedInCvShape {
  const expRaw = Array.isArray(raw.experience) ? raw.experience : []
  const experience = expRaw
    .map((e: any) => ({
      role: jsonStr(e?.role),
      company: jsonStr(e?.company),
      period: jsonStr(e?.period ?? e?.years),
      desc: jsonStr(e?.desc),
      location: jsonStr(e?.location),
    }))
    .filter((e) => e.role || e.company || e.desc)

  const eduRaw = Array.isArray(raw.education) ? raw.education : []
  const education = eduRaw
    .map((e: any) => ({
      school: jsonStr(e?.school),
      degree: jsonStr(e?.degree),
      years: jsonStr(e?.years),
      desc: jsonStr(e?.desc),
    }))
    .filter((e) => e.school || e.degree)

  return {
    name: jsonStr(raw.name),
    email: jsonStr(raw.email),
    phone: jsonStr(raw.phone),
    linkedin: jsonStr(raw.linkedin)
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, ''),
    location: jsonStr(raw.location),
    title: jsonStr(raw.title),
    summary: jsonStr(raw.summary),
    experience,
    education,
    skills: migrateSkills(raw.skills),
  }
}

export function mergeLinkedInHeuristicWithAi(
  aligned: LinkedInCvShape,
  aiRaw: Record<string, unknown> | LinkedInCvShape,
): LinkedInCvShape {
  const ai = normalizeParsedCvJson(aiRaw as Record<string, unknown>)
  const use = shouldPreferLinkedInStructure(aligned, ai)
  if (!use) {
    return {
      ...ai,
      linkedin: ai.linkedin || aligned.linkedin,
      phone: ai.phone || aligned.phone,
      location: ai.location || aligned.location,
      skills: ai.skills.length ? ai.skills : aligned.skills,
    }
  }

  return {
    name: aligned.name || ai.name,
    email: ai.email || aligned.email,
    phone: aligned.phone || ai.phone,
    linkedin: aligned.linkedin || ai.linkedin,
    location: aligned.location || ai.location,
    title: aligned.title || ai.title,
    summary:
      aligned.summary.length >= 40 && (!ai.summary || ai.summary.length < 40 || /^contact\s/i.test(ai.summary))
        ? aligned.summary
        : ai.summary || aligned.summary,
    experience: ai.experience.length ? ai.experience : aligned.experience,
    education: aligned.education.length ? aligned.education : ai.education,
    skills: aligned.skills.length ? aligned.skills : ai.skills,
  }
}
