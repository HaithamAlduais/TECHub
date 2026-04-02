import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { ApiError, GoogleGenAI } from '@google/genai'
import {
  extractMentionedTechSkills,
  mergeLinkedInHeuristicWithAi,
  normalizeParsedCvJson,
  parseLinkedInExportPdfText,
  reorderLinkedInExportForModel,
  type LinkedInCvShape,
} from '@/lib/linkedin-export-pdf-text'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
const MAX_CV_TEXT_FOR_MODEL = Math.min(
  Math.max(2_000, Number(process.env.GEMINI_MAX_CV_CHARS) || 10_000),
  32_000,
)

type CvData = LinkedInCvShape

function heuristicCvData(fullText: string): CvData {
  const normalized = fullText.replace(/\r\n/g, '\n').trim()
  const emailMatch = normalized.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)
  const email = emailMatch?.[0] ?? ''

  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^page\s+\d+/i.test(l))

  let name = ''
  let title = ''
  for (const line of lines.slice(0, 25)) {
    if (/@|https?:\/\//i.test(line)) continue
    if (line.length < 2 || line.length > 100) continue
    if (!name) {
      name = line
      continue
    }
    if (line !== name) {
      title = line
      break
    }
  }
  if (!name && lines[0]) name = lines[0].slice(0, 100)

  const skills = extractMentionedTechSkills(normalized)
  const summary = lines
    .slice(0, 12)
    .filter((l) => l.length < 200)
    .join(' ')
    .slice(0, 800)

  return {
    name: name || '',
    email,
    phone: '',
    linkedin: '',
    location: '',
    title,
    summary,
    experience: [],
    education: [],
    skills,
  }
}

function parseRetrySeconds(message: string): number | undefined {
  const m = message.match(/retry in ([\d.]+)\s*s/i)
  if (!m) return undefined
  return Math.max(1, Math.ceil(parseFloat(m[1])))
}

function isRecoverableGeminiQuotaError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 429 || err.status === 503
  }
  const message = err instanceof Error ? err.message : String(err)
  try {
    const parsed = JSON.parse(message) as { error?: { code?: number } }
    const code = parsed?.error?.code
    return code === 429 || code === 503
  } catch {
    return /RESOURCE_EXHAUSTED|quota|rate.?limit|429/i.test(message)
  }
}

async function extractWithGemini(modelInput: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = `The text may be a LinkedIn PDF export: a "Contact" block (phone, email, LinkedIn URL) often appears BEFORE the person's name. The name is usually the line above a headline containing "|" or "•". Location often appears as "City, Region, Country" right after the headline.

Return ONLY compact JSON (no markdown). Use null for any field not explicitly present in the text (omit arrays instead of placeholder entries).

Schema:
- name, email, phone, linkedin (short form like linkedin.com/in/handle), location, title, summary: strings or null
- skills: string[] ONLY — skills explicitly stated (section lists, headline). Do NOT invent skills not written in the CV.
- experience: [{ role, company, period, desc, location }] — omit if none in source
- education: [{ school, degree, years, desc }] — omit if none

CV text:
${modelInput}`

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  })

  let jsonStr = response.text || '{}'
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }

  return JSON.parse(jsonStr) as Record<string, unknown>
}

async function saveCvToSupabase(authHeader: string, cvData: CvData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { error } = await supabase.from('developers').upsert({ id: user.id, cv_data: cvData })
    if (error) console.error('Supabase upsert error:', error)
  }
}

function resolveBaseCv(fullText: string): { base: CvData; likelyLinkedInExport: boolean; linkedIn: CvData } {
  const linkedIn = parseLinkedInExportPdfText(fullText)
  const likelyLinkedInExport =
    Boolean(linkedIn.name) &&
    (/linkedin\.com/i.test(fullText) ||
      (/top skills/i.test(fullText) && /contact/i.test(fullText)))

  const base = likelyLinkedInExport ? linkedIn : heuristicCvData(fullText)
  return { base, likelyLinkedInExport, linkedIn }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const authHeader = req.headers.get('Authorization')

    if (!file || !authHeader) {
      return NextResponse.json({ error: 'Missing file or auth token' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const parser = new PDFParse({ data: buffer })
    const parsedData = await parser.getText()
    const fullText = parsedData.text

    const { base, likelyLinkedInExport, linkedIn } = resolveBaseCv(fullText)

    const rawForModel = likelyLinkedInExport ? reorderLinkedInExportForModel(fullText) : fullText
    const modelSlice =
      rawForModel.length > MAX_CV_TEXT_FOR_MODEL
        ? `${rawForModel.slice(0, MAX_CV_TEXT_FOR_MODEL)}\n[truncated]`
        : rawForModel

    let cvData: CvData
    let parseMode: 'gemini' | 'heuristic' | 'heuristic_fallback' = 'heuristic'

    if (process.env.GEMINI_API_KEY) {
      try {
        const rawAi = await extractWithGemini(modelSlice)
        cvData = likelyLinkedInExport
          ? mergeLinkedInHeuristicWithAi(linkedIn, rawAi)
          : normalizeParsedCvJson(rawAi)
        parseMode = 'gemini'
      } catch (err: unknown) {
        if (isRecoverableGeminiQuotaError(err)) {
          console.warn('parse-cv: Gemini unavailable, using structured extract:', err)
          cvData = base
          parseMode = 'heuristic_fallback'
        } else {
          throw err
        }
      }
    } else {
      cvData = base
    }

    await saveCvToSupabase(authHeader, cvData)

    return NextResponse.json({
      success: true,
      data: cvData,
      parseMode,
      ...(parseMode !== 'gemini'
        ? {
            notice:
              parseMode === 'heuristic'
                ? 'Set GEMINI_API_KEY for AI‑parsed experience and extra fields.'
                : 'Gemini quota limit hit; saved structured fields from the PDF. Try again later for AI enrichment.',
          }
        : {}),
    })
  } catch (error: unknown) {
    console.error('parse-cv error:', error)

    if (error instanceof ApiError) {
      const retryAfterSeconds = parseRetrySeconds(error.message)
      const headers =
        error.status === 429 && retryAfterSeconds
          ? { 'Retry-After': String(retryAfterSeconds) }
          : undefined
      return NextResponse.json(
        {
          error: error.message,
          status: error.status,
          retryAfterSeconds,
        },
        { status: error.status >= 400 && error.status < 600 ? error.status : 500, headers },
      )
    }

    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
