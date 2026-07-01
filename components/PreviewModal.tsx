'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, Download, FileText, Maximize2, Minimize2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PreviewModalProps {
  doc: {
    id: number
    title: string
    description?: string
    filename: string
    stored_name: string
    file_url?: string
    mime_type: string
    tags: string[]
  }
  onClose: () => void
}

export default function PreviewModal({ doc, onClose }: PreviewModalProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const fileUrl = doc.file_url || ''
  const isHtml = doc.mime_type === 'text/html' || doc.filename.endsWith('.html')

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  function renderPreview() {
    const contentClass = fullscreen
      ? 'min-h-[0]'
      : doc.mime_type === 'application/pdf' ? 'min-h-[60vh]'
        : doc.mime_type.startsWith('image/') ? ''
          : 'min-h-[70vh]'

    const imgClass = fullscreen
      ? 'max-w-full max-h-full'
      : 'max-w-full max-h-[70vh]'

    if (doc.mime_type === 'application/pdf') {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className={`w-full h-full ${contentClass} rounded-xl`}
        />
      )
    }

    if (doc.mime_type.startsWith('image/')) {
      return (
        <div className={`flex items-center justify-center ${fullscreen ? 'p-0 h-full' : 'p-6'}`}>
          <img src={fileUrl} alt={doc.title}
            className={`${imgClass} rounded-xl object-contain shadow-2xl`} />
        </div>
      )
    }

    if (doc.mime_type === 'text/markdown' || doc.mime_type === 'text/plain') {
      return <MarkdownPreview url={fileUrl} fullscreen={fullscreen} />
    }

    if (isHtml) {
      return (
        <iframe
          src={fileUrl}
          className={`w-full h-full ${contentClass} rounded-xl border-0`}
          sandbox="allow-scripts allow-same-origin"
          title={doc.title}
        />
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-500">
        <div className="w-16 h-16 rounded-2xl bg-ink-800/50 border border-ink-700/30 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <p className="text-sm font-medium">Pré-visualização não disponível</p>
        <p className="text-xs text-ink-600 mt-1 font-mono">{doc.mime_type}</p>
        <a href={fileUrl} download
          className="btn-primary mt-6">
          <Download className="w-4 h-4" />
          Baixar arquivo
        </a>
      </div>
    )
  }

  return (
    <div
      className={`${fullscreen ? 'fixed inset-0 z-50 bg-ink-950' : 'preview-overlay animate-fade-in'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={fullscreen
        ? 'h-full w-full flex flex-col'
        : 'bg-ink-900/90 border border-ink-700/40 rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col shadow-2xl backdrop-blur-xl animate-scale-in'
      }>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800/50 shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-base font-medium text-ink-100 truncate">{doc.title}</h2>
            <p className="text-xs text-ink-500 truncate mt-0.5 font-mono">{doc.filename}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFullscreen(!fullscreen)} className="btn-ghost p-2 rounded-xl"
              title={fullscreen ? 'Reduzir' : 'Tela cheia'}>
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <a href={fileUrl} download className="btn-ghost p-2 rounded-xl" title="Download">
              <Download className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="btn-ghost p-2 rounded-xl" title="Fechar (ESC)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-auto ${fullscreen ? 'p-0' : 'p-5'}`}>
          {renderPreview()}
        </div>

        {!fullscreen && doc.tags.length > 0 && (
          <div className="px-6 py-3 border-t border-ink-800/50 flex flex-wrap gap-1.5 shrink-0">
            {doc.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full
                bg-ink-800/50 text-ink-400 border border-ink-700/30 uppercase tracking-wider font-mono">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MarkdownPreview({ url, fullscreen }: { url: string; fullscreen?: boolean }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setError(true))
  }, [url])

  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-400 text-sm">Erro ao carregar arquivo</p>
    </div>
  )

  const proseClass = (fullscreen ? 'prose-base max-w-5xl mx-auto' : 'prose-sm')

  return (
    <div className={'prose prose-invert ' + proseClass + ' max-w-none prose-headings:font-display prose-headings:text-ink-100 prose-a:text-paper-400 prose-a:no-underline hover:prose-a:underline prose-code:text-paper-300 prose-code:bg-ink-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-[13px] prose-code:font-mono prose-pre:bg-ink-950/80 prose-pre:border prose-pre:border-ink-700/30 prose-pre:rounded-xl prose-blockquote:border-l-paper-600/50 prose-blockquote:text-ink-400 prose-blockquote:italic prose-strong:text-ink-100 prose-hr:border-ink-800 prose-img:rounded-xl prose-table:border-ink-800 prose-td:border-ink-800 prose-th:border-ink-800 prose-th:text-ink-200'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
