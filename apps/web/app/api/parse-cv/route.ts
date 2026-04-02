import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const authHeader = req.headers.get('Authorization')

    if (!file || !authHeader) {
      return NextResponse.json({ error: 'Missing file or auth token' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // 1. Parse PDF
    const parser = new PDFParse({ data: buffer })
    const parsedData = await parser.getText()
    const text = parsedData.text

    // 2. Call Gemini
    const prompt = `
Extract all the professional information from this CV text and return it in JSON format ONLY matching this exact typescript structure:
{
  "name": "string",
  "email": "string",
  "title": "string",
  "summary": "string",
  "experience": [{"role": "string", "company": "string", "period": "string", "desc": "string"}],
  "education": [{"school": "string", "degree": "string", "years": "string", "desc": "string"}],
  "skills": { "verified": ["string"], "unverified": ["string"] }
}
Do not include markdown codeblocks (\`\`\`json etc) in the response, just return the raw JSON text.

CV Text:
${text}
`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    let jsonStr = response.text || '{}'
    // clean markdown blocks if AI ignored the instruction
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '')
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '')
    }

    const cvData = JSON.parse(jsonStr)

    // 3. Save to Supabase developers table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('developers')
          .upsert({ id: user.id, cv_data: cvData })
          
        if (error) {
          console.error("Supabase upsert error:", error)
        }
      }
    }

    return NextResponse.json({ success: true, data: cvData })
  } catch (error: any) {
    console.error("PDF Parsing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
