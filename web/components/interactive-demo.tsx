"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Copy, Terminal } from "lucide-react"

export default function InteractiveDemo({ dict }: { dict: any }) {
  const [ipAddress, setIpAddress] = useState("")
  const [dnsName, setDnsName] = useState("")
  const [copied, setCopied] = useState(false)

  // Simple synchronous function to generate DNS name
  function generateDnsName() {
    if (!ipAddress) return

    // Simple transformation of IP to DNS name
    const ipParts = ipAddress.split(".")
    if (ipParts.length === 4) {
      // IPv4
      const encoded = ipParts.join(".")
      setDnsName(`${encoded}.dns.example.com`)
    } else {
      // IPv6 or invalid format
      setDnsName(`${ipAddress.replace(/:/g, "-")}.dns.example.com`)
    }
  }

  // Simple synchronous function to copy to clipboard
  function copyToClipboard() {
    if (!dnsName) return

    // Use document.execCommand which is synchronous
    const textArea = document.createElement("textarea")
    textArea.value = dnsName
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-background text-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">{dict.title}</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl">{dict.subtitle}</p>
          </div>
          <p className="max-w-[600px] text-muted-foreground">{dict.description}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{dict.ipLabel}</CardTitle>
              <CardDescription>{dict.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={dict.ipPlaceholder}
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
                <Button type="button" onClick={generateDnsName}>
                  {dict.generateButton}
                </Button>
              </div>

              {dnsName && (
                <div className="rounded-md border p-4 bg-muted">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{dict.resultTitle}</p>
                      <p className="font-mono text-sm">{dnsName}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={copyToClipboard}>
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>{dict.copiedMessage}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{dict.copyButton}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.instructions.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dict.instructions.steps.map((step: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-md bg-muted p-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <p className="text-sm font-medium">Example Command</p>
                </div>
                <pre className="mt-2 overflow-x-auto rounded bg-black p-2 text-xs text-white">
                  <code>curl -X GET https://your-dns-name.dns.example.com/.well-known/acme-challenge/token</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
