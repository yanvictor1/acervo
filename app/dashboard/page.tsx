'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, Tags, Shield, Grid3X3, List, RefreshCw, Upload, FileText, Eye, MessageSquare, Send } from 'lucide-react'
import DocumentCard from '@/components/DocumentCard'
import UploadDropzone from '@/components/UploadDropzone'
import PreviewModal from '@/components/PreviewModal'

export default function DashboardPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [favorites, setFavorites] = useState<number[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (query) params.set('query', query)
    if (selectedTag) params.set('tag', selectedTag)

    const res = await fetch(`/api/documents?${params}`)
    const data = await res.json()
    setDocuments(data.documents)
    setTotalPages(data.pagination.totalPages)
    setLoading(false)
  }, [page, query, selectedTag])

  const fetchFavorites = useCallback(async () => {
    const res = await fetch('/api/favorites')
    if (res.ok) setFavorites(await res.json())
  }, [])

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/tags')
    if (res.ok) setAllTags(await res.json())
  }, [])

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => { fetchDocs(); fetchFavorites(); fetchTags(); fetchStats() }, [fetchDocs, fetchFavorites, fetchTags, fetchStats])

  async function handleUpload(file: File, metadata: { title: string; description: string; tags: string[] }) {
    const form = new FormData()
    form.append('file', file)
    form.append('title', metadata.title)
    form.append('description', metadata.description)
    form.append('tags', JSON.stringify(metadata.tags))

    const res = await fetch('/api/documents', { method: 'POST', body: form })
    if (res.ok) { fetchDocs(); fetchTags(); fetchStats(); setShowUpload(false) }
  }

  async function toggleFavorite(id: number) {
    const res = await fetch(`/api/favorites/${id}`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setFavorites((prev) => data.favorited ? [...prev, id] : prev.filter((f) => f !== id))
    }
  }

  async function handlePreview(doc: any) {
    setPreviewDoc(doc)
    await fetch(`/api/documents/${doc.id}/view`, { method: 'POST' })
    fetchStats()
  }

  async function handleFeedback() {
    if (!feedback.trim()) return
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: feedback }),
    })
    if (res.ok) { setFeedbackSent(true); setFeedback(''); setTimeout(() => setFeedbackSent(false), 4000) }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="absolute inset-0 bg-gradient-to-b from-paper-600/3 via-transparent to-transparent pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-ink-800/30 bg-ink-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-icon w-8 h-8 rounded-lg">
              <svg className="w-4 h-4 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h1 className="text-lg font-display text-ink-50 tracking-tight">Acervo</h1>
            <span className="hidden sm:inline text-[10px] font-mono text-ink-600 tracking-widest uppercase ml-1 border border-ink-800/50 rounded-md px-1.5 py-0.5">v1</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setShowUpload(!showUpload)} className={`btn-ghost p-2 ${showUpload ? 'text-paper-400 bg-ink-800/60' : ''}`} title="Upload">
              <Upload className="w-4 h-4" />
            </button>
            <button onClick={() => router.push('/admin')} className="btn-ghost p-2" title="Administrar">
              <Shield className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="btn-ghost p-2 text-ink-500 hover:text-red-400" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {showUpload && (
          <div className="animate-slide-up">
            <UploadDropzone onUpload={handleUpload} />
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-paper-600/15 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-paper-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.total}</p>
                <p className="text-[11px] text-ink-500 font-medium">Documentos</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.total_views}</p>
                <p className="text-[11px] text-ink-500 font-medium">Visualizações</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-50 font-display">
                  {stats.total > 0 ? (stats.total_views / stats.total).toFixed(1) : '0'}
                </p>
                <p className="text-[11px] text-ink-500 font-medium">Média/doc</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.feedback_count || 0}</p>
                <p className="text-[11px] text-ink-500 font-medium">Feedbacks</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 transition-colors group-focus-within:text-paper-500" />
            <input
              type="text"
              placeholder="Buscar documentos por palavra-chave..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              className="input-search"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn-ghost p-2"
              title={viewMode === 'grid' ? 'Modo lista' : 'Modo grid'}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </button>
            <button onClick={() => { fetchDocs(); fetchFavorites(); fetchStats() }} className="btn-ghost p-2" title="Atualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tags className="w-3.5 h-3.5 text-ink-600 mr-1 shrink-0" />
            <button onClick={() => setSelectedTag('')} className={!selectedTag ? 'tag-pill-active' : 'tag-pill'}>Todas</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={selectedTag === tag ? 'tag-pill-active' : 'tag-pill'}>{tag}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-paper-600/50 border-t-paper-500 rounded-full animate-spin" />
              <p className="text-ink-600 text-xs font-mono">Carregando...</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ink-800/50 border border-ink-700/30 flex items-center justify-center">
              <Search className="w-6 h-6 text-ink-600" />
            </div>
            <p className="text-ink-400 text-sm font-medium">Nenhum documento encontrado</p>
            <p className="text-ink-600 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
              {query || selectedTag
                ? 'Tente ajustar sua busca ou limpar os filtros'
                : 'Arraste arquivos clicando no ícone de upload acima'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-600 font-mono">
                {documents.length} documento{documents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger'
              : 'space-y-2 stagger'}>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={{ ...doc, tags: JSON.parse(doc.tags || '[]') }}
                  isFavorite={favorites.includes(doc.id)}
                  isSelected={false}
                  onToggleFavorite={toggleFavorite}
                  onPreview={handlePreview}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6 pb-4">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-ghost text-xs px-3">Anterior</button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button key={pageNum} onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono transition-all duration-200
                          ${pageNum === page
                            ? 'bg-paper-600/20 text-paper-400 border border-paper-600/30'
                            : 'text-ink-500 hover:text-ink-300 hover:bg-ink-800/50'}`}>
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-ghost text-xs px-3">Próximo</button>
              </div>
            )}
          </>
        )}

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-paper-500" />
            <h3 className="text-sm font-medium text-ink-200">Sugestão de melhoria</h3>
          </div>
          <p className="text-xs text-ink-500">Como podemos melhorar o Acervo para o time?</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: poderia ter notificações, versão mobile melhor, etc..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFeedback()}
              className="input flex-1"
              disabled={feedbackSent}
            />
            <button onClick={handleFeedback} disabled={!feedback.trim() || feedbackSent} className="btn-primary px-4">
              {feedbackSent ? 'Enviado!' : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}
