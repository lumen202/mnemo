import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { badRequest, apiError } from '@/lib/api'

/**
 * PDF → plain text, done once at upload time. A scripted tool, not an AI
 * call: every downstream AI request (summarize, generate flashcards/quiz)
 * reuses this extracted text instead of re-sending or re-parsing the PDF, and
 * plain text is far cheaper in tokens than asking a model to read a document.
 * Runs server-side because pdf-parse needs Node — no PDF.js worker to bundle.
 */

const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15MB — generous for lecture notes/chapters, not a full textbook scan

export async function POST(req: NextRequest) {
  let parser: PDFParse | null = null
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return badRequest('file is required')
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return badRequest('file must be a PDF')
    }
    if (file.size > MAX_FILE_BYTES) {
      return badRequest(`file exceeds the ${MAX_FILE_BYTES / (1024 * 1024)}MB limit`)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    parser = new PDFParse({ data: buffer })
    const result = await parser.getText()

    const text = result.text.trim()
    if (!text) {
      return badRequest('No extractable text found — this PDF may be a scanned image without an OCR text layer.')
    }

    return NextResponse.json({ text, pages: result.pages?.length ?? undefined })
  } catch (err) {
    return apiError(err)
  } finally {
    await parser?.destroy().catch(() => {})
  }
}
