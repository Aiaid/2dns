import { getDictionary, type Locale } from "./dictionaries"
import LandingPage from "@/components/landing-page"
import { Suspense } from "react"

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh" }]
}

export default async function Home({
  params: { lang },
}: {
  params: { lang: string }
}) {
  // Ensure we use a valid language
  const validLang = (lang === "zh" ? "zh" : "en") as Locale

  // Fetch dictionary data
  const dictionary = await getDictionary(validLang)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPage lang={validLang} dictionary={dictionary} />
    </Suspense>
  )
}
