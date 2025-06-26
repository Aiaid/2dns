export default function Footer({
  dict,
  brand,
}: {
  dict: any
  brand: string
}) {
  return (
    <footer className="relative border-t border-white/10 py-12 md:py-16 bg-gradient-to-t from-black/20 to-transparent">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center justify-center gap-8">
          
          {/* 品牌信息 */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-gradient">{brand}</h3>
            <p className="text-white/60 max-w-md">
              让互联网连接更简单、更安全、更高效
            </p>
          </div>
          
          {/* 链接 */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            <a 
              href="#features" 
              className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
            >
              功能特色
            </a>
            <a 
              href="#demo" 
              className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
            >
              在线演示
            </a>
            <a 
              href="https://github.com/aiaid/2dns" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
            >
              GitHub
            </a>
            <a 
              href="#" 
              className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
            >
              {dict.privacy}
            </a>
            <a 
              href="#" 
              className="text-sm text-white/70 hover:text-white transition-all duration-300 hover:scale-105"
            >
              {dict.terms}
            </a>
          </div>
          
          {/* 分隔线 */}
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* 版权信息 */}
          <div className="text-center space-y-2">
            <p className="text-sm text-white/50">
              © 2025 {brand}. {dict.rights}
            </p>
            <p className="text-xs text-white/40">
              Built with ❤️ using Next.js & Tailwind CSS
            </p>
          </div>
          
          {/* 装饰性元素 */}
          <div className="flex items-center gap-4 opacity-50">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-orange-500 animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      </div>
    </footer>
  )
}
