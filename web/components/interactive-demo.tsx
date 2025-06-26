"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Copy, Terminal, Info, AlertCircle, Play, Loader2, Zap, Globe, Network } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Base32 encoding utility functions
function ipv4ToBytes(ip: string): Uint8Array {
  const parts = ip.split('.');
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    bytes[i] = parseInt(parts[i], 10);
  }
  return bytes;
}

function ipv6ToBytes(ip: string): Uint8Array {
  // Normalize IPv6 address (handle abbreviated forms)
  const fullAddress = normalizeIPv6(ip);
  const bytes = new Uint8Array(16);
  
  // Convert each 16-bit group to two bytes
  const groups = fullAddress.split(':');
  for (let i = 0; i < 8; i++) {
    const value = parseInt(groups[i], 16);
    bytes[i * 2] = (value >> 8) & 0xff;
    bytes[i * 2 + 1] = value & 0xff;
  }
  
  return bytes;
}

function normalizeIPv6(ip: string): string {
  // Handle :: abbreviation
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(missing).fill('0000');
    
    const combined = [...left, ...middle, ...right];
    return combined.map(part => part.padStart(4, '0')).join(':');
  }
  
  // Handle case without ::, just ensure each part is 4 digits
  return ip.split(':').map(part => part.padStart(4, '0')).join(':');
}

function base32Encode(bytes: Uint8Array): string {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    
    while (bits >= 5) {
      bits -= 5;
      result += ALPHABET[(value >> bits) & 0x1f];
    }
  }
  
  // Handle remaining bits
  if (bits > 0) {
    result += ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  
  // Add padding
  while (result.length % 8 !== 0) {
    result += '=';
  }
  
  // Replace padding character '=' with '8' to match Go implementation
  return result.replace(/=/g, '8');
}

function ipv4ToBase32(ip: string): string {
  const bytes = ipv4ToBytes(ip);
  return base32Encode(bytes);
}

function ipv6ToBase32(ip: string): string {
  const bytes = ipv6ToBytes(ip);
  return base32Encode(bytes);
}

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
  const [dohUrl, setDohUrl] = useState("")
  const [dohUrlCopied, setDohUrlCopied] = useState(false)
  const [exampleDohUrls, setExampleDohUrls] = useState<{[key: string]: string}>({})
  const [exampleDohUrlCopied, setExampleDohUrlCopied] = useState<{[key: string]: boolean}>({})
  
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

  // Clear results when command type changes
  useEffect(() => {
    if (commandType === "doh") {
      // When switching to DOH, clear dig/host results
      setDnsQuery("")
      setExpectedResponse("")
    } else {
      // When switching from DOH to dig/host, clear DOH results
      setDohResult("")
      setDohUrl("")
      setIsLoadingDoh(false)
    }
  }, [commandType])

  // Generate DNS query based on IP and format
  function generateDnsQuery() {
    // If DOH is selected, execute the DOH query instead of generating command
    if (commandType === "doh") {
      executeDohQuery()
      return
    }

    let query = ""
    let response = ""
    const domain = "2dns.dev"
    const domainWithDot = `${domain}.`
    const fullDomain = (suffix: string) => `${suffix}.${domain}`

    // Check if we're in dual-stack mode
    if (dualStackMode && format === "dual-stack") {
      // Use real Base32 encoding for dual-stack
      const ipv4Base32 = ipv4ToBase32(ipv4Address);
      const ipv6Base32 = ipv6ToBase32(ipv6Address);
      const combinedBase32 = `${ipv4Base32}${ipv6Base32}`;
      
      if (commandType === "dig") {
        query = `dig ${combinedBase32}.${domain} A+AAAA`
      } else {
        query = `host -t A+AAAA ${combinedBase32}.${domain}`
      }
      response = `Returns ${ipv4Address} as an A record and ${ipv6Address} as an AAAA record`
    } else if (ipv4Address && isValidIpv4 && format.includes("ipv4") || (!ipv6Address && format === "direct-ipv4")) {
      // IPv4 formats
      if (format === "direct-ipv4") {
        const queryDomain = fullDomain(ipv4Address)
        if (commandType === "dig") {
          query = `dig ${queryDomain} A`
        } else {
          query = `host -t A ${queryDomain}`
        }
        response = `Returns ${ipv4Address} as an A record`
      } else if (format === "base32-ipv4") {
        // Use real Base32 encoding for IPv4
        const base32Encoded = ipv4ToBase32(ipv4Address);
        const queryDomain = fullDomain(base32Encoded)
        if (commandType === "dig") {
          query = `dig ${queryDomain} A`
        } else {
          query = `host -t A ${queryDomain}`
        }
        response = `Returns ${ipv4Address} as an A record`
      }
    } else if (ipv6Address && isValidIpv6) {
      // IPv6 formats
      if (format === "ipv6-complete") {
        const formattedIPv6 = ipv6Address.replace(/:/g, "-")
        const queryDomain = fullDomain(formattedIPv6)
        if (commandType === "dig") {
          query = `dig ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      } else if (format === "ipv6-omit") {
        // This is a simplified version - in a real app, we'd need to properly handle zero omission
        const formattedIPv6 = ipv6Address.replace(/:/g, "-").replace(/0000/g, "0")
        const queryDomain = fullDomain(formattedIPv6)
        if (commandType === "dig") {
          query = `dig ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      } else if (format === "ipv6-z") {
        // This is a simplified version - in a real app, we'd need to properly handle zero group replacement
        const formattedIPv6 = ipv6Address.replace(/(:0000:0000:)/g, ":z:").replace(/:/g, "-")
        const queryDomain = fullDomain(formattedIPv6)
        if (commandType === "dig") {
          query = `dig ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain}`
        }
        response = `Returns ${ipv6Address} as an AAAA record`
      } else if (format === "base32-ipv6") {
        // Use real Base32 encoding for IPv6
        const base32Encoded = ipv6ToBase32(ipv6Address);
        const queryDomain = fullDomain(base32Encoded)
        if (commandType === "dig") {
          query = `dig ${queryDomain} AAAA`
        } else {
          query = `host -t AAAA ${queryDomain}`
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
      
      // Get the DOH endpoint
      let endpoint = ""
      const useProvider = exampleIndex >= 0 ? customProvider : dohProvider
      
      if (useProvider === "custom") {
        if (exampleIndex >= 0) {
          // For examples, use the example-specific custom endpoint
          // @ts-ignore - We're using this object to store custom endpoints too
          endpoint = exampleDohLoading[`custom-endpoint-${exampleIndex}`] as string || ""
          
          // If no custom endpoint is provided for the example, show an error
          if (!endpoint) {
            const errorMsg = "Error: Custom endpoint URL is required"
            setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: errorMsg})
            setExampleDohLoading({...exampleDohLoading, [`${exampleIndex}`]: false})
            return
          }
        } else {
          // For the main form, use the main custom endpoint
          endpoint = customDohEndpoint
        }
      } else {
        endpoint = dohProviders[useProvider as keyof typeof dohProviders].endpoint
      }
      
      // Set headers
      const headers = {
        "Accept": "application/dns-json"
      }
      
      // Special handling for dual-stack mode
      if (useDualStack || (dualStackMode && useFormat === "dual-stack")) {
        // For dual-stack, we need to make both A and AAAA queries and combine results
        const ipv4Base32 = ipv4ToBase32(useIpv4);
        const ipv6Base32 = ipv6ToBase32(useIpv6);
        const queryDomain = `${ipv4Base32}${ipv6Base32}.${domain}`;
        
        // First query for A record
        const urlA = new URL(endpoint)
        urlA.searchParams.append("name", queryDomain)
        urlA.searchParams.append("type", "A")
        
        // Second query for AAAA record
        const urlAAAA = new URL(endpoint)
        urlAAAA.searchParams.append("name", queryDomain)
        urlAAAA.searchParams.append("type", "AAAA")
        
        // Execute both queries
        const [responseA, responseAAAA] = await Promise.all([
          fetch(urlA.toString(), { headers }),
          fetch(urlAAAA.toString(), { headers })
        ])
        
        // Check if both responses are successful
        if (!responseA.ok || !responseAAAA.ok) {
          const errorMsg = `Error: One or both queries failed. A: ${responseA.status}, AAAA: ${responseAAAA.status}`
          if (exampleIndex === -1) {
            setDohResult(errorMsg)
          } else {
            setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: errorMsg})
          }
          return
        }
        
        const dataA = await responseA.json()
        const dataAAAA = await responseAAAA.json()
        
        // Combine the results with more detailed structure
        const combinedResult = {
          Status: 0,
          TC: false,
          RD: true,
          RA: true,
          AD: false,
          CD: false,
          Question: [
            ...dataA.Question || [],
            ...dataAAAA.Question || []
          ],
          Answer: [
            ...(dataA.Answer || []).map((answer: any) => ({ ...answer, type: "A" })),
            ...(dataAAAA.Answer || []).map((answer: any) => ({ ...answer, type: "AAAA" }))
          ],
          IPv4: dataA.Answer && dataA.Answer.length > 0 ? dataA.Answer[0].data : null,
          IPv6: dataAAAA.Answer && dataAAAA.Answer.length > 0 ? dataAAAA.Answer[0].data : null
        }
        
        // Format and display the combined result
        const result = JSON.stringify(combinedResult, null, 2)
        
        if (exampleIndex === -1) {
          setDohResult(result)
        } else {
          setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: result})
        }
      } else {
        // Handle non-dual-stack queries as before
        if (useIpv4 && (useFormat.includes("ipv4") || useFormat === "direct-ipv4")) {
          if (useFormat === "direct-ipv4") {
            queryDomain = `${useIpv4}.${domain}`
          } else if (useFormat === "base32-ipv4") {
            queryDomain = `${ipv4ToBase32(useIpv4)}.${domain}`
          } else {
            queryDomain = `${useIpv4}.${domain}`
          }
          queryType = "A"
        } else if (useIpv6) {
          if (useFormat === "ipv6-complete") {
            queryDomain = `${useIpv6.replace(/:/g, "-")}.${domain}`
          } else if (useFormat === "ipv6-omit") {
            queryDomain = `${useIpv6.replace(/:/g, "-").replace(/0000/g, "0")}.${domain}`
          } else if (useFormat === "ipv6-z") {
            queryDomain = `${useIpv6.replace(/(:0000:0000:)/g, ":z:").replace(/:/g, "-")}.${domain}`
          } else if (useFormat === "base32-ipv6") {
            queryDomain = `${ipv6ToBase32(useIpv6)}.${domain}`
          }
          queryType = "AAAA"
        }
        
      // Build the URL
      const url = new URL(endpoint)
      url.searchParams.append("name", queryDomain)
      url.searchParams.append("type", queryType)
      
      // Store the URL for display and copying
      const urlString = url.toString()
      if (exampleIndex === -1) {
        setDohUrl(urlString)
      } else {
        setExampleDohUrls({...exampleDohUrls, [`${exampleIndex}`]: urlString})
      }
      
      // Execute the query
      const response = await fetch(urlString, { headers })
      const data = await response.json()
      
      // Format and display the result
      const result = JSON.stringify(data, null, 2)
      
      if (exampleIndex === -1) {
        setDohResult(result)
      } else {
        setExampleDohResults({...exampleDohResults, [`${exampleIndex}`]: result})
      }
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
    if (!navigator.clipboard) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setExampleCopied({...exampleCopied, [`${index}`]: true})
      setTimeout(() => {
        setExampleCopied({...exampleCopied, [`${index}`]: false})
      }, 2000)
      return;
    }

    navigator.clipboard.writeText(command).then(() => {
      setExampleCopied({...exampleCopied, [`${index}`]: true})
      setTimeout(() => {
        setExampleCopied({...exampleCopied, [`${index}`]: false})
      }, 2000)
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setExampleCopied({...exampleCopied, [`${index}`]: true})
      setTimeout(() => {
        setExampleCopied({...exampleCopied, [`${index}`]: false})
      }, 2000)
    })
  }

  // Copy query to clipboard
  function copyToClipboard() {
    if (!dnsQuery) return

    if (!navigator.clipboard) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = dnsQuery;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    navigator.clipboard.writeText(dnsQuery).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = dnsQuery;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })
  }
  
  // Copy DOH URL to clipboard
  function copyDohUrl(url: string, isExample: boolean = false, exampleIndex: number = -1) {
    if (!url) return
    
    if (!navigator.clipboard) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (isExample) {
        setExampleDohUrlCopied({...exampleDohUrlCopied, [`${exampleIndex}`]: true})
        setTimeout(() => {
          setExampleDohUrlCopied({...exampleDohUrlCopied, [`${exampleIndex}`]: false})
        }, 2000)
      } else {
        setDohUrlCopied(true)
        setTimeout(() => setDohUrlCopied(false), 2000)
      }
      return;
    }
    
    navigator.clipboard.writeText(url).then(() => {
      if (isExample) {
        setExampleDohUrlCopied({...exampleDohUrlCopied, [`${exampleIndex}`]: true})
        setTimeout(() => {
          setExampleDohUrlCopied({...exampleDohUrlCopied, [`${exampleIndex}`]: false})
        }, 2000)
      } else {
        setDohUrlCopied(true)
        setTimeout(() => setDohUrlCopied(false), 2000)
      }
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (isExample) {
        setExampleDohUrlCopied({...exampleDohUrlCopied, [`${exampleIndex}`]: true})
        setTimeout(() => {
          setExampleDohUrlCopied({...exampleDohUrlCopied, [`${exampleIndex}`]: false})
        }, 2000)
      } else {
        setDohUrlCopied(true)
        setTimeout(() => setDohUrlCopied(false), 2000)
      }
    })
  }

  return (
    <section id="demo" className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 filter blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center fade-in mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200/20 mb-4">
              <Network className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">实时演示</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gradient bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text">{dict.title}</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl opacity-80">{dict.subtitle}</p>
            <p className="max-w-[700px] text-muted-foreground">{dict.description}</p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-8">
          {/* 主要演示卡片 */}
          <div className="slide-in-left">
            <Card className="card-modern bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Terminal className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gradient bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text">DNS 查询生成器</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  输入IP地址并选择格式来生成DNS查询命令
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* IPv4地址输入 */}
                <div className="space-y-2 slide-in-right" style={{ animationDelay: '0.2s' }}>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-white text-xs">4</span>
                    </div>
                    IPv4 地址
                  </label>
                  <Input
                    type="text"
                    placeholder={dict.ipPlaceholder || "Enter IPv4 address"}
                    value={ipv4Address}
                    onChange={(e) => setIpv4Address(e.target.value)}
                    className="input-modern bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm"
                  />
                  {!isValidIpv4 && ipv4Address && (
                    <Alert className="bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-600 dark:text-red-400">
                        {errorMessageIpv4}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* IPv6地址输入 */}
                <div className="space-y-2 slide-in-left" style={{ animationDelay: '0.4s' }}>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xs">6</span>
                    </div>
                    IPv6 地址
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter IPv6 address"
                    value={ipv6Address}
                    onChange={(e) => setIpv6Address(e.target.value)}
                    className="input-modern bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm"
                  />
                  {!isValidIpv6 && ipv6Address && (
                    <Alert className="bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-600 dark:text-red-400">
                        {errorMessageIpv6}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 双栈模式切换 */}
                <div className="flex items-center space-x-2 slide-in-right" style={{ animationDelay: '0.6s' }}>
                  <input
                    type="checkbox"
                    id="dual-stack"
                    checked={dualStackMode}
                    onChange={(e) => setDualStackMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="dual-stack" className="text-sm font-medium flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Zap className="h-2 w-2 text-white" />
                    </div>
                    启用双栈模式 (IPv4 + IPv6)
                  </label>
                </div>

                {/* 格式选择 */}
                <div className="space-y-2 slide-in-left" style={{ animationDelay: '0.8s' }}>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    {dict.formatLabel}
                  </label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/30 dark:border-gray-700/30">
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

                {/* 命令类型选择 */}
                <div className="space-y-2 slide-in-right" style={{ animationDelay: '1.0s' }}>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    {dict.commandTypeLabel}
                  </label>
                  <Tabs value={commandType} onValueChange={setCommandType} className="w-full">
                    <TabsList className="grid grid-cols-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
                      <TabsTrigger value="dig" className="data-[state=active]:bg-white/80 data-[state=active]:text-blue-600">dig</TabsTrigger>
                      <TabsTrigger value="host" className="data-[state=active]:bg-white/80 data-[state=active]:text-blue-600">host</TabsTrigger>
                      <TabsTrigger value="doh" className="data-[state=active]:bg-white/80 data-[state=active]:text-blue-600">DOH</TabsTrigger>
                    </TabsList>

                    {/* DOH选项卡内容 */}
                    <TabsContent value="doh" className="space-y-4 mt-4">
                      <div className="card-modern p-4 bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Globe className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gradient bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text">{dict.doh.title}</span>
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">{dict.doh.providerLabel}</label>
                            <Select value={dohProvider} onValueChange={setDohProvider}>
                              <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                                {dict.doh.providers.map((provider: any) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {dohProvider === "custom" && (
                            <div>
                              <label className="text-sm font-medium">{dict.doh.customEndpointLabel}</label>
                              <Input
                                placeholder={dict.doh.customEndpointPlaceholder}
                                value={customDohEndpoint}
                                onChange={(e) => setCustomDohEndpoint(e.target.value)}
                                className="input-modern bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* 生成按钮 */}
                <Button 
                  onClick={generateDnsQuery} 
                  className="btn-gradient w-full py-3 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={(!ipv4Address && !ipv6Address) || (!isValidIpv4 && !isValidIpv6) || (commandType === "doh" && isLoadingDoh)}
                >
                  {isLoadingDoh && commandType === "doh" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 mr-2 border-b-2 border-white"></div>
                      {dict.doh?.loadingMessage || "执行查询中..."}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {commandType === "doh" ? (dict.doh?.runButton || "执行DOH查询") : dict.generateButton}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 结果显示卡片 */}
          {dnsQuery && (
            <div className="slide-in-right" style={{ animationDelay: '0.2s' }}>
              <Card className="card-modern bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gradient bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">{dict.resultTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700/50 shadow-inner">
                    <code className="text-green-400 text-sm font-mono break-all">{dnsQuery}</code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="w-full bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/30"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? dict.copiedMessage : dict.copyButton}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 预期响应卡片 */}
          {expectedResponse && (
            <div className="slide-in-left" style={{ animationDelay: '0.4s' }}>
              <Card className="card-modern bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gradient bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text">{dict.responseTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">{expectedResponse}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DOH查询结果 */}
          {commandType === "doh" && dohResult && (
            <div className="slide-in-right" style={{ animationDelay: '0.6s' }}>
              <Card className="card-modern bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">{dict.doh.resultTitle}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700/50 shadow-inner max-h-80 overflow-auto">
                    <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{dohResult}</pre>
                  </div>
                  {dohUrl && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{dict.doh.endpointLabel}</label>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border">
                        <code className="text-xs break-all">{dohUrl}</code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyDohUrl(dohUrl)}
                        className="w-full bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 backdrop-blur-sm"
                      >
                        {dohUrlCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {dohUrlCopied ? "已复制!" : "复制URL"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 示例演示卡片 */}
          {dict.examples && dict.examples.items && (
            <div className="slide-in-left" style={{ animationDelay: '0.8s' }}>
              <Card className="card-modern bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gradient bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">{dict.examples.title || "示例演示"}</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {dict.examples.subtitle || "查看不同格式的DNS查询示例"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="example1" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 overflow-x-auto bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
                      {dict.examples.items.map((example: any, index: number) => (
                        <TabsTrigger 
                          key={index} 
                          value={`example${index + 1}`}
                          className="data-[state=active]:bg-white/80 data-[state=active]:text-blue-600 transition-all duration-200"
                        >
                          {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {dict.examples.items.map((example: any, index: number) => (
                      <TabsContent key={index} value={`example${index + 1}`} className="space-y-6 pt-6">
                        <div className="card-modern p-6 bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <p className="text-base font-medium text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">{example.format}</p>
                          </div>
                          
                          <div className="space-y-6">
                            {/* dig 命令示例 */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Terminal className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  dig
                                </p>
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 gap-1 bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/30" 
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
                              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700/50 shadow-inner">
                                <code className="text-green-400 text-sm font-mono break-all">{example.commands.dig}</code>
                              </div>
                            </div>
                            
                            {/* host 命令示例 */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  host
                                </p>
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 gap-1 bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/30" 
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
                              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700/50 shadow-inner">
                                <code className="text-blue-400 text-sm font-mono break-all">{example.commands.host}</code>
                              </div>
                            </div>
                            
                            {/* DoH 示例 */}
                            <div className="space-y-3 pt-4 border-t border-white/20 dark:border-gray-700/20">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  DNS over HTTPS
                                </p>
                                <div className="flex items-center gap-2">
                                  <Select 
                                    defaultValue="cloudflare" 
                                    onValueChange={(value) => {
                                      const updatedState = {...exampleDohLoading};
                                      // @ts-ignore
                                      updatedState[`provider-${index}`] = value;
                                      setExampleDohLoading(updatedState);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[130px] bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm">
                                      <SelectValue placeholder={dict.doh.endpointLabel} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                                      {dict.doh.providers.map((provider: any, providerIndex: number) => (
                                        <SelectItem key={providerIndex} value={provider.id}>{provider.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 gap-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/30 dark:border-purple-700/30 backdrop-blur-sm hover:from-purple-500/30 hover:to-pink-500/30" 
                                    onClick={() => {
                                      const exampleConfigs = [
                                        { ipv4: "1.2.3.4", ipv6: "", format: "direct-ipv4" },
                                        { ipv4: "", ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", format: "ipv6-complete" },
                                        { ipv4: "", ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", format: "ipv6-omit" },
                                        { ipv4: "", ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", format: "ipv6-z" },
                                        { ipv4: "1.2.3.4", ipv6: "", format: "base32-ipv4" },
                                        { ipv4: "", ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", format: "base32-ipv6" },
                                        { ipv4: "1.2.3.4", ipv6: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", format: "dual-stack" }
                                      ];
                                      const config = exampleConfigs[index];
                                      // @ts-ignore
                                      const selectedProvider = exampleDohLoading[`provider-${index}`] as string || "cloudflare";
                                      executeDohQuery(config.ipv4, config.ipv6, config.format, selectedProvider, index);
                                    }}
                                    disabled={
                                      exampleDohLoading[`${index}`] || 
                                      // @ts-ignore
                                      (exampleDohLoading[`provider-${index}`] === "custom" && 
                                       // @ts-ignore
                                       !exampleDohLoading[`custom-endpoint-${index}`])
                                    }
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
                              </div>
                              
                              {/* @ts-ignore */}
                              {exampleDohLoading[`provider-${index}`] === "custom" && (
                                <div className="mt-2 mb-2">
                                  <Input
                                    type="text"
                                    placeholder={dict.doh.customEndpointPlaceholder}
                                    className="h-8 text-sm bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 backdrop-blur-sm"
                                    onChange={(e) => {
                                      const updatedState = {...exampleDohLoading};
                                      // @ts-ignore
                                      updatedState[`custom-endpoint-${index}`] = e.target.value;
                                      setExampleDohLoading(updatedState);
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700/50 shadow-inner">
                                <p className="text-purple-400 text-sm">
                                  {(() => {
                                    // @ts-ignore
                                    const selectedProvider = exampleDohLoading[`provider-${index}`] as string || "cloudflare";
                                    const providerName = selectedProvider === "custom" 
                                      ? "Custom" 
                                      : dohProviders[selectedProvider as keyof typeof dohProviders].name;
                                    
                                    const text = example.commands.doh;
                                    
                                    if (text.includes("使用")) {
                                      return text.replace(
                                        /使用(Cloudflare|Google|自定义) DOH查询/i,
                                        `使用${providerName === "Custom" ? "自定义" : providerName} DOH查询`
                                      );
                                    } else {
                                      return text.replace(
                                        /Using (Cloudflare|Google|Custom) DOH to query/i, 
                                        `Using ${providerName} DOH to query`
                                      );
                                    }
                                  })()}
                                </p>
                              </div>
                              
                              {/* DOH URL 显示 */}
                              {exampleDohUrls[`${index}`] && (
                                <div className="mt-4 card-modern p-4 bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                        DOH URL
                                      </p>
                                      <Button 
                                        type="button" 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 gap-1 bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/30" 
                                        onClick={() => copyDohUrl(exampleDohUrls[`${index}`], true, index)}
                                      >
                                        {exampleDohUrlCopied[`${index}`] ? (
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
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                                      <code className="text-xs break-all">{exampleDohUrls[`${index}`]}</code>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* DoH 结果显示 */}
                              {exampleDohResults[`${index}`] && (
                                <div className="mt-4 card-modern p-4 bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      {dict.doh.resultTitle}
                                    </p>
                                    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 rounded-xl border border-gray-700/50 shadow-inner max-h-60 overflow-auto">
                                      <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{exampleDohResults[`${index}`]}</pre>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                            <p className="text-sm text-blue-800 dark:text-blue-200">{example.response}</p>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
