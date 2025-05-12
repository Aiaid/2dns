'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  useEffect(() => {
    // Client-side redirect to the English version
    router.push(`${basePath}/en`)
  }, [router, basePath])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to English version...</p>
    </div>
  )
}
