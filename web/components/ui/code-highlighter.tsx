'use client'

import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-java'

type Props = {
  code: string
  language: string
}

export function CodeHighlighter({ code, language }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current)
    }
  }, [code, language])

  return (
    <pre className={`language-${language} overflow-x-auto p-4 rounded bg-gray-900`}>
      <code ref={ref} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  )
}
