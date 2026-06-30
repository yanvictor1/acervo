'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then((res) => {
      if (res.ok) router.push('/dashboard')
      else router.push('/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <div className="w-6 h-6 border-2 border-paper-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
