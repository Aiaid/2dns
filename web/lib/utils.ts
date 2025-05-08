import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get the correct image path with basePath consideration
export function getImagePath(path: string): string {
  // Get the base path from environment variable or use empty string
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  // If path already starts with the basePath, don't add it again
  if (path.startsWith(`${basePath}/`)) {
    return path
  }
  
  // If path starts with a slash, append it to the basePath
  if (path.startsWith('/')) {
    return `${basePath}${path}`
  }
  
  // Otherwise, ensure there's a slash between basePath and the path
  return `${basePath}/${path}`
}
