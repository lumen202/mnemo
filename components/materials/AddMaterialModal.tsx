'use client'
import { useState, useRef } from 'react'
import { X, Upload, Plus, Loader2 } from 'lucide-react'
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

export function AddMaterialModal() {
  const { addMaterialOpen, setAddMaterialOpen, addToast } = useUIStore()
  const { addMaterial } = useStudyMaterialStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [materialType, setMaterialType] = useState<MaterialType>('note')
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  if (!addMaterialOpen) return null

  function reset() {
    setTitle('')
    setContent('')
    setUploadFile(null)
    setIsDragging(false)
    setIsExtracting(false)
    setIsSaving(false)
    setMaterialType('note')
    setError('')
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
      setIsExtracting(true)
      extractDocx(file)
        .then((text) => { setContent(text); setIsExtracting(false) })
        .catch(() => { setError('Could not read the Word file. Try pasting the content instead.'); setIsExtracting(false) })
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

  async function save() {
    if (!title.trim()) { setError('Please add a title.'); return }
    if (!content.trim()) { setError('Please add some content or upload a file.'); return }
    setError('')
    setIsSaving(true)
    try {
      const source = uploadFile ? await uploadToStorage(uploadFile) : null
      await addMaterial({
        title: title.trim(),
        subject: 'other',
        type: materialType,
        status: 'pending',
        uploadDate: new Date().toISOString().slice(0, 10),
        content: content.trim() || undefined,
        wordCount: content.trim() ? content.split(/\s+/).filter(Boolean).length : undefined,
        source: source ?? undefined,
      })
      close()
      addToast({ title: 'Material added', description: `"${title.trim()}" is now in your library.`, variant: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.'
      setError(message)
      addToast({ title: 'Upload failed', description: message, variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <GlassCard className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Upload Study Material</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open the material and click Summarize — AI will categorize, summarize, and extract key points
            </p>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title + Type */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
              <Input
                placeholder="e.g. Chapter 3 — Recursion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
            {isExtracting ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 size={15} className="animate-spin" /> Reading file…
              </div>
            ) : (
              <>
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
              </>
            )}
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
            onClick={save}
            disabled={isSaving || isExtracting || !title.trim() || !content.trim()}
            className="w-full gap-2"
          >
            {isSaving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving…</>
            ) : (
              <><Plus size={14} /> Add to Library</>
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
