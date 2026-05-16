'use client'
import { useState, useRef } from 'react'
import { X, Upload, Sparkles, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard } from '@/components/common/GlassCard'
import { useStudyMaterialStore, useUIStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { supabase } from '@/services/supabase/client'
import { isSupabaseConfigured } from '@/lib/env'
import type { SubjectId, MaterialType } from '@/types'

const BUCKET = 'Study Materials'

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

async function uploadToStorage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const ext = file.name.split('.').pop() ?? 'txt'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const SUBJECTS: SubjectId[] = [
  'mathematics', 'computer-science', 'physics', 'literature',
  'machine-learning', 'history', 'biology', 'chemistry',
  'economics', 'philosophy', 'other',
]

const TYPES: { value: MaterialType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'note', label: 'Note' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'Link' },
  { value: 'textbook', label: 'Textbook' },
]

type Step = 'input' | 'results'

export function AddMaterialModal() {
  const { addMaterialOpen, setAddMaterialOpen } = useUIStore()
  const { addMaterial } = useStudyMaterialStore()

  const [step, setStep] = useState<Step>('input')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState('')
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [detectedSubject, setDetectedSubject] = useState<SubjectId>('other')
  const [materialType, setMaterialType] = useState<MaterialType>('note')

  const fileRef = useRef<HTMLInputElement>(null)

  if (!addMaterialOpen) return null

  function reset() {
    setStep('input')
    setTitle('')
    setContent('')
    setUploadFile(null)
    setIsAnalyzing(false)
    setIsSaving(false)
    setShowKeyPoints(false)
    setError('')
    setSummary('')
    setKeyPoints([])
    setDetectedSubject('other')
    setMaterialType('note')
  }

  function close() {
    setAddMaterialOpen(false)
    reset()
  }

  function handleFile(file: File) {
    const isTxt = file.name.endsWith('.txt') || file.type === 'text/plain'
    const isDocx =
      file.name.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!isTxt && !isDocx) {
      setError('Only .txt and .docx files are supported. For PDFs, paste the content below.')
      return
    }

    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    setUploadFile(file)
    setError('')

    if (isDocx) {
      setIsAnalyzing(true)
      extractDocx(file)
        .then((text) => { setContent(text); setIsAnalyzing(false) })
        .catch(() => { setError('Could not read the Word file. Try pasting the content instead.'); setIsAnalyzing(false) })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setContent((e.target?.result as string) ?? '')
    reader.readAsText(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function analyze() {
    if (!content.trim()) { setError('Please add some content first.'); return }
    if (!title.trim()) { setError('Please add a title.'); return }
    setError('')
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.slice(0, 8000), title }),
      })
      const data = await res.json() as { summary?: string; keyPoints?: string[]; suggestedSubject?: SubjectId; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to analyze')
      setSummary(data.summary ?? '')
      setKeyPoints(data.keyPoints ?? [])
      if (data.suggestedSubject) setDetectedSubject(data.suggestedSubject)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function save() {
    setIsSaving(true)
    const source = uploadFile ? await uploadToStorage(uploadFile) : null
    await addMaterial({
      title,
      subject: detectedSubject,
      type: materialType,
      status: 'summarized',
      uploadDate: new Date().toISOString().slice(0, 10),
      summary,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
      content: content.trim() || undefined,
      wordCount: content.trim() ? content.split(/\s+/).filter(Boolean).length : undefined,
      source: source ?? undefined,
    }).catch(() => {})
    setIsSaving(false)
    close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <GlassCard className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {step === 'input' ? 'Upload Study Material' : 'AI Analysis'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 'input'
                ? 'Upload a .txt file or paste content — AI will categorize and summarize'
                : 'Review AI categorization and summary before saving'}
            </p>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {step === 'input' ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
              <Input
                placeholder="e.g. Chapter 3 — Recursion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-indigo-400/60 bg-indigo-500/10'
                  : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              <Upload className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
              {uploadFile ? (
                <p className="text-sm text-indigo-400 font-medium">{uploadFile.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Drop a <span className="text-foreground font-medium">.txt</span> or{' '}
                  <span className="text-foreground font-medium">.docx</span> file here or click to browse
                </p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-1">For PDFs — paste the text content below</p>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {/* Paste */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Or paste content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your lecture notes, PDF text, or any study material here..."
                rows={6}
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-400/50 resize-none"
              />
              {content && (
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {content.split(/\s+/).filter(Boolean).length} words
                </p>
              )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button
              onClick={analyze}
              disabled={isAnalyzing || !content.trim() || !title.trim()}
              className="w-full gap-2"
            >
              {isAnalyzing ? (
                <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
              ) : (
                <><Sparkles size={14} /> Analyze with AI</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Detected subject */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20">
              <Sparkles size={15} className="text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-indigo-300/70 mb-0.5">AI detected subject</p>
                <select
                  value={detectedSubject}
                  onChange={(e) => setDetectedSubject(e.target.value as SubjectId)}
                  className="text-sm font-medium bg-transparent text-foreground border-none outline-none w-full cursor-pointer"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-background text-foreground">
                      {SUBJECT_META[s]?.label ?? s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title + type */}
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                  className="h-9 text-xs bg-background border border-border rounded-lg px-3 text-foreground"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Summary</p>
              <p className="text-sm text-foreground/90 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                {summary}
              </p>
            </div>

            {/* Key points toggle */}
            {keyPoints.length > 0 && (
              <div>
                <button
                  onClick={() => setShowKeyPoints(!showKeyPoints)}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showKeyPoints ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showKeyPoints ? 'Hide' : 'Get'} Key Points ({keyPoints.length})
                </button>
                {showKeyPoints && (
                  <ul className="mt-3 space-y-2">
                    {keyPoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-medium">
                          {i + 1}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{kp}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {uploadFile && isSupabaseConfigured() && (
              <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                <Upload size={10} />
                <span>{uploadFile.name} will be saved to storage</span>
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
                Back
              </Button>
              <Button onClick={save} disabled={isSaving} className="flex-1 gap-1.5">
                {isSaving ? (
                  <><Loader2 size={13} className="animate-spin" /> Saving…</>
                ) : (
                  <><Plus size={13} /> Add to Library</>
                )}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
