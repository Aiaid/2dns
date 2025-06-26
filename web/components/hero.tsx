import Link from "next/link"
import Image from "next/image"
import { getImagePath } from "@/lib/utils"

export default function Hero({ dict }: { dict: any }) {
  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-48 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-pink-400/30 to-cyan-400/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
          <div className="flex flex-col justify-center space-y-6 slide-in-left">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                <span className="text-gradient">{dict.title.split(' ')[0]}</span>
                <span className="block text-white/90">{dict.title.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 font-medium">{dict.subtitle}</p>
            </div>
            <p className="max-w-[600px] text-white/70 md:text-lg leading-relaxed">{dict.description}</p>
            
            <div className="flex flex-col gap-4 min-[400px]:flex-row pt-4">
              <Link
                href="#demo"
                className="btn-gradient inline-flex h-12 items-center justify-center rounded-full px-8 text-base font-semibold shadow-2xl transition-all duration-300 hover:scale-105 glow"
              >
                {dict.cta}
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm px-8 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-2xl"
              >
                {dict.secondaryCta}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-center slide-in-right">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-500/50 rounded-3xl blur-xl"></div>
              <Image
                src={getImagePath("/image.png")}
                width={600}
                height={400}
                alt="2DNS Global Network"
                className="relative rounded-3xl object-contain shadow-2xl transition-transform duration-500 hover:scale-105 float"
                priority
              />
            </div>
          </div>
        </div>
        
        {/* 滚动指示器 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 fade-in">
          <div className="flex flex-col items-center gap-2 text-white/60">
            <span className="text-sm">滚动探索更多</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
