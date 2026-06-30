'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, ArrowLeft, Trash2, Edit2, Save, X, RefreshCw, Database, Tags, Star as StarIcon, MessageSquare, Eye, FileText } from 'lucide-react'
import DocumentCard from '@/components/DocumentCard'
import PreviewModal from '@/components/PreviewModal'

export default function AdminPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [favorites, setFavorites] = useState<number[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>(null)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const [reindexing, setReindexing] = useState(false)
  const [bulkTag, setBulkTag] = useState('')
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [showFeedback, setShowFeedback] = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
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

  const fetchFeedbacks = useCallback(async () => {
    const res = await fetch('/api/feedback')
    if (res.ok) setFeedbacks(await res.json())
  }, [])

  useEffect(() => { fetchDocs(); fetchFavorites(); fetchTags(); fetchStats(); fetchFeedbacks() }, [fetchDocs, fetchFavorites, fetchTags, fetchStats, fetchFeedbacks])

  async function toggleFavorite(id: number) {
    const res = await fetch(`/api/favorites/${id}`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setFavorites((prev) => data.favorited ? [...prev, id] : prev.filter((f) => f !== id))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (res.ok) { fetchDocs(); fetchStats(); fetchTags() }
  }

  async function handleBulkDelete() {
    if (!confirm(`Excluir ${selected.length} documento(s)?`)) return
    const res = await fetch('/api/documents/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, action: 'delete' }),
    })
    if (res.ok) { setSelected([]); fetchDocs(); fetchStats(); fetchTags() }
  }

  async function handleBulkAddTag() {
    const tag = bulkTag.trim().toLowerCase()
    if (!tag || selected.length === 0) return
    const res = await fetch('/api/documents/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, action: 'add_tag', tag }),
    })
    if (res.ok) { setBulkTag(''); fetchDocs(); fetchTags() }
  }

  async function handleBulkRemoveTag(tag: string) {
    const res = await fetch('/api/documents/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, action: 'remove_tag', tag }),
    })
    if (res.ok) fetchDocs()
  }

  async function handleEditSave() {
    if (!editingDoc) return
    const res = await fetch(`/api/documents/${editingDoc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingDoc.title,
        description: editingDoc.description,
        tags: editingDoc.tags,
        is_favorite_admin: editingDoc.is_favorite_admin,
      }),
    })
    if (res.ok) { setEditingDoc(null); fetchDocs(); fetchTags() }
  }

  async function handleToggleAdminFavorite(id: number) {
    const doc = documents.find((d) => d.id === id)
    if (!doc) return
    const newVal = doc.is_favorite_admin === 1 ? 0 : 1
    await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite_admin: newVal }),
    })
    fetchDocs(); fetchStats()
  }

  async function handleReindex() {
    setReindexing(true)
    await fetch('/api/admin/reindex', { method: 'POST' })
    setReindexing(false)
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-ink-800/50 bg-ink-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn-ghost p-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Shield className="w-4 h-4 text-paper-500" />
            <h1 className="text-base font-semibold text-ink-50">Administração</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReindex} disabled={reindexing} className="btn-ghost text-xs" title="Reindexar busca">
              <Database className="w-3.5 h-3.5" />
              {reindexing ? 'Reindexando...' : 'Rebuild FTS'}
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-ghost p-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {stats && (<>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-paper-500" />
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.total}</p>
              </div>
              <p className="text-xs text-ink-500">Documentos</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-400" />
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.total_views}</p>
              </div>
              <p className="text-xs text-ink-500">Visualizações totais</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <StarIcon className="w-4 h-4 text-paper-500" />
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.favorites}</p>
              </div>
              <p className="text-xs text-ink-500">Destacados</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <p className="text-2xl font-bold text-ink-50 font-display">{stats.feedback_count || 0}</p>
              </div>
              <p className="text-xs text-ink-500">Feedbacks</p>
            </div>
          </div>

          <button onClick={() => setShowFeedback(!showFeedback)} className="btn-ghost text-xs border border-ink-700/30">
            <MessageSquare className="w-3.5 h-3.5" />
            {showFeedback ? 'Ocultar feedbacks' : 'Ver feedbacks (' + feedbacks.length + ')'}
          </button>

          {showFeedback && feedbacks.length > 0 && (
            <div className="space-y-2 animate-slide-up">
              {feedbacks.map((fb: any) => (
                <div key={fb.id} className="card p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-200">{fb.message}</p>
                    <p className="text-[11px] text-ink-500 font-mono mt-1">
                      {new Date(fb.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {selected.length > 0 && (
          <div className="card p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-400 font-medium">{selected.length} selecionado(s)</span>
            <button onClick={handleBulkDelete} className="btn-danger text-xs">Excluir</button>
            <div className="flex items-center gap-1 ml-2">
              <input
                placeholder="Adicionar tag..."
                value={bulkTag}
                onChange={(e) => setBulkTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBulkAddTag()}
                className="input text-xs py-1.5 w-32"
              />
              <button onClick={handleBulkAddTag} className="btn-ghost text-xs">+</button>
            </div>
            <button onClick={() => setSelected([])} className="btn-ghost text-xs ml-auto">Limpar</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
            <input
              type="text" placeholder="Buscar..."
              value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              className="input pl-9"
            />
          </div>
          <button onClick={() => { fetchDocs(); fetchStats() }} className="btn-ghost p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tags className="w-3.5 h-3.5 text-ink-500 mr-1" />
            <button onClick={() => setSelectedTag('')} className={!selectedTag ? 'tag-pill-active' : 'tag-pill'}>Todas</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={selectedTag === tag ? 'tag-pill-active' : 'tag-pill'}>{tag}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-paper-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const tags = typeof doc.tags === 'string' ? JSON.parse(doc.tags || '[]') : doc.tags
              return (
                <div key={doc.id}
                  className={`card-hover p-3 flex items-center gap-3 cursor-pointer ${selected.includes(doc.id) ? 'ring-2 ring-paper-500/50 border-paper-600/50' : ''}`}
                  onClick={() => toggleSelect(doc.id)}
                >
                  <input type="checkbox" checked={selected.includes(doc.id)} readOnly className="accent-paper-600" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-200 truncate">{doc.title}</span>
                      {doc.is_favorite_admin === 1 && <StarIcon className="w-3 h-3 text-paper-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5">
                      <span>{doc.filename}</span>
                      <span>·</span>
                      <span>{(doc.size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                      <span>·</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map((tag: string) => (
                          <span key={tag} className="tag-pill text-[10px]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleAdminFavorite(doc.id) }} className="btn-ghost p-1.5"
                      title={doc.is_favorite_admin === 1 ? 'Remover destaque' : 'Destacar'}>
                      <StarIcon className={`w-3.5 h-3.5 ${doc.is_favorite_admin === 1 ? 'text-paper-500 fill-paper-500' : 'text-ink-500'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setPreviewDoc({ ...doc, tags }) }} className="btn-ghost p-1.5" title="Visualizar">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation()
                      setEditingDoc({ id: doc.id, title: doc.title, description: doc.description || '', tags, is_favorite_admin: doc.is_favorite_admin })
                    }} className="btn-ghost p-1.5" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }} className="btn-ghost p-1.5 text-red-400" title="Excluir">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-ghost text-xs">Anterior</button>
            <span className="text-xs text-ink-500">{page} de {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-ghost text-xs">Próximo</button>
          </div>
        )}
      </div>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 backdrop-blur-sm p-4">
          <div className="bg-ink-900 border border-ink-700/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-50">Editar documento</h2>
              <button onClick={() => setEditingDoc(null)} className="btn-ghost p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-ink-400 mb-1">Título</label>
              <input value={editingDoc.title} onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                className="input" />
            </div>

            <div>
              <label className="block text-xs text-ink-400 mb-1">Descrição</label>
              <textarea value={editingDoc.description} onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                rows={2} className="input resize-none" />
            </div>

            <div>
              <label className="block text-xs text-ink-400 mb-1">Tags (separadas por vírgula)</label>
              <input value={editingDoc.tags.join(', ')} onChange={(e) => setEditingDoc({
                ...editingDoc,
                tags: e.target.value.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
              })} className="input" />
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-300 cursor-pointer">
              <input type="checkbox" checked={editingDoc.is_favorite_admin === 1}
                onChange={(e) => setEditingDoc({ ...editingDoc, is_favorite_admin: e.target.checked ? 1 : 0 })}
                className="accent-paper-600" />
              Destacar como favorito (admin)
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingDoc(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={handleEditSave} className="btn-primary flex-1">
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}
