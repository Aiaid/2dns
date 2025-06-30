import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import Hero from '../hero'
import Features from '../features'
import Footer from '../footer'

// Mock data for testing
const mockDict = {
  hero: {
    title: '2DNS 服务',
    subtitle: '快速可靠的DNS解析',
    description: '提供快速、安全、可靠的DNS解析服务',
    cta: '立即体验',
    secondaryCta: '了解更多'
  },
  features: {
    title: '核心功能',
    subtitle: '强大的功能特性',
    list: [
      { title: '快速解析', description: '毫秒级响应时间' },
      { title: '安全可靠', description: '企业级安全保护' }
    ]
  },
  footer: {
    privacy: '隐私政策',
    terms: '服务条款',
    rights: '版权所有'
  }
}

describe('Text Color Fixes', () => {
  it('Hero组件应该使用自适应颜色类', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <Hero dict={mockDict.hero} />
      </ThemeProvider>
    )
    
    // 检查是否包含自适应颜色类
    const titleElement = screen.getByText('服务')
    expect(titleElement).toHaveClass('text-adaptive')
    
    const subtitleElement = screen.getByText('快速可靠的DNS解析')
    expect(subtitleElement).toHaveClass('text-adaptive-secondary')
    
    const descriptionElement = screen.getByText('提供快速、安全、可靠的DNS解析服务')
    expect(descriptionElement).toHaveClass('text-adaptive-muted')
  })

  it('Features组件应该使用自适应颜色类', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <Features dict={mockDict.features} />
      </ThemeProvider>
    )
    
    const subtitleElement = screen.getByText('强大的功能特性')
    expect(subtitleElement).toHaveClass('text-adaptive-muted')
  })

  it('Footer组件应该使用自适应颜色类', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <Footer dict={mockDict.footer} brand="2DNS" />
      </ThemeProvider>
    )
    
    const descriptionElement = screen.getByText('让互联网连接更简单、更安全、更高效')
    expect(descriptionElement).toHaveClass('text-adaptive-muted')
  })

  it('在暗色主题下也应该正确显示', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Hero dict={mockDict.hero} />
      </ThemeProvider>
    )
    
    // 暗色主题下也应该使用相同的自适应类
    const titleElement = screen.getByText('服务')
    expect(titleElement).toHaveClass('text-adaptive')
  })
}) 