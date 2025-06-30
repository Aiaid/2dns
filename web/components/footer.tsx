export default function Footer({
  dict,
  brand,
}: {
  dict: any
  brand: string
}) {
  return (
    <footer className="relative border-t border-terminal-green/20 py-12 md:py-16 bg-gradient-to-t from-terminal-bg/40 to-transparent">
      <div className="absolute inset-0 bg-gradient-to-r from-terminal-purple/10 via-terminal-blue/10 to-terminal-green/10"></div>
      {/* Terminal grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(var(--terminal-green) 1px, transparent 1px), linear-gradient(90deg, var(--terminal-green) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center justify-center gap-8">
          
          {/* Terminal brand info */}
          <div className="text-center space-y-4 code-block p-6">
            <h3 className="text-2xl font-bold text-gradient font-mono terminal-prompt">{brand}</h3>
            <p className="text-adaptive-muted max-w-md font-mono text-sm">
              <span className="syntax-comment">// Making internet connections simpler, safer, faster</span>
            </p>
          </div>
          
          {/* Terminal navigation links */}
          <div className="flex flex-wrap items-center justify-center gap-8 font-mono">
            <a 
              href="#features" 
              className="text-sm text-adaptive-muted hover:text-terminal-green transition-all duration-300 hover:scale-105 relative"
            >
              <span className="syntax-keyword">./</span>features
            </a>
            <a 
              href="#demo" 
              className="text-sm text-adaptive-muted hover:text-terminal-blue transition-all duration-300 hover:scale-105"
            >
              <span className="syntax-keyword">./</span>demo
            </a>
            <a 
              href="https://github.com/aiaid/2dns" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-adaptive-muted hover:text-terminal-purple transition-all duration-300 hover:scale-105"
            >
              <span className="syntax-keyword">git</span> <span className="syntax-string">clone</span>
            </a>
            <a 
              href="#" 
              className="text-sm text-adaptive-muted hover:text-terminal-orange transition-all duration-300 hover:scale-105"
            >
              <span className="syntax-comment"># {dict.privacy}</span>
            </a>
            <a 
              href="#" 
              className="text-sm text-adaptive-muted hover:text-terminal-orange transition-all duration-300 hover:scale-105"
            >
              <span className="syntax-comment"># {dict.terms}</span>
            </a>
          </div>
          
          {/* Terminal separator */}
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-terminal-green/40 to-transparent"></div>
          
          {/* Copyright info in terminal style */}
          <div className="text-center space-y-2 font-mono">
            <p className="text-sm text-adaptive-muted">
              <span className="syntax-comment">/* © 2025 {brand}. {dict.rights} */</span>
            </p>
            <p className="text-xs text-adaptive-muted">
              <span className="syntax-keyword">Built</span> <span className="syntax-string">with</span> <span className="syntax-function">❤️</span> <span className="syntax-keyword">using</span> <span className="syntax-string">Next.js</span> <span className="syntax-keyword">&</span> <span className="syntax-string">Tailwind</span>
            </p>
          </div>
          
          {/* Terminal status indicators */}
          <div className="flex items-center gap-4 opacity-70 font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-terminal-green animate-pulse"></div>
              <span className="text-terminal-green">ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-terminal-blue animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span className="text-terminal-blue">SECURE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-terminal-purple animate-pulse" style={{animationDelay: '1s'}}></div>
              <span className="text-terminal-purple">FAST</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
