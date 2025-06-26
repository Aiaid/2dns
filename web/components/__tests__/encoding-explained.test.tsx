import { render, screen } from '@testing-library/react'
import EncodingExplained from '../encoding-explained'

// Mock the dictionary data
const mockDictionary = {
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
}

// Mock Prism.js
jest.mock('prismjs', () => ({
  highlightElement: jest.fn()
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Code: () => <div data-testid="code-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Layers: () => <div data-testid="layers-icon" />
}))

describe('EncodingExplained', () => {
  it('renders the main title and subtitle', () => {
    render(<EncodingExplained dict={mockDictionary} />)
    
    expect(screen.getByText('Base32 Encoding Explained')).toBeInTheDocument()
    expect(screen.getByText('How 2DNS encodes IP addresses using Base32')).toBeInTheDocument()
  })

  it('renders the base32 explanation section', () => {
    render(<EncodingExplained dict={mockDictionary} />)
    
    expect(screen.getByText('Understanding Base32 Encoding')).toBeInTheDocument()
    expect(screen.getByText('Base32 encoding description')).toBeInTheDocument()
  })

  it('renders IPv4 encoding section', () => {
    render(<EncodingExplained dict={mockDictionary} />)
    
    expect(screen.getByText('Base32 Encoding for IPv4')).toBeInTheDocument()
    expect(screen.getByText('IPv4 description')).toBeInTheDocument()
  })

  it('renders IPv6 encoding section', () => {
    render(<EncodingExplained dict={mockDictionary} />)
    
    expect(screen.getByText('Base32 Encoding for IPv6')).toBeInTheDocument()
    expect(screen.getByText('IPv6 description')).toBeInTheDocument()
  })

  it('renders dual stack encoding section', () => {
    render(<EncodingExplained dict={mockDictionary} />)
    
    expect(screen.getByText('Dual Stack Encoding')).toBeInTheDocument()
    expect(screen.getByText('Dual stack description')).toBeInTheDocument()
  })

  it('renders code examples section with tabs', () => {
    render(<EncodingExplained dict={mockDictionary} />)
    
    expect(screen.getByText('Implementation Examples')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Python' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'TypeScript' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Go' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Java' })).toBeInTheDocument()
  })

  it('renders with modern styling elements', () => {
    const { container } = render(<EncodingExplained dict={mockDictionary} />)
    
    // Check for gradient background and modern card elements
    const section = container.querySelector('section')
    expect(section).toHaveClass('relative', 'overflow-hidden')
    
    // Check for icons that are always visible
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument()
    expect(screen.getByTestId('layers-icon')).toBeInTheDocument()
    
    // Check for visible globe icon (at least one should be visible)
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument()
    
    // Check for modern card styling
    const cards = container.querySelectorAll('.card-modern')
    expect(cards.length).toBeGreaterThan(0)
  })
}) 