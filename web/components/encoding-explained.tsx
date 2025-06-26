'use client'
import { Code, Zap, Globe, Layers } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeHighlighter } from "@/components/ui/code-highlighter"
import { ScrollArea } from "@/components/ui/scroll-area"

const ipv4Diagram = `
flowchart LR
    A[Input IPv4 Address] --> B[Convert to 32-bit binary]
    B --> C[Split into 5-bit groups]
    C --> D[Map to Base32 characters]
    D --> E[Output Base32 string]
`;

const ipv6Diagram = `
flowchart LR
    A[Input IPv6 Address] --> B[Convert to 128-bit binary]
    B --> C[Split into 5-bit groups]
    C --> D[Map to Base32 characters]
    D --> E[Output Base32 string]
`;

const dualStackDiagram = `
flowchart LR
    A1[IPv4 Address] --> B1[IPv4 Base32 Encoding]
    A2[IPv6 Address] --> B2[IPv6 Base32 Encoding]
    B1 --> C[Merge Encoded Strings]
    B2 --> C
    C --> D[Output Dual Stack Base32 string]
`;

// IPv4编码示例组件
function IPv4EncodingExample() {
  return (
    <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-600/30">
      <div className="flex items-center mb-5">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
          <span className="text-white font-bold text-sm">📦</span>
        </div>
        <h3 className="text-xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
          转换示例：1.2.3.4 → AEBAGBA8
        </h3>
      </div>
      
      <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-5 border border-white/50 dark:border-gray-600/30">
        <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <span className="mr-2">🔄</span>编码流程
        </h4>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <span className="font-semibold text-green-600 dark:text-green-400 mr-2 min-w-6">1.</span>
            <span className="text-gray-800 dark:text-gray-200 mr-2">IP地址转字节：</span>
            <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50">
              [1, 2, 3, 4]
            </code>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <span className="font-semibold text-blue-600 dark:text-blue-400 mr-2 min-w-6">2.</span>
            <span className="text-gray-800 dark:text-gray-200 mr-2">Base32编码：</span>
            <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50">
              "AEBAGBAA"
            </code>
          </div>
          
          <div className="flex items-center p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
            <span className="font-semibold text-purple-600 dark:text-purple-400 mr-2 min-w-6">3.</span>
            <span className="text-gray-800 dark:text-gray-200 mr-2">替换填充符：</span>
            <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50">
              "AEBAGBA8"
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

// IPv6编码示例组件
function IPv6EncodingExample() {
  return (
    <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/30 dark:border-purple-600/30">
      <div className="flex items-center mb-5">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
          <span className="text-white font-bold text-sm">🌐</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
            转换示例
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <div>2001:0db8:85a3::8a2e:0370:7334</div>
            <div className="text-center text-xs">↓</div>
            <div className="font-mono text-xs break-all">EAAQ3OEFUMAAAAAARIXAG4DTGQ888888</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-5 border border-white/50 dark:border-gray-600/30">
        <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <span className="mr-2">🔄</span>编码流程
        </h4>
        <div className="space-y-3">
          <div className="flex flex-col p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
            <div className="flex items-start">
              <span className="font-semibold text-green-600 dark:text-green-400 mr-2 min-w-6">1.</span>
              <div className="flex-1">
                <span className="text-gray-800 dark:text-gray-200 block mb-1">IPv6地址转字节：</span>
                <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-2 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50 text-xs break-all block">
                  [32, 1, 13, 184, 133, 163, 0, 0, 0, 0, 138, 46, 3, 112, 115, 52]
                </code>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start">
              <span className="font-semibold text-blue-600 dark:text-blue-400 mr-2 min-w-6">2.</span>
              <div className="flex-1">
                <span className="text-gray-800 dark:text-gray-200 block mb-1">Base32编码：</span>
                <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-2 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50 text-xs break-all block">
                  "EAAQ3OEFUMAAAAAARIXAG4DTGQ======"
                </code>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-start">
              <span className="font-semibold text-purple-600 dark:text-purple-400 mr-2 min-w-6">3.</span>
              <div className="flex-1">
                <span className="text-gray-800 dark:text-gray-200 block mb-1">替换填充符：</span>
                <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-2 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50 text-xs break-all block">
                  "EAAQ3OEFUMAAAAAARIXAG4DTGQ888888"
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 双栈编码示例组件
function DualStackEncodingExample() {
  return (
    <div className="bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200/30 dark:border-orange-600/30">
      <div className="flex items-center mb-5">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
          <span className="text-white font-bold text-sm">🔗</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gradient bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">
            双栈编码示例
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            IPv4: 1.2.3.4 + IPv6: 2001:0db8:85a3::8a2e:0370:7334
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* 编码流程 */}
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-5 border border-white/50 dark:border-gray-600/30">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">🔄</span>编码流程
          </h4>
          <div className="space-y-2">
            <div className="flex items-center p-2 bg-green-50/80 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <span className="font-semibold text-green-600 dark:text-green-400 mr-2 min-w-6">1.</span>
              <span className="text-gray-800 dark:text-gray-200 mr-2">IPv4转字节：</span>
              <code className="bg-gray-100/80 dark:bg-gray-700/80 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-medium text-sm">
                [1, 2, 3, 4]
              </code>
            </div>
            
            <div className="flex items-center p-2 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <span className="font-semibold text-blue-600 dark:text-blue-400 mr-2 min-w-6">2.</span>
              <span className="text-gray-800 dark:text-gray-200 mr-2">IPv4编码：</span>
              <code className="bg-gray-100/80 dark:bg-gray-700/80 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-medium text-sm">
                "AEBAGBA8"
              </code>
            </div>
            
            <div className="flex flex-col p-2 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-start">
                <span className="font-semibold text-purple-600 dark:text-purple-400 mr-2 min-w-6">3.</span>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-gray-200 block mb-1">IPv6转字节：</span>
                  <code className="bg-gray-100/80 dark:bg-gray-700/80 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-medium text-xs break-all block">
                    [32, 1, 13, 184, 133, 163, 0, 0, 0, 0, 138, 46, 3, 112, 115, 52]
                  </code>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col p-2 bg-pink-50/80 dark:bg-pink-900/20 rounded-lg border-l-4 border-pink-500">
              <div className="flex items-start">
                <span className="font-semibold text-pink-600 dark:text-pink-400 mr-2 min-w-6">4.</span>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-gray-200 block mb-1">IPv6编码：</span>
                  <code className="bg-gray-100/80 dark:bg-gray-700/80 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-medium text-xs break-all block">
                    "EAAQ3OEFUMAAAAAARIXAG4DTGQ888888"
                  </code>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col p-3 bg-yellow-50/80 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500 border-2 border-yellow-200/50 dark:border-yellow-600/50">
              <div className="flex items-start">
                <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2 min-w-6">5.</span>
                <div className="flex-1">
                  <span className="text-gray-800 dark:text-gray-200 block mb-1 font-semibold">🎯 组合结果：</span>
                  <code className="bg-yellow-100/80 dark:bg-yellow-800/60 px-3 py-2 rounded text-yellow-800 dark:text-yellow-200 font-semibold text-xs break-all block border border-yellow-300/50 dark:border-yellow-600/50">
                    "AEBAGBA8EAAQ3OEFUMAAAAAARIXAG4DTGQ888888"
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 查询结果 */}
        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-5 border border-white/50 dark:border-gray-600/30">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">📊</span>查询结果
          </h4>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-green-50/80 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <span className="font-semibold text-green-600 dark:text-green-400 mr-3 min-w-20">A 记录</span>
              <span className="text-gray-800 dark:text-gray-200 mr-2">返回：</span>
              <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1 rounded text-gray-800 dark:text-gray-200 font-medium border border-gray-200/50 dark:border-gray-600/50">
                1.2.3.4
              </code>
            </div>
            
            <div className="flex items-center p-3 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
              <span className="font-semibold text-purple-600 dark:text-purple-400 mr-3 min-w-20">AAAA 记录</span>
              <span className="text-gray-800 dark:text-gray-200 mr-2">返回：</span>
              <code className="bg-gray-100/80 dark:bg-gray-700/80 px-3 py-1 rounded text-gray-800 dark:text-gray-200 font-medium text-sm border border-gray-200/50 dark:border-gray-600/50">
                2001:0db8:85a3::8a2e:0370:7334
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EncodingExplained({ dict }: { dict: any }) {
  return (
    <section id="encoding-explained" className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10 filter blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center fade-in">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/20 dark:border-blue-400/30 mb-4">
              <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">编码详解</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text">{dict.title}</h2>
            <p className="max-w-[900px] text-gray-700 dark:text-muted-foreground md:text-xl opacity-80">{dict.subtitle}</p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl flex flex-col gap-8">
          {/* Base32 编码说明 */}
          <div className="w-full mb-12 slide-in-left">
            <div className="card-modern p-8 bg-white/80 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">{dict.base32Title}</span>
              </h3>
              <p className="text-gray-700 dark:text-muted-foreground mb-6 leading-relaxed">{dict.base32Description}</p>
            </div>
          </div>
          
          {/* IPv4 编码 */}
          <div className="mb-8 slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="card-modern p-8 bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/40 dark:border-gray-600/40 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">IPv4</span>
                </div>
                <span className="text-gradient bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text">{dict.ipv4Title}</span>
              </h4>
              <p className="mb-4 text-gray-700 dark:text-muted-foreground leading-relaxed">{dict.ipv4Description}</p>
              <IPv4EncodingExample />
            </div>
          </div>
          
          {/* IPv6 编码 */}
          <div className="mb-8 slide-in-left" style={{ animationDelay: '0.4s' }}>
            <div className="card-modern p-8 bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/40 dark:border-gray-600/40 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-bold">IPv6</span>
                </div>
                <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">{dict.ipv6Title}</span>
              </h4>
              <p className="mb-4 text-gray-700 dark:text-muted-foreground leading-relaxed">{dict.ipv6Description}</p>
              <IPv6EncodingExample />
            </div>
          </div>
          
          {/* 双栈编码 */}
          <div className="mb-8 slide-in-right" style={{ animationDelay: '0.6s' }}>
            <div className="card-modern p-8 bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/40 dark:border-gray-600/40 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-3">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <span className="text-gradient bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">{dict.dualStackTitle}</span>
              </h4>
              <p className="mb-4 text-gray-700 dark:text-muted-foreground leading-relaxed">{dict.dualStackDescription}</p>
              <DualStackEncodingExample />
            </div>
          </div>

          {/* 代码示例 */}
          <div className="w-full fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="card-modern p-8 bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/40 dark:border-gray-600/40 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mr-3">
                  <Code className="h-4 w-4 text-white" />
                </div>
                <span className="text-gradient bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text">{dict.codeExamplesTitle}</span>
              </h3>
              
              <Tabs defaultValue="python" className="w-full">
                <TabsList className="grid grid-cols-5 mb-6 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-300/40 dark:border-gray-600/40">
                  <TabsTrigger value="python" className="data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-600/80 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200">Python</TabsTrigger>
                  <TabsTrigger value="javascript" className="data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-600/80 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200">JavaScript</TabsTrigger>
                  <TabsTrigger value="typescript" className="data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-600/80 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200">TypeScript</TabsTrigger>
                  <TabsTrigger value="go" className="data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-600/80 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200">Go</TabsTrigger>
                  <TabsTrigger value="java" className="data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-600/80 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200">Java</TabsTrigger>
                </TabsList>
                
                {/* Python 示例 */}
                <TabsContent value="python" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-inner">
                  <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-blue-400" />
                    Python
                  </h4>
                  <ScrollArea className="max-h-[400px] overflow-auto">
                    <CodeHighlighter code={dict.pythonExample} language="python" />
                  </ScrollArea>
                </TabsContent>
                
                {/* JavaScript 示例 */}
                <TabsContent value="javascript" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-inner">
                  <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-yellow-400" />
                    JavaScript
                  </h4>
                  <ScrollArea className="max-h-[400px] overflow-auto">
                    <CodeHighlighter code={dict.javascriptExample} language="javascript" />
                  </ScrollArea>
                </TabsContent>
                
                {/* TypeScript 示例 */}
                <TabsContent value="typescript" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-inner">
                  <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-blue-500" />
                    TypeScript
                  </h4>
                  <ScrollArea className="max-h-[400px] overflow-auto">
                    <CodeHighlighter code={dict.typescriptExample} language="typescript" />
                  </ScrollArea>
                </TabsContent>
                
                {/* Go 示例 */}
                <TabsContent value="go" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-inner">
                  <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-cyan-400" />
                    Go
                  </h4>
                  <ScrollArea className="max-h-[400px] overflow-auto">
                    <CodeHighlighter code={dict.goExample} language="go" />
                  </ScrollArea>
                </TabsContent>
                
                {/* Java 示例 */}
                <TabsContent value="java" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-inner">
                  <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-orange-400" />
                    Java
                  </h4>
                  <ScrollArea className="max-h-[400px] overflow-auto">
                    <CodeHighlighter code={dict.javaExample} language="java" />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
