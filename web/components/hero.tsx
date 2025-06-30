import Link from "next/link"
import Image from "next/image"
import { getImagePath } from "@/lib/utils"

export default function Hero({ dict }: { dict: any }) {
  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-48 overflow-hidden">
      {/* Terminal-inspired background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-terminal-green/20 rounded-lg blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-terminal-blue/20 rounded-lg blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-terminal-purple/10 rounded-lg blur-3xl"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle, var(--terminal-green) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
          <div className="flex flex-col justify-center space-y-6 slide-in-left">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                <span className="text-gradient terminal-prompt">{dict.title.split(' ')[0]}</span>
                <span className="block text-adaptive font-mono">{dict.title.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-adaptive-secondary font-medium code-block px-4 py-2 inline-block">
                <span className="syntax-comment">// </span>
                <span className="syntax-string">{dict.subtitle}</span>
              </p>
            </div>
            <p className="max-w-[600px] text-adaptive-muted md:text-lg leading-relaxed">{dict.description}</p>
            
            <div className="flex flex-col gap-4 min-[400px]:flex-row pt-4">
              <Link
                href="#demo"
                className="btn-gradient inline-flex h-12 items-center justify-center rounded-lg px-8 text-base font-semibold shadow-lg transition-all duration-300 hover:scale-105 glow"
              >
                <span className="terminal-prompt">{dict.cta}</span>
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-terminal-green/30 bg-code-bg/50 backdrop-blur-sm px-8 text-base font-semibold text-adaptive shadow-lg transition-all duration-300 hover:bg-terminal-bg/70 hover:border-terminal-green hover:scale-105 hover:shadow-xl font-mono"
              >
                <span className="syntax-function">{dict.secondaryCta}</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-center slide-in-right">
            <div className="relative code-block p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-terminal-green/30 to-terminal-blue/30 rounded-lg blur-lg"></div>
              <Image
                src={getImagePath("/image.png")}
                width={600}
                height={400}
                alt="2DNS Global Network"
                className="relative rounded-lg object-contain shadow-xl transition-transform duration-500 hover:scale-105 float"
                priority
              />
            </div>
          </div>
        </div>
        
        {/* Terminal-style scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 fade-in">
          <div className="flex flex-col items-center gap-2 text-adaptive-muted font-mono">
            <span className="text-sm syntax-comment">// scroll to explore</span>
            <div className="w-6 h-10 border-2 border-terminal-green/50 rounded-md flex justify-center bg-terminal-bg/30">
              <div className="w-1 h-3 bg-terminal-green rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
