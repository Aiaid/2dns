"use client"

import { useEffect, useState } from "react"

interface DNSNetworkSVGProps {
  className?: string
}

export default function DNSNetworkSVG({ className = "" }: DNSNetworkSVGProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg animate-pulse ${className}`} />
    )
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <svg
        viewBox="0 0 600 400"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lightBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e0" />
          </linearGradient>
          
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          
          <linearGradient id="terminalGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ec9b0" />
            <stop offset="100%" stopColor="#7ee787" />
          </linearGradient>
          
          <linearGradient id="terminalBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#569cd6" />
            <stop offset="100%" stopColor="#79c0ff" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4ec9b0" strokeWidth="0.5" opacity="0.1"/>
          </pattern>
        </defs>

        {/* Background */}
        <rect width="600" height="400" fill="url(#lightBgGradient)" className="dark:hidden" />
        <rect width="600" height="400" fill="url(#bgGradient)" className="hidden dark:block" />

        {/* Grid pattern */}
        <rect width="600" height="400" fill="url(#grid)" />

        {/* Central DNS Server */}
        <g transform="translate(300, 200)">
          <rect x="-40" y="-60" width="80" height="120" rx="8" 
                fill="url(#terminalBlue)" opacity="0.8" filter="url(#glow)" />
          <rect x="-35" y="-55" width="70" height="110" rx="6" 
                className="fill-slate-800 dark:fill-slate-800" stroke="#4ec9b0" strokeWidth="2" />
          
          <rect x="-30" y="-45" width="60" height="8" rx="2" fill="#4ec9b0" opacity="0.6" />
          <rect x="-30" y="-30" width="60" height="8" rx="2" fill="#569cd6" opacity="0.6" />
          <rect x="-30" y="-15" width="60" height="8" rx="2" fill="#c586c0" opacity="0.6" />
          
          <text x="0" y="75" textAnchor="middle" className="fill-green-400 dark:fill-green-400 text-sm font-mono font-bold">
            2DNS
          </text>
          <text x="0" y="90" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-xs font-mono">
            Global DNS
          </text>
          
          <circle cx="0" cy="0" r="8" fill="#4ec9b0" opacity="0.8">
            <animate attributeName="r" values="6;12;6" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Laptop */}
        <g transform="translate(100, 120)">
          <rect x="-25" y="-15" width="50" height="30" rx="4" 
                className="fill-slate-700 dark:fill-slate-700" stroke="#4ec9b0" strokeWidth="1.5" />
          <rect x="-20" y="-10" width="40" height="20" rx="2" className="fill-slate-900 dark:fill-slate-900" />
          <rect x="-30" y="15" width="60" height="8" rx="4" 
                fill="#374151" stroke="#4ec9b0" strokeWidth="1" />
          <text x="0" y="35" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-xs font-mono">
            Client
          </text>
        </g>

        {/* Mobile phone */}
        <g transform="translate(500, 280)">
          <rect x="-12" y="-25" width="24" height="50" rx="8" 
                className="fill-slate-700 dark:fill-slate-700" stroke="#569cd6" strokeWidth="1.5" />
          <rect x="-8" y="-20" width="16" height="30" rx="2" className="fill-slate-900 dark:fill-slate-900" />
          <circle cx="0" cy="20" r="3" fill="#374151" />
          <text x="0" y="45" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-xs font-mono">
            Mobile
          </text>
        </g>

        {/* IoT Device */}
        <g transform="translate(150, 320)">
          <circle cx="0" cy="0" r="20" className="fill-slate-700 dark:fill-slate-700" stroke="#c586c0" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="12" className="fill-slate-900 dark:fill-slate-900" />
          <circle cx="0" cy="0" r="4" fill="#c586c0" opacity="0.8" />
          <text x="0" y="35" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-xs font-mono">
            IoT
          </text>
        </g>

        {/* Server */}
        <g transform="translate(450, 80)">
          <rect x="-15" y="-20" width="30" height="40" rx="4" 
                className="fill-slate-700 dark:fill-slate-700" stroke="#ffa657" strokeWidth="1.5" />
          <rect x="-10" y="-15" width="20" height="5" rx="1" fill="#ffa657" opacity="0.6" />
          <rect x="-10" y="-5" width="20" height="5" rx="1" fill="#ffa657" opacity="0.6" />
          <rect x="-10" y="5" width="20" height="5" rx="1" fill="#ffa657" opacity="0.6" />
          <text x="0" y="35" textAnchor="middle" className="fill-slate-600 dark:fill-slate-400 text-xs font-mono">
            Server
          </text>
        </g>

        {/* Connection lines with animation */}
        <line x1="125" y1="135" x2="260" y2="180" 
              stroke="url(#terminalGreen)" strokeWidth="2" opacity="0.6" strokeDasharray="5,5">
          <animate attributeName="strokeDashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
        </line>

        <line x1="488" y1="255" x2="340" y2="220" 
              stroke="url(#terminalBlue)" strokeWidth="2" opacity="0.6" strokeDasharray="5,5">
          <animate attributeName="strokeDashoffset" values="0;10" dur="1.2s" repeatCount="indefinite" />
        </line>

        <line x1="170" y1="300" x2="270" y2="240" 
              stroke="#c586c0" strokeWidth="2" opacity="0.6" strokeDasharray="5,5">
          <animate attributeName="strokeDashoffset" values="0;10" dur="1.5s" repeatCount="indefinite" />
        </line>

        <line x1="435" y1="100" x2="340" y2="160" 
              stroke="#ffa657" strokeWidth="2" opacity="0.6" strokeDasharray="5,5">
          <animate attributeName="strokeDashoffset" values="0;10" dur="0.8s" repeatCount="indefinite" />
        </line>

        {/* DNS Query bubbles */}
        <circle cx="200" cy="160" r="4" fill="#4ec9b0">
          <animateTransform attributeName="transform" 
                          type="translate" 
                          values="0 0; 100 40; 0 0" 
                          dur="3s" 
                          repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="400" cy="180" r="4" fill="#569cd6">
          <animateTransform attributeName="transform" 
                          type="translate" 
                          values="0 0; -100 -40; 0 0" 
                          dur="2.5s" 
                          repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Terminal window */}
        <rect x="20" y="20" width="120" height="60" rx="4" 
              className="fill-slate-900 dark:fill-slate-900" stroke="#4ec9b0" strokeWidth="1" opacity="0.8" />
        <circle cx="30" cy="30" r="3" fill="#ef4444" />
        <circle cx="45" cy="30" r="3" fill="#f59e0b" />
        <circle cx="60" cy="30" r="3" fill="#10b981" />
        
        <text x="30" y="50" className="fill-green-400 text-xs font-mono">$ dig @2dns.dev</text>
        <text x="30" y="65" className="fill-green-400 text-xs font-mono">example.com</text>
        
        {/* Code snippet */}
        <rect x="460" y="320" width="120" height="60" rx="4" 
              className="fill-slate-900 dark:fill-slate-900" stroke="#569cd6" strokeWidth="1" opacity="0.8" />
        <text x="470" y="340" className="fill-blue-400 text-xs font-mono">const dns = &#123;</text>
        <text x="480" y="355" className="fill-white text-xs font-mono">resolve: true,</text>
        <text x="480" y="370" className="fill-white text-xs font-mono">cache: false</text>
        <text x="470" y="385" className="fill-blue-400 text-xs font-mono">&#125;</text>

        {/* Floating particles */}
        <circle cx="50" cy="50" r="1" fill="#4ec9b0" opacity="0.4">
          <animateTransform attributeName="transform" type="translate" 
                          values="0 0; 20 -30; 0 0" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="550" cy="100" r="1" fill="#569cd6" opacity="0.4">
          <animateTransform attributeName="transform" type="translate" 
                          values="0 0; -25 40; 0 0" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="380" r="1" fill="#c586c0" opacity="0.4">
          <animateTransform attributeName="transform" type="translate" 
                          values="0 0; 30 -20; 0 0" dur="3.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}