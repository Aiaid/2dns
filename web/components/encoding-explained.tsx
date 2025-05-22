'use client'
import { Code } from "lucide-react"
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

export default function EncodingExplained({ dict }: { dict: any }) {
  return (
    <section id="encoding-explained" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{dict.title}</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl">{dict.subtitle}</p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl flex flex-col gap-8">
          {/* Base32 Encoding Explanation */}
          <div className="w-full mb-12">
            <h3 className="text-2xl font-bold mb-4">{dict.base32Title}</h3>
            <p className="text-muted-foreground mb-6">{dict.base32Description}</p>
            
            {/* IPv4 Encoding */}
            <div className="mb-8 bg-background rounded-lg p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-3 flex items-center">
                <span className="bg-primary text-primary-foreground p-1 rounded-md mr-2">IPv4</span>
                {dict.ipv4Title}
              </h4>
              <p className="mb-4">{dict.ipv4Description}</p>
              <div className="bg-muted p-4 rounded-md mb-4">
                <code className="text-sm">{dict.ipv4Example}</code>
              </div>
            </div>
            
            {/* IPv6 Encoding */}
            <div className="mb-8 bg-background rounded-lg p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-3 flex items-center">
                <span className="bg-primary text-primary-foreground p-1 rounded-md mr-2">IPv6</span>
                {dict.ipv6Title}
              </h4>
              <p className="mb-4">{dict.ipv6Description}</p>
              <div className="bg-muted p-4 rounded-md mb-4">
                <code className="text-sm">{dict.ipv6Example}</code>
              </div>
            </div>
            
            {/* Dual Stack Encoding */}
            <div className="mb-8 bg-background rounded-lg p-6 shadow-sm">
              <h4 className="text-xl font-semibold mb-3 flex items-center">
                <span className="bg-primary text-primary-foreground p-1 rounded-md mr-2">{dict.dualStackLabel}</span>
                {dict.dualStackTitle}
              </h4>
              <p className="mb-4">{dict.dualStackDescription}</p>
              <div className="bg-muted p-4 rounded-md mb-4">
                <code className="text-sm">{dict.dualStackExample}</code>
              </div>
            </div>
          </div>

          {/* Code Examples */}
          <div className="w-full">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <Code className="h-6 w-6 mr-2" />
              {dict.codeExamplesTitle}
            </h3>
            
            <Tabs defaultValue="python" className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
                <TabsTrigger value="java">Java</TabsTrigger>
              </TabsList>
              
              {/* Python Example */}
              <TabsContent value="python" className="bg-background rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3">Python</h4>
                <ScrollArea className="max-h-[400px] overflow-auto">
                  <CodeHighlighter code={dict.pythonExample} language="python" />
                </ScrollArea>
              </TabsContent>
              
              {/* JavaScript Example */}
              <TabsContent value="javascript" className="bg-background rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3">JavaScript</h4>
                <ScrollArea className="max-h-[400px] overflow-auto">
                  <CodeHighlighter code={dict.javascriptExample} language="javascript" />
                </ScrollArea>
              </TabsContent>
              
              {/* TypeScript Example */}
              <TabsContent value="typescript" className="bg-background rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3">TypeScript</h4>
                <ScrollArea className="max-h-[400px] overflow-auto">
                  <CodeHighlighter code={dict.typescriptExample} language="typescript" />
                </ScrollArea>
              </TabsContent>
              
              {/* Go Example */}
              <TabsContent value="go" className="bg-background rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3">Go</h4>
                <ScrollArea className="max-h-[400px] overflow-auto">
                  <CodeHighlighter code={dict.goExample} language="go" />
                </ScrollArea>
              </TabsContent>
              
              {/* Java Example */}
              <TabsContent value="java" className="bg-background rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-3">Java</h4>
                <ScrollArea className="max-h-[400px] overflow-auto">
                  <CodeHighlighter code={dict.javaExample} language="java" />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  )
}
