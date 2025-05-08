import { redirect } from "next/navigation"

export default function Home() {
  // Get the base path from environment variable or use empty string
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  // Redirect to the language page with the correct base path
  redirect(`${basePath}/en`)
}
