import Hero from "@/components/hero"
import Features from "@/components/features"
import HowItWorks from "@/components/how-it-works"
import InteractiveDemo from "@/components/interactive-demo"
import Header from "@/components/header"
import Footer from "@/components/footer"

// This is a server component that receives the fully resolved dictionary
export default function LandingPage({
  lang,
  dictionary,
}: {
  lang: string
  dictionary: any
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header lang={lang} dictionary={dictionary} />
      <main className="flex-1">
        <Hero dict={dictionary.hero} />
        <Features dict={dictionary.features} />
        <HowItWorks dict={dictionary.howItWorks} />
        <InteractiveDemo dict={dictionary.demo} />
      </main>
      <Footer dict={dictionary.footer} brand={dictionary.common.brand} />
    </div>
  )
}
