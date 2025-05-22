import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { getDictionary, type Locale } from "./dictionaries"

const inter = Inter({ subsets: ["latin"] })

// Set this layout to static rendering
export const dynamic = "force-static"

// Generate static params for the layout
export async function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "zh" }
  ]
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const { lang } = await Promise.resolve(params)
  const validLang = (lang === "zh" ? "zh" : "en") as Locale
  const dict = await getDictionary(validLang)

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
    // Add base path to metadata for proper asset loading
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_PATH 
        ? `https://aiaid.github.io${process.env.NEXT_PUBLIC_BASE_PATH}`
        : 'https://aiaid.github.io/2dns'
    ),
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const { lang } = await Promise.resolve(params)
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
          storageKey="2dns-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
