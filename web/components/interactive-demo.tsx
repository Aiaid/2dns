"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Copy, Terminal, Info, AlertCircle, Play, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InteractiveDemo({ dict }: { dict: any }) {
  const [ipv4Address, setIpv4Address] = useState("")
  const [ipv6Address, setIpv6Address] = useState("")
  const [format, setFormat] = useState("direct-ipv4")
  const [commandType, setCommandType] = useState("dig")
  const [dnsQuery, setDnsQuery] = useState("")
  const [expectedResponse, setExpectedResponse] = useState("")
  const [copied, setCopied] = useState(false)
  const [isValidIpv4, setIsValidIpv4] = useState(true)
  const [isValidIpv6, setIsValidIpv6] = useState(true)
  const [errorMessageIpv4, setErrorMessageIpv4] = useState("")
  const [errorMessageIpv6, setErrorMessageIpv6] = useState("")
  const [dualStackMode, setDualStackMode] = useState(false)
  const [exampleCopied, setExampleCopied] = useState<{[key: string]: boolean}>({})
  
  // DOH related states
  const [dohProvider, setDohProvider] = useState("cloudflare")
  const [customDohEndpoint, setCustomDohEndpoint] = useState("")
  const [dohResult, setDohResult] = useState("")
  const [isLoadingDoh, setIsLoadingDoh] = useState(false)
  const [exampleDohResults, setExampleDohResults] = useState<{[key: string]: string}>({})
  const [exampleDohLoading, setExampleDohLoading] = useState<{[key: string]: boolean}>({})
  
  // DOH providers configuration
  const dohProviders = {
    cloudflare: {
      name: "Cloudflare",
      endpoint: "https://cloudflare-dns.com/dns-query",
      method: "GET"
    },
    google: {
      name: "Google",
      endpoint: "https://dns.google/resolve",
      method: "GET"
    },
    custom: {
      name: "Custom",
      endpoint: "",
      method: "GET"
    }
  }

  // Validate IPv4 address
  useEffect(() => {
    if (!ipv4Address) {
      setIsValidIpv4(true)
      setErrorMessageIpv4("")
      return
    }

    // Simple IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/

    if (ipv4Regex.test(ipv4Address)) {
      // Check if each octet is valid (0-255)
      const octets = ipv4Address.split(".")
      const validOctets = octets.every(octet => {
        const num = parseInt(octet, 10)
        return num >= 0 && num <= 255
      })
      
      setIsValidIpv4(validOctets)
      if (!validOctets) {
        setErrorMessageIpv4("Invalid IPv4 address. Each octet must be between 0 and 255.")
      } else {
        setErrorMessageIpv4("")
      }
    } else {
      setIsValidIpv4(false)
      setErrorMessageIpv4("Invalid IPv4 address format.")
    }
  }, [ipv4Address])

  // Validate IPv6 address
  useEffect(() => {
    if (!ipv6Address) {
      setIsValidIpv6(true)
      setErrorMessageIpv6("")
      return
    }

    // Simple IPv6 validation
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/

    if (ipv6Regex.test(ipv6Address)) {
      setIsValidIpv6(true)
      setErrorMessageIpv6("")
    } else {
      setIsValidIpv6(false)
      setErrorMessageIpv6("Invalid IPv6 address format.")
    }
  }, [ipv6Address])

  // Update dual stack mode when both addresses are present
  useEffect(() => {
    if (ipv4Address && ipv6Address && isValidIpv4 && isValidIpv6) {
      setDualStackMode(true)
      setFormat("dual-stack")
    } else {
      setDualStackMode(false)
    }
  }, [ipv4Address, ipv6Address, isValidIpv4, isValidIpv6])

  // Generate DNS query based on IP and format
  function generateDnsQuery() {
    let query = ""
    let response = ""
    const domain = "2dns.dev"
    const domainWithDot = `${domain}.`
    const fullDomain = (suffix: string) => `${suffix}.${domain}`

    // Check if we're in dual-stack mode
    if (dualStackMode && format === "dual-stack") {
      // Use the correct Base32 encoding for dual-stack
      const ipv4Placeholder = "AEBAGBA8" // Base32 encoded IPv4 (1.2.3.4)
      const ipv6Placeholder = "EAAQ3OEFUMAAAAAARIXAG4DTGQ888888" // Base32 encoded IPv6 (2001:0db8:85a3:0000:0000:8a2e:0370:7334)
      const combinedPlaceholder = `${ipv4Placeholder}${ipv6Placeholder}`
      
      if (commandType === "dig") {
        query = `dig @${domain} ${combinedPlaceholder}.${domain} A+AAAA`
      } else {
        query = `host -t A+AAAA ${combinedPlaceholder}.${domain} ${domain}`
      }
      response = `Returns ${ipv4Address} as an A record and ${ipv6Address} as an AAAA record`
    } else if (ipv4Address && isValidIpv4 && format.includes("ipv4") || (!ipv6Address && format === "direct-ipv4")) {
      // IPv4 formats
      if (format === "direct-ipv4") {
        const queryDomain = fullDomain(ipv4Address)
        if (commandType === "dig") {
          query = `dig @${domain} ${queryDomain} A`
        } else {
          query = `host -t A ${queryDomain} ${domain}`
        }
        response = `Returns ${ipv4Address} as an A record`
      } else if (format === "base32-ipv4") {
        // For demo purposes, we'll use placeholder Base32 encoding
        const placeholder = "AEBAGBA8"
        const queryDomain = fullDomain(placeholder)
        if (commandType === "dig") {
          query = `dig @${domain} ${queryDomain} A`
        } else {
          query = `host -t A ${queryDomain} ${domain}`
        }
        response = `Returns ${ipv4Address} as an A record`
      }
    } else if (ipv6Address && isValidIpv6) {
      // IPv6 formats
      if (format === "ipv6-complete") {
        const formattedIPv6 = ipv6Address.replace(/:/g, "-")
        const queryDomain = fullDomain(formattedIPv6)
        if (commandType === "dig") {
          query = `dig @${domain} ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain} ${domain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      } else if (format === "ipv6-omit") {
        // This is a simplified version - in a real app, we'd need to properly handle zero omission
        const formattedIPv6 = ipv6Address.replace(/:/g, "-").replace(/0000/g, "0")
        const queryDomain = fullDomain(formattedIPv6)
        if (commandType === "dig") {
          query = `dig @${domain} ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain} ${domain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      } else if (format === "ipv6-z") {
        // This is a simplified version - in a real app, we'd need to properly handle zero group replacement
        const formattedIPv6 = ipv6Address.replace(/(:0000:0000:)/g, ":z:").replace(/:/g, "-")
        const queryDomain = fullDomain(formattedIPv6)
        if (commandType === "dig") {
          query = `dig @${domain} ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain} ${domain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      } else if (format === "base32-ipv6") {
        // Use the correct Base32 encoding for IPv6
        const placeholder = "EAAQ3OEFUMAAAAAARIXAG4DTGQ888888" // Base32 encoded IPv6 (2001:0db8:85a3:0000:0000:8a2e:0370:7334)
        const queryDomain = fullDomain(placeholder)
        if (commandType === "dig") {
          query = `dig @${domain} ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain} ${domain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      }
    }

    setDnsQuery(query)
    setExpectedResponse(response)
  }

  // Execute DOH query
  async function executeDohQuery(
    customIpv4 = "", 
    customIpv6 = "", 
    customFormat = "", 
    customProvider = "cloudflare", 
    exampleIndex = -1
  ) {
    // If this is for the main form
    if (exampleIndex === -1) {
      if ((!ipv4Address || !isValidIpv4) && (!ipv6Address || !isValidIpv6)) {
        return
      }
      
      setIsLoadingDoh(true)
      setDohResult("")
    } else {
      // For example execution
      setExampleDohLoading({...exampleDohLoading, [`${exampleIndex}`]: true})
      setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: ""})
    }
    
    try {
      const domain = "2dns.dev"
      let queryDomain = ""
      let queryType = ""
      
      // Use either the custom values (for examples) or the form values
      const useIpv4 = customIpv4 || ipv4Address
      const useIpv6 = customIpv6 || ipv6Address
      const useFormat = customFormat || format
      const useDualStack = customIpv4 && customIpv6 && useFormat === "dual-stack"
      
      // Determine the domain and query type based on the format
      if (useDualStack || (dualStackMode && useFormat === "dual-stack")) {
        // For dual-stack, we'll use the IPv4 query for simplicity
        queryDomain = `AEBAGBA8.${domain}`
        queryType = "A"
      } else if (useIpv4 && (useFormat.includes("ipv4") || useFormat === "direct-ipv4")) {
        if (useFormat === "direct-ipv4") {
          queryDomain = `${useIpv4}.${domain}`
        } else {
          queryDomain = `AEBAGBA8.${domain}`
        }
        queryType = "A"
      } else if (useIpv6) {
        if (useFormat === "ipv6-complete") {
          queryDomain = `${useIpv6.replace(/:/g, "-")}.${domain}`
        } else if (useFormat === "ipv6-omit") {
          queryDomain = `${useIpv6.replace(/:/g, "-").replace(/0000/g, "0")}.${domain}`
        } else if (useFormat === "ipv6-z") {
          queryDomain = `${useIpv6.replace(/(:0000:0000:)/g, ":z:").replace(/:/g, "-")}.${domain}`
        } else {
          queryDomain = `EAAQ3OEFUMAAAAAARIXAG4DTGQ888888.${domain}`
        }
        queryType = "AAAA"
      }
      
      // Get the DOH endpoint
      let endpoint = ""
      const useProvider = exampleIndex >= 0 ? customProvider : dohProvider
      
      if (useProvider === "custom") {
        endpoint = customDohEndpoint
      } else {
        endpoint = dohProviders[useProvider as keyof typeof dohProviders].endpoint
      }
      
      // Build the URL
      const url = new URL(endpoint)
      url.searchParams.append("name", queryDomain)
      url.searchParams.append("type", queryType)
      
      // Set headers
      const headers = {
        "Accept": "application/dns-json"
      }
      
      // Execute the query
      const response = await fetch(url.toString(), { headers })
      const data = await response.json()
      
      // Format and display the result
      const result = JSON.stringify(data, null, 2)
      
      if (exampleIndex === -1) {
        setDohResult(result)
      } else {
        setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: result})
      }
    } catch (error) {
      const errorMsg = `Error: ${error instanceof Error ? error.message : String(error)}`
      if (exampleIndex === -1) {
        setDohResult(errorMsg)
      } else {
        setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: errorMsg})
      }
    } finally {
      if (exampleIndex === -1) {
        setIsLoadingDoh(false)
      } else {
        setExampleDohLoading({...exampleDohLoading, [`${exampleIndex}`]: false})
      }
    }
  }

  // Copy example command to clipboard
  function copyExampleCommand(command: string, index: number) {
    navigator.clipboard.writeText(command).then(() => {
      setExampleCopied({...exampleCopied, [`${index}`]: true})
      setTimeout(() => {
        setExampleCopied({...exampleCopied, [`${index}`]: false})
      }, 2000)
    })
  }

  // Copy query to clipboard
  function copyToClipboard() {
    if (!dnsQuery) return

    navigator.clipboard.writeText(dnsQuery).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">IPv4 {dict.ipLabel}</label>
                  <Input
                    type="text"
                    placeholder="192.168.1.1"
                    value={ipv4Address}
                    onChange={(e) => setIpv4Address(e.target.value)}
                    className={!isValidIpv4 && ipv4Address ? "border-red-500" : ""}
                  />
                  
                  {!isValidIpv4 && ipv4Address && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessageIpv4}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">IPv6 {dict.ipLabel}</label>
                  <Input
                    type="text"
                    placeholder="2001:0db8:85a3:0000:0000:8a2e:0370:7334"
                    value={ipv6Address}
                    onChange={(e) => setIpv6Address(e.target.value)}
                    className={!isValidIpv6 && ipv6Address ? "border-red-500" : ""}
                  />
                  
                  {!isValidIpv6 && ipv6Address && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessageIpv6}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{dict.formatLabel}</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {(!ipv6Address || !isValidIpv6) && (
                        <SelectItem value="direct-ipv4">{dict.formats[0].name}</SelectItem>
                      )}
                      {(!ipv4Address || !isValidIpv4) && ipv6Address && isValidIpv6 && (
                        <>
                          <SelectItem value="ipv6-complete">{dict.formats[1].name}</SelectItem>
                          <SelectItem value="ipv6-omit">{dict.formats[2].name}</SelectItem>
                          <SelectItem value="ipv6-z">{dict.formats[3].name}</SelectItem>
                        </>
                      )}
                      {(!ipv6Address || !isValidIpv6) && (
                        <SelectItem value="base32-ipv4">{dict.formats[4].name}</SelectItem>
                      )}
                      {(!ipv4Address || !isValidIpv4) && (
                        <SelectItem value="base32-ipv6">{dict.formats[5].name}</SelectItem>
                      )}
                      {dualStackMode && (
                        <SelectItem value="dual-stack">{dict.formats[6].name}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{dict.commandTypeLabel}</label>
                  <Select value={commandType} onValueChange={setCommandType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select command type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dict.commandTypes.map((type: any, index: number) => (
                        <SelectItem key={index} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {commandType !== "doh" && (
                  <Button 
                    type="button" 
                    onClick={generateDnsQuery} 
                    disabled={((!ipv4Address || !isValidIpv4) && (!ipv6Address || !isValidIpv6))}
                    className="w-full"
                  >
                    {dict.generateButton}
                  </Button>
                )}
              </div>

              {commandType !== "doh" && dnsQuery && (
                <div className="rounded-md border p-4 bg-muted">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{dict.resultTitle}</p>
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
                    <pre className="overflow-x-auto rounded bg-black p-2 text-xs text-white">
                      <code>{dnsQuery}</code>
                    </pre>
                    <div>
                      <p className="text-sm font-medium">{dict.responseTitle}</p>
                      <p className="text-sm text-muted-foreground">{expectedResponse}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {commandType === "doh" && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{dict.doh.providerLabel}</label>
                    <Select value={dohProvider} onValueChange={setDohProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select DOH provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {dict.doh.providers.map((provider: any, index: number) => (
                          <SelectItem key={index} value={provider.id}>{provider.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {dohProvider === "custom" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{dict.doh.customEndpointLabel}</label>
                      <Input
                        type="text"
                        placeholder={dict.doh.customEndpointPlaceholder}
                        value={customDohEndpoint}
                        onChange={(e) => setCustomDohEndpoint(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <Button 
                    type="button" 
                    onClick={() => executeDohQuery()} 
                    disabled={((!ipv4Address || !isValidIpv4) && (!ipv6Address || !isValidIpv6)) || 
                              (dohProvider === "custom" && !customDohEndpoint)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {isLoadingDoh ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{dict.doh.loadingMessage}</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>{dict.doh.runButton}</span>
                      </>
                    )}
                  </Button>
                  
                  {dohResult && (
                    <div className="rounded-md border p-4 bg-muted">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{dict.doh.resultTitle}</p>
                        <pre className="overflow-x-auto rounded bg-black p-2 text-xs text-white">
                          <code>{dohResult}</code>
                        </pre>
                      </div>
                    </div>
                  )}
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
            </CardContent>
            <CardFooter className="flex flex-col items-start">
                <Tabs defaultValue="example1" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 overflow-x-auto">
                  {dict.examples && dict.examples.items && dict.examples.items.map((example: any, index: number) => (
                    <TabsTrigger key={index} value={`example${index + 1}`}>
                      {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {dict.examples && dict.examples.items && dict.examples.items.map((example: any, index: number) => (
                  <TabsContent key={index} value={`example${index + 1}`} className="space-y-4 pt-4">
                    <div className="rounded-md bg-muted p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="h-5 w-5" />
                        <p className="text-base font-medium">{example.format}</p>
                      </div>
                      
                      <div className="mt-4 space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">dig</p>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1" 
                              onClick={() => copyExampleCommand(example.commands.dig, index * 10 + 1)}
                            >
                              {exampleCopied[`${index * 10 + 1}`] ? (
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
                          <pre className="overflow-x-auto rounded bg-black p-3 text-sm text-white">
                            <code>{example.commands.dig}</code>
                          </pre>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">host</p>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1" 
                              onClick={() => copyExampleCommand(example.commands.host, index * 10 + 2)}
                            >
                              {exampleCopied[`${index * 10 + 2}`] ? (
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
                          <pre className="overflow-x-auto rounded bg-black p-3 text-sm text-white">
                            <code>{example.commands.host}</code>
                          </pre>
                        </div>
                        
                        {/* DoH example */}
                        <div className="space-y-3 pt-4 mt-4 border-t">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">DNS over HTTPS</p>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1" 
                              onClick={() => {
                                // Determine IP and format based on example
                                let ipv4 = "";
                                let ipv6 = "";
                                let format = "";
                                
                                if (example.format.includes("IPv4") || example.format.includes("直接IPv4")) {
                                  ipv4 = "1.2.3.4";
                                  format = "direct-ipv4";
                                } else if (example.format.includes("IPv6")) {
                                  ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
                                  if (example.format.includes("完整") || example.format.includes("Complete")) {
                                    format = "ipv6-complete";
                                  } else if (example.format.includes("省略") || example.format.includes("Omit")) {
                                    format = "ipv6-omit";
                                  } else if (example.format.includes("'z'")) {
                                    format = "ipv6-z";
                                  } else if (example.format.includes("Base32")) {
                                    format = "base32-ipv6";
                                  }
                                } else if (example.format.includes("双栈") || example.format.includes("Dual-Stack")) {
                                  ipv4 = "1.2.3.4";
                                  ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
                                  format = "dual-stack";
                                }
                                
                                // Execute the DoH query directly
                                executeDohQuery(ipv4, ipv6, format, "cloudflare", index);
                              }}
                              disabled={exampleDohLoading[`${index}`]}
                            >
                              {exampleDohLoading[`${index}`] ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                  <span>{dict.doh.loadingMessage}</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5 mr-1" />
                                  <span>{dict.doh.runButton}</span>
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="rounded bg-black p-3 text-sm text-white">
                            <p>{example.commands.doh}</p>
                          </div>
                          
                          {/* Show DoH results directly in the example */}
                          {exampleDohResults[`${index}`] && (
                            <div className="mt-4 rounded-md border p-4 bg-muted">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">{dict.doh.resultTitle}</p>
                                <pre className="overflow-x-auto rounded bg-black p-2 text-xs text-white">
                                  <code>{exampleDohResults[`${index}`]}</code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="mt-6 text-sm text-muted-foreground">{example.response}</p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}
