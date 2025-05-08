import Link from 'next/link'
 
export default function NotFound() {
  // Get the base path from environment variable or use empty string
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
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
