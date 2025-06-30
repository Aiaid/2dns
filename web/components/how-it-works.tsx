import { ArrowRight, Terminal, Database, Shield, Zap, Code, GitBranch } from "lucide-react"

export default function HowItWorks({ dict }: { dict: any }) {
  const icons = [Terminal, Database, Code, GitBranch]
  const colors = [
    "from-terminal-green to-terminal-blue",
    "from-terminal-blue to-terminal-purple",
    "from-terminal-purple to-terminal-orange",
    "from-terminal-orange to-terminal-green"
  ]

  return (
    <section id="how-it-works" className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
      {/* Terminal workflow background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-terminal-blue/30 rounded-lg blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-terminal-green/30 rounded-lg blur-3xl"></div>
        {/* Code flow pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, var(--terminal-green) 10px, var(--terminal-green) 11px)`,
        }}></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6 text-center fade-in">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient font-mono">function {dict.title}() {`{`}</span>
            </h2>
            <div className="code-block px-6 py-3 inline-block">
              <p className="max-w-[900px] text-adaptive-muted md:text-xl lg:text-2xl leading-relaxed font-mono">
                <span className="syntax-keyword">return</span> <span className="syntax-string">"{dict.subtitle}"</span>;
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="relative">
            {/* Terminal connection line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-terminal-green via-terminal-blue to-terminal-purple hidden md:block"></div>
            
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
                    {/* Terminal step icon */}
                    <div className="relative z-10 flex items-center gap-4">
                      <div className={`relative w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg glow group-hover:shadow-2xl transition-all duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Step number in terminal style */}
                      <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-md bg-terminal-bg/50 backdrop-blur-sm border border-terminal-green/30 font-mono">
                        <span className="text-sm font-bold text-terminal-green">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                    </div>
                    
                    {/* Terminal content block */}
                    <div className="flex-1 card-modern p-6 md:p-8 group">
                      <h3 className="text-2xl font-bold text-adaptive mb-4 group-hover:text-gradient transition-all duration-300 font-mono">
                        <span className="syntax-keyword">step</span>.<span className="syntax-function">{step.title}</span>()
                      </h3>
                      <div className="text-adaptive-muted leading-relaxed text-lg group-hover:text-adaptive-secondary transition-colors duration-300 font-mono">
                        <span className="syntax-comment">/**</span>
                        <br />
                        <span className="syntax-comment ml-1">* {step.description}</span>
                        <br />
                        <span className="syntax-comment">*/</span>
                      </div>
                    </div>
                    
                    {/* Terminal arrow indicator */}
                    {index < dict.steps.length - 1 && (
                      <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-lg bg-terminal-bg/20 backdrop-blur-sm border border-terminal-green/20 group hover:bg-terminal-bg/40 transition-all duration-300">
                        <ArrowRight className="h-6 w-6 text-terminal-green group-hover:text-terminal-blue transition-colors duration-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile connection line */}
                  {index < dict.steps.length - 1 && (
                    <div className="md:hidden flex justify-center my-8">
                      <div className="w-0.5 h-16 bg-gradient-to-b from-terminal-green to-terminal-blue rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Terminal completion indicator */}
        <div className="flex justify-center mt-16 fade-in font-mono">
          <div className="code-block px-6 py-3 flex items-center gap-4">
            <span className="syntax-keyword">process</span>.<span className="syntax-function">exit</span>(<span className="syntax-string">0</span>);
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-terminal-green animate-pulse"></div>
              <div className="w-2 h-2 rounded-sm bg-terminal-blue animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 rounded-sm bg-terminal-purple animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
        
        {/* Closing brace for function */}
        <div className="flex justify-center mt-8 fade-in">
          <div className="code-block px-6 py-3">
            <span className="text-gradient font-mono text-4xl">{`}`}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
