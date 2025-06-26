import { Shield, Globe, Code, Server } from "lucide-react"

export default function Features({ dict }: { dict: any }) {
  const icons = [Shield, Globe, Code, Server]
  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500", 
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500"
  ]

  return (
    <section id="features" className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center fade-in">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient">{dict.title}</span>
            </h2>
            <p className="max-w-[900px] text-white/70 md:text-xl lg:text-2xl leading-relaxed">{dict.subtitle}</p>
          </div>
        </div>
        
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-16 md:grid-cols-2 lg:gap-12">
          {dict.list.map((feature: any, index: number) => {
            const Icon = icons[index % icons.length]
            const gradient = gradients[index % gradients.length]
            
            return (
              <div
                key={index}
                className="group card-modern p-8 text-center hover:scale-105 transition-all duration-500 fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex flex-col items-center space-y-6">
                  <div className={`relative rounded-2xl bg-gradient-to-r ${gradient} p-4 shadow-lg group-hover:shadow-2xl transition-all duration-300 glow`}>
                    <Icon className="h-8 w-8 text-white" />
                    <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white group-hover:text-gradient transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                {/* 悬浮效果 */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${gradient} opacity-10 blur-xl`}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
