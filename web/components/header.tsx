import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import { getImagePath } from "@/lib/utils"

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
    <header className="sticky top-0 z-50 w-full nav-modern transition-all duration-300">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3 slide-in-left">
          <div className="relative">
            <Image 
              src={getImagePath("/2dns_logo_reflection.svg")}
              alt="2DNS Logo" 
              width={48}
              height={48}
              className="h-12 w-auto transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute inset-0 rounded-full glow opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span className="text-xl font-bold text-gradient hidden sm:block">2DNS</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 fade-in">
          <a 
            href="#features" 
            className="text-sm font-medium transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:bg-clip-text hover:scale-105"
          >
            {dictionary.navigation.features}
          </a>
          <a 
            href="#how-it-works" 
            className="text-sm font-medium transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:bg-clip-text hover:scale-105"
          >
            {dictionary.navigation.howItWorks}
          </a>
          <a 
            href="#encoding-explained" 
            className="text-sm font-medium transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:bg-clip-text hover:scale-105"
          >
            {dictionary.navigation.encodingExplained}
          </a>
          <a 
            href="#demo" 
            className="text-sm font-medium transition-all duration-300 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:bg-clip-text hover:scale-105"
          >
            {dictionary.navigation.try}
          </a>
        </nav>
        
        <div className="flex items-center gap-4 slide-in-right">
          <Link href={`/${otherLang}`} passHref>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105">
              <Globe className="h-5 w-5" />
              <span className="sr-only md:not-sr-only md:inline-block">{otherLangName}</span>
            </Button>
          </Link>
          
          <ModeToggle />
          
          <a
            href="https://github.com/aiaid/2dns"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex h-9 items-center justify-center rounded-full px-6 py-2 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}
