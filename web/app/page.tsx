'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  useEffect(() => {
    // Client-side redirect to the English version
    // Use window.location for a hard redirect to ensure proper path handling
    // This is especially important for GitHub Pages with a base path
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      const search = window.location.search
      const hash = window.location.hash
      
      // Construct the full URL to the English version
      const redirectUrl = `${origin}${basePath}/en/${search}${hash}`
      
      // Use replace for a clean redirect without adding to history
      window.location.replace(redirectUrl)
    } else {
      // Fallback to Next.js router if running on server
      router.push(`${basePath}/en`)
    }
  }, [router, basePath])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to English version...</p>
    </div>
  )
}
