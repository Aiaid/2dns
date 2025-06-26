import { getDictionary, type Locale } from "./dictionaries"
import LandingPage from "@/components/landing-page"
import { Suspense } from "react"
import { Metadata } from 'next'
import Script from 'next/script'

// This function is crucial for static site generation
// It tells Next.js which routes to pre-render at build time
export async function generateStaticParams() {
  // Pre-render both language variants
  return [
    { lang: "en" },
    { lang: "zh" }
  ]
}

// Set this page to static rendering
export const dynamic = "force-static"
export const dynamicParams = false

export default async function Home({
  params,
}: {
  params: { lang: string }
}) {
  // Get the language from params
  const { lang } = await Promise.resolve(params)
  
  // Ensure we use a valid language
  const validLang = (lang === "zh" ? "zh" : "en") as Locale

  // Fetch dictionary data
  const dictionary = await getDictionary(validLang)

  return (
    <>
      <Script id="theme-color-script" strategy="afterInteractive">
        {`
          function updateCodeBg() {
            const isDark = document.documentElement.classList.contains('dark');
            document.documentElement.style.setProperty('--code-bg', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)');
          }
          
          // 初始设置
          updateCodeBg();
          
          // 监听主题切换
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.attributeName === 'class') {
                updateCodeBg();
              }
            });
          });
          
          observer.observe(document.documentElement, { attributes: true });
        `}
      </Script>
      <Suspense fallback={<div>Loading...</div>}>
        <LandingPage lang={validLang} dictionary={dictionary} />
      </Suspense>
    </>
  )
}
