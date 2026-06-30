import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Acervo — Gestão de Conteúdo Interno',
  description: 'Plataforma interna de gestão de documentos, manuais e materiais de treinamento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-ink-950 font-sans">
        <div className="fixed inset-0 bg-noise pointer-events-none z-50" />
        <main className="min-h-screen relative z-0">
          {children}
        </main>
      </body>
    </html>
  )
}
