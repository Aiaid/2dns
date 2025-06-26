import { render, screen } from '@testing-library/react'
import LandingPage from '../landing-page'

// Mock the dictionary data
const mockDictionary = {
  hero: {
    title: 'Test Hero Title',
    subtitle: 'Test Hero Subtitle',
    description: 'Test Hero Description',
    cta: 'Get Started',
    secondaryCta: 'Learn More'
  },
  features: {
    title: 'Features',
    subtitle: 'Our amazing features',
    list: [
      { title: 'Feature 1', description: 'Feature 1 description' },
      { title: 'Feature 2', description: 'Feature 2 description' }
    ]
  },
  howItWorks: {
    title: 'How It Works',
    subtitle: 'Simple steps',
    steps: [
      { title: 'Step 1', description: 'Step 1 description' }
    ]
  },
  encodingExplained: {
    title: 'Base32 Encoding Explained',
    subtitle: 'How 2DNS encodes IP addresses using Base32',
    base32Title: 'Understanding Base32 Encoding',
    base32Description: 'Base32 encoding description',
    ipv4Title: 'Base32 Encoding for IPv4',
    ipv4Description: 'IPv4 description',
    ipv4Example: 'IPv4 example HTML',
    ipv6Title: 'Base32 Encoding for IPv6',
    ipv6Description: 'IPv6 description',
    ipv6Example: 'IPv6 example HTML',
    dualStackLabel: 'Dual Stack',
    dualStackTitle: 'Dual Stack Encoding',
    dualStackDescription: 'Dual stack description',
    dualStackExample: 'Dual stack example HTML',
    codeExamplesTitle: 'Implementation Examples',
    pythonExample: 'print("Hello Python")',
    javascriptExample: 'console.log("Hello JavaScript")',
    typescriptExample: 'console.log("Hello TypeScript")',
    goExample: 'fmt.Println("Hello Go")',
    javaExample: 'System.out.println("Hello Java")'
  },
  demo: {
    title: 'Demo Title'
  },
  footer: {
    rights: 'All rights reserved',
    privacy: 'Privacy',
    terms: 'Terms'
  },
  common: {
    brand: '2DNS'
  },
  navigation: {
    features: 'Features',
    howItWorks: 'How It Works',
    encodingExplained: 'Encoding',
    try: 'Try Demo'
  }
}

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  )
})

describe('LandingPage', () => {
  it('renders all main sections', () => {
    render(<LandingPage lang="en" dictionary={mockDictionary} />)
    
    // Check if main sections are rendered
    expect(screen.getByText('Test Hero Title')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getByText('Base32 Encoding Explained')).toBeInTheDocument()
    expect(screen.getByText('Demo Title')).toBeInTheDocument()
  })

  it('renders header and footer', () => {
    render(<LandingPage lang="en" dictionary={mockDictionary} />)
    
    // Check if header navigation exists
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    
    // Check if footer exists
    expect(screen.getByText('All rights reserved')).toBeInTheDocument()
  })

  it('has proper structure with flex layout', () => {
    const { container } = render(<LandingPage lang="en" dictionary={mockDictionary} />)
    
    // Check if the main container has flex layout
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('flex', 'min-h-screen', 'flex-col')
  })
}) 