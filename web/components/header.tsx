import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { ModeToggle } from "./mode-toggle"

export default function Header({
  lang,
  dictionary,
}: {
  lang: string
  dictionary: any
}) {
  // Simple language toggle instead of dropdown
  const otherLang = lang === "en" ? "zh" : "en"
  const otherLangName = lang === "en" ? "中文" : "English"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-950 backdrop-blur supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-gray-950/95">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-xl font-bold">{dictionary.common.brand}</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">
            {dictionary.navigation.features}
          </a>
          <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
            {dictionary.navigation.howItWorks}
          </a>
          <a href="#demo" className="text-sm font-medium transition-colors hover:text-primary">
            {dictionary.navigation.try}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href={`/${otherLang}`} passHref>
            <Button variant="ghost" size="icon" className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <span className="sr-only md:not-sr-only md:inline-block">{otherLangName}</span>
            </Button>
          </Link>
          <ModeToggle />
          <a
            href="#contact"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {dictionary.navigation.contact}
          </a>
        </div>
      </div>
    </header>
  )
}
