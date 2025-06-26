import { ArrowRight, Server, Globe, Shield, Key } from "lucide-react"

export default function HowItWorks({ dict }: { dict: any }) {
  const icons = [Server, Globe, Shield, Key]
  const colors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500"
  ]

  return (
    <section id="how-it-works" className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
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

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="relative">
            {/* 连接线 */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 hidden md:block"></div>
            
            {dict.steps.map((step: any, index: number) => {
              const Icon = icons[index % icons.length]
              const gradient = colors[index % colors.length]
              
              return (
                <div 
                  key={index} 
                  className="relative mb-16 last:mb-0 slide-in-left"
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* 步骤图标 */}
                    <div className="relative z-10 flex items-center gap-4">
                      <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg glow group-hover:shadow-2xl transition-all duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      {/* 步骤编号 */}
                      <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 card-modern p-6 md:p-8 group">
                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gradient transition-all duration-300">
                        {step.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed text-lg group-hover:text-white/90 transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* 箭头指示器 */}
                    {index < dict.steps.length - 1 && (
                      <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 group hover:bg-white/10 transition-all duration-300">
                        <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white transition-colors duration-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* 移动端连接线 */}
                  {index < dict.steps.length - 1 && (
                    <div className="md:hidden flex justify-center my-8">
                      <div className="w-0.5 h-16 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 底部装饰 */}
        <div className="flex justify-center mt-16 fade-in">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-orange-500 animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      </div>
    </section>
  )
}
