'use client'

import { Heart, Eye, FileText, File, Image, Trash2, MoreHorizontal, Star } from 'lucide-react'

interface DocumentCardProps {
  doc: {
    id: number
    title: string
    description?: string
    filename: string
    stored_name: string
    file_url?: string
    mime_type: string
    size_bytes: number
    tags: string[]
    is_favorite_admin: number
    views: number
    created_at: string
  }
  isFavorite: boolean
  isSelected: boolean
  onToggleFavorite: (id: number) => void
  onPreview: (doc: any) => void
  onSelect?: (id: number) => void
  showAdmin?: boolean
  onDelete?: (id: number) => void
  onEdit?: (doc: any) => void
}

export default function DocumentCard({
  doc, isFavorite, isSelected, onToggleFavorite, onPreview,
  onSelect, showAdmin, onDelete, onEdit
}: DocumentCardProps) {
  const Icon = doc.mime_type === 'application/pdf' ? FileText :
               doc.mime_type.startsWith('image/') ? Image : File

  const previewUrl = doc.mime_type.startsWith('image/')
    ? doc.file_url
    : null

  return (
    <div
      className={`card-hover overflow-hidden group cursor-pointer
        ${isSelected ? 'ring-2 ring-paper-500/40 border-paper-600/40' : ''}`}
      onClick={() => onSelect?.(doc.id)}
    >
      {previewUrl ? (
        <div className="h-40 overflow-hidden bg-ink-950">
          <img src={previewUrl} alt={doc.title}
            className="w-full h-full object-cover opacity-75 group-hover:opacity-100
                       group-hover:scale-105 transition-all duration-500" />
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-gradient-to-br from-ink-800/50 to-ink-900/50
                        group-hover:from-ink-800 group-hover:to-ink-900 transition-all duration-500">
          <Icon className="w-14 h-14 text-ink-600/60 group-hover:text-ink-400/80 transition-colors duration-300" />
        </div>
      )}

      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-ink-200 line-clamp-2 leading-snug flex-1 group-hover:text-ink-100 transition-colors">
            {doc.title}
          </h3>
          <div className="flex items-center gap-0.5 shrink-0">
            {doc.is_favorite_admin === 1 && (
              <span className="text-paper-500/80"><Star className="w-3 h-3 fill-paper-500/30" /></span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc.id) }}
              className={`p-1 rounded-lg transition-all duration-200
                ${isFavorite ? 'text-red-400 bg-red-900/20' : 'text-ink-600 hover:text-red-400 hover:bg-red-900/10'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {doc.description && (
          <p className="text-xs text-ink-500/80 line-clamp-1 leading-relaxed">{doc.description}</p>
        )}

        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-500/70">
          <span className="truncate max-w-[90px]">{doc.filename}</span>
          <span>·</span>
          <span>{(doc.size_bytes / 1024 / 1024).toFixed(1)}MB</span>
          <span>·</span>
          <span>{doc.views || 0} viz</span>
        </div>

        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full
                bg-ink-800/40 text-ink-500 border border-ink-700/20 uppercase tracking-wider font-mono">
                {tag}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="text-[10px] text-ink-600 font-mono">+{doc.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 pt-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <button onClick={(e) => { e.stopPropagation(); onPreview(doc) }}
            className="flex-1 btn-ghost text-xs py-1.5 rounded-lg">
            <Eye className="w-3.5 h-3.5" />
            Visualizar
          </button>
          {showAdmin && (
            <>
              {onEdit && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(doc) }}
                  className="btn-ghost p-1.5 rounded-lg">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
                  className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
