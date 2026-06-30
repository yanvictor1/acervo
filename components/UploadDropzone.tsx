'use client'

import { useCallback, useState } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'

interface UploadDropzoneProps {
  onUpload: (file: File, metadata: { title: string; description: string; tags: string[] }) => void
}

export default function UploadDropzone({ onUpload }: UploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [step, setStep] = useState<'select' | 'metadata'>('select')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setStep('metadata'); setTitle(f.name.replace(/\.[^/.]+$/, '')) }
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setStep('metadata'); setTitle(f.name.replace(/\.[^/.]+$/, '')) }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput('') }
  }

  function submit() {
    if (file) onUpload(file, { title: title || file.name, description, tags })
    reset()
  }

  function reset() {
    setFile(null); setTitle(''); setDescription(''); setTags([]); setTagInput(''); setStep('select')
  }

  const FileIcon = file?.type === 'application/pdf' ? FileText :
                   file?.type.startsWith('image/') ? Image : File

  return (
    <div className="card p-5">
      {step === 'select' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
            ${dragOver
              ? 'border-paper-500/60 bg-paper-600/10 scale-[1.01]'
              : 'border-ink-700/30 hover:border-ink-600/50 hover:bg-ink-800/30'}`}
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-ink-800/50 border border-ink-700/30 flex items-center justify-center">
            <Upload className={`w-6 h-6 transition-colors duration-300 ${dragOver ? 'text-paper-500' : 'text-ink-500'}`} />
          </div>
          <p className="text-ink-300 text-sm font-medium">Arraste arquivos para upload</p>
          <p className="text-ink-600 text-xs mt-1.5">ou clique para selecionar do computador</p>
          <input type="file" onChange={handleFileSelect} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="btn-ghost mt-5 text-xs px-4 py-2 inline-flex cursor-pointer border border-ink-700/30 rounded-xl hover:border-ink-600/40">
            Selecionar arquivo
          </label>
        </div>
      ) : file ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
              <FileIcon className="w-5 h-5 text-ink-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-200 truncate font-medium">{file.name}</p>
              <p className="text-xs text-ink-500 font-mono mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-300 hover:bg-ink-700/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-medium">Título</label>
            <input
              placeholder="Nome do documento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-medium">Descrição <span className="text-ink-600">(opcional)</span></label>
            <textarea
              placeholder="Breve descrição do conteúdo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-medium">Tags</label>
            <div className="flex gap-2">
              <input
                placeholder="Ex: treinamento, onboarding..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input flex-1"
              />
              <button onClick={addTag} className="btn-ghost px-3 text-xs border border-ink-700/30 rounded-xl">+</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    text-[10px] font-mono uppercase tracking-wider
                    bg-paper-600/15 text-paper-400 border border-paper-600/25">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="text-paper-500/60 hover:text-paper-300 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-ink-800/50">
            <button onClick={reset} className="btn-ghost flex-1 border border-ink-700/30">Cancelar</button>
            <button onClick={submit} className="btn-primary flex-1">Fazer upload</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
