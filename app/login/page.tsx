'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = await res.json()
        setError(data.error || 'Senha inválida')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-paper-600/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-paper-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative animate-fade-in">
        <div className="text-center mb-10">
          <div className="logo-icon mx-auto mb-6">
            <svg className="w-5 h-5 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-display text-ink-50 tracking-tight">Acervo</h1>
          <p className="text-ink-500 text-sm mt-2 font-[450]">Gestão de Conteúdo Interno</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-7 space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-400 mb-2 tracking-wide">
              Senha de acesso
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input text-base tracking-widest placeholder:tracking-normal"
              placeholder="••••••••"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-2.5 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full text-base py-3"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-center text-ink-700 text-xs mt-8 font-mono">
          Acesso restrito a colaboradores autorizados
        </p>
      </div>
    </div>
  )
}
