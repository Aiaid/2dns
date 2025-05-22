import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CodeHighlighter } from '../code-highlighter'

describe('CodeHighlighter', () => {
  it('renders correctly with the given code and language', () => {
    const code = 'console.log("Hello, world!")'
    const language = 'javascript'
    
    const { container } = render(<CodeHighlighter code={code} language={language} />)
    
    // 检查pre元素的类名是否正确
    const preElement = container.querySelector('pre') as HTMLElement
    expect(preElement).toHaveClass(`language-${language}`)
    expect(preElement).toHaveClass('overflow-x-auto')
    expect(preElement).toHaveClass('p-4')
    expect(preElement).toHaveClass('rounded')
    expect(preElement).toHaveClass('bg-gray-900')
    
    // 检查code元素的类名是否正确
    const codeElement = container.querySelector('code') as HTMLElement
    expect(codeElement).toHaveClass(`language-${language}`)
    
    // 检查code内容是否正确
    expect(codeElement).toHaveTextContent(code)
  })
  
  it('supports python language', () => {
    const code = 'print("Hello, world!")'
    const language = 'python'
    
    const { container } = render(<CodeHighlighter code={code} language={language} />)
    
    const preElement = container.querySelector('pre') as HTMLElement
    expect(preElement).toHaveClass(`language-${language}`)
    
    const codeElement = container.querySelector('code') as HTMLElement
    expect(codeElement).toHaveClass(`language-${language}`)
  })
}) 