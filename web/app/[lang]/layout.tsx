import type React from "react"
import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { getDictionary, type Locale } from "./dictionaries"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const { lang } = await params
  const validLang = (lang === "zh" ? "zh" : "en") as Locale
  const dict = await getDictionary(validLang)

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const { lang } = await params
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
