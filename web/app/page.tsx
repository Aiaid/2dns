import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to the English version
  // Note: We don't need to add basePath here as Next.js handles it automatically
  // when using the redirect function from next/navigation
  redirect('/en')
}
