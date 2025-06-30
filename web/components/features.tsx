import { Shield, Globe, Code, Server, Terminal, Database, Lock, Zap } from "lucide-react"

export default function Features({ dict }: { dict: any }) {
  const icons = [Terminal, Database, Lock, Zap]
  const gradients = [
    "from-terminal-green to-terminal-blue",
    "from-terminal-blue to-terminal-purple", 
    "from-terminal-purple to-terminal-orange",
    "from-terminal-orange to-terminal-green"
  ]

  return (
    <section id="features" className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* Terminal background pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-terminal-purple/10 dark:bg-terminal-purple/20 rounded-lg blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-terminal-blue/10 dark:bg-terminal-blue/20 rounded-lg blur-3xl"></div>
        {/* Simplified pattern for light mode */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, var(--terminal-green) 24px, var(--terminal-green) 25px)`,
        }}></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center fade-in">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient font-mono">// {dict.title}</span>
            </h2>
            <div className="code-block px-6 py-3 inline-block">
              <p className="max-w-[900px] text-adaptive-muted md:text-xl lg:text-2xl leading-relaxed font-mono">
                <span className="syntax-keyword">const</span> <span className="syntax-function">features</span> = [
                <br />
                <span className="ml-4 syntax-string">"{dict.subtitle}"</span>
                <br />
                ];
              </p>
            </div>
          </div>
        </div>
        
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-16 md:grid-cols-2 lg:gap-12">
          {dict.list.map((feature: any, index: number) => {
            const Icon = icons[index % icons.length]
            const gradient = gradients[index % gradients.length]
            
            return (
              <div
                key={index}
                className="group card-modern p-8 text-left hover:scale-105 transition-all duration-500 fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`relative rounded-lg bg-gradient-to-r ${gradient} p-3 shadow-lg group-hover:shadow-2xl transition-all duration-300 glow`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-terminal-green font-mono text-sm">
                      [{String(index + 1).padStart(2, '0')}]
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-adaptive group-hover:text-gradient transition-all duration-300 font-mono">
                      <span className="syntax-function">{feature.title}</span>
                    </h3>
                    <div className="text-adaptive-muted leading-relaxed group-hover:text-adaptive-secondary transition-colors duration-300 font-mono text-sm">
                      <span className="syntax-comment">/* </span>
                      <br />
                      <span className="ml-2">{feature.description}</span>
                      <br />
                      <span className="syntax-comment">*/</span>
                    </div>
                  </div>
                </div>
                
                {/* Terminal cursor effect */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-4 bg-terminal-green animate-pulse"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
