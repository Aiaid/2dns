'use client'

import { useEffect } from 'react'
import Link from 'next/link'
 
export default function NotFound() {
  // Get the base path from environment variable or use empty string
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  // Use client-side detection to handle 404s more reliably
  useEffect(() => {
    // Check if we're on GitHub Pages
    const isGitHubPages = window.location.origin.indexOf('github.io') > -1
    
    // If we're on GitHub Pages, use the custom 404.html handling
    if (isGitHubPages) {
      // Get the current URL information
      const origin = window.location.origin
      const pathname = window.location.pathname
      const search = window.location.search
      const hash = window.location.hash
      
      // Redirect to the 404.html page which has the proper redirection logic
      window.location.href = `${origin}${basePath}/404.html?path=${encodeURIComponent(pathname)}${search}${hash}`
    }
  }, [basePath])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-8">Could not find the requested resource</p>
      <Link 
        href={`${basePath}/en`}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
}
