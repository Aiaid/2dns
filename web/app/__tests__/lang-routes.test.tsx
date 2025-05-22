import { render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import Home from '../[lang]/page'
import RootLayout from '../[lang]/layout'

jest.mock('../[lang]/dictionaries', () => ({
  getDictionary: jest.fn().mockImplementation(async (lang) => ({
    metadata: {
      title: `Test Title ${lang}`,
      description: `Test Description ${lang}`
    },
    nav: {
      home: 'Home'
    }
  }))
}))

jest.mock('next/font/google', () => ({
  Inter: jest.fn().mockReturnValue({
    className: 'mocked-font-class'
  })
}))

jest.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@/components/landing-page', () => ({
  __esModule: true,
  default: ({ lang, dictionary }: any) => (
    <div data-testid="landing-page" data-lang={lang}>
      {dictionary.metadata.title}
    </div>
  )
}))

describe('Language Route Handling', () => {
  it('Home component correctly awaits params.lang', async () => {
    let component: any
    
    await act(async () => {
      component = await Home({ params: { lang: 'en' } })
    })
    
    expect(component.props.children.props['data-lang']).toBe('en')
  })
  
  it('RootLayout correctly awaits params.lang', async () => {
    let layout: any
    
    await act(async () => {
      layout = await RootLayout({
        children: <div>Test</div>,
        params: { lang: 'zh' }
      })
    })
    
    expect(layout.props.lang).toBe('zh')
  })
  
  it('Falls back to "en" for invalid languages', async () => {
    let component: any
    
    await act(async () => {
      component = await Home({ params: { lang: 'invalid' } })
    })
    
    expect(component.props.children.props['data-lang']).toBe('en')
  })
}) 