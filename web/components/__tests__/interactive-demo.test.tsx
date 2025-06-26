import { render, screen, fireEvent, act } from '@testing-library/react'
import InteractiveDemo from '../interactive-demo'

// Mock the dictionary data
const mockDictionary = {
  title: 'Try DNS Reflection',
  subtitle: 'See how 2DNS works with your IP addresses',
  description: 'Enter an IP address and select a format to generate a DNS query command.',
  ipLabel: 'IP Address',
  ipPlaceholder: 'Enter IPv4 or IPv6 address',
  formatLabel: 'Query Format',
  commandTypeLabel: 'Command Type',
  generateButton: 'Generate DNS Query',
  resultTitle: 'DNS Query Command',
  responseTitle: 'Expected Response',
  copyButton: 'Copy',
  copiedMessage: 'Copied to clipboard!',
  formats: [
    { id: 'direct-ipv4', name: 'Direct IPv4 Reflection' },
    { id: 'ipv6-complete', name: 'IPv6 Complete Format' },
    { id: 'ipv6-omit', name: 'IPv6 with Omitted Zeros' },
    { id: 'ipv6-z', name: 'IPv6 with z for Zero Groups' },
    { id: 'base32-ipv4', name: 'Base32 Encoded IPv4' },
    { id: 'base32-ipv6', name: 'Base32 Encoded IPv6' },
    { id: 'dual-stack', name: 'Dual-Stack (IPv4 + IPv6)' }
  ],
  commandTypes: [
    { id: 'dig', name: 'dig' },
    { id: 'host', name: 'host' },
    { id: 'doh', name: 'DNS over HTTPS' }
  ],
  doh: {
    title: 'DNS over HTTPS',
    providerLabel: 'DOH Provider',
    customEndpointLabel: 'Custom Endpoint',
    customEndpointPlaceholder: 'Enter custom DOH endpoint URL',
    runButton: 'Run Query',
    loadingMessage: 'Running query...',
    resultTitle: 'DOH Query Result',
    endpointLabel: 'Endpoint',
    providers: [
      { id: 'cloudflare', name: 'Cloudflare' },
      { id: 'google', name: 'Google' },
      { id: 'custom', name: 'Custom' }
    ]
  },
  examples: {
    title: 'Example Demonstrations',
    subtitle: 'View DNS query examples in different formats',
    items: [
      {
        format: 'Direct IPv4 Reflection',
        commands: {
          dig: 'dig @2dns.dev 1.2.3.4.2dns.dev A',
          host: 'host -t A 1.2.3.4.2dns.dev 2dns.dev',
          doh: 'Using Cloudflare DOH to query 1.2.3.4.2dns.dev'
        },
        response: 'Returns 1.2.3.4 as an A record'
      }
    ]
  }
}

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Terminal: () => <div data-testid="terminal-icon" />,
  Info: () => <div data-testid="info-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Network: () => <div data-testid="network-icon" />
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
})

describe('InteractiveDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main title and subtitle', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    expect(screen.getByText('Try DNS Reflection')).toBeInTheDocument()
    expect(screen.getByText('See how 2DNS works with your IP addresses')).toBeInTheDocument()
    expect(screen.getByText('Enter an IP address and select a format to generate a DNS query command.')).toBeInTheDocument()
  })

  it('renders input fields for IPv4 and IPv6 addresses', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    expect(screen.getByText('IPv4 地址')).toBeInTheDocument()
    expect(screen.getByText('IPv6 地址')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter IPv4 or IPv6 address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter IPv6 address')).toBeInTheDocument()
  })

  it('renders dual-stack mode checkbox', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    expect(screen.getByText('启用双栈模式 (IPv4 + IPv6)')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('renders format selection dropdown', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    expect(screen.getByText('Query Format')).toBeInTheDocument()
    expect(screen.getByText('Select format')).toBeInTheDocument()
  })

  it('renders command type tabs', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    expect(screen.getByRole('tab', { name: 'dig' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'host' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'DOH' })).toBeInTheDocument()
  })

  it('renders generate button disabled by default', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    const generateButton = screen.getByText('Generate DNS Query')
    expect(generateButton).toBeInTheDocument()
    expect(generateButton.closest('button')).toBeDisabled()
  })

  it('enables generate button when valid IP is entered', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    const ipv4Input = screen.getByPlaceholderText('Enter IPv4 or IPv6 address')
    act(() => {
      fireEvent.change(ipv4Input, { target: { value: '1.2.3.4' } })
    })
    
    // The button state change should happen synchronously
    const generateButton = screen.getByText('Generate DNS Query')
    expect(generateButton.closest('button')).not.toBeDisabled()
  })

  it('generates DNS query when button is clicked', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    const ipv4Input = screen.getByPlaceholderText('Enter IPv4 or IPv6 address')
    act(() => {
      fireEvent.change(ipv4Input, { target: { value: '1.2.3.4' } })
    })
    
    const generateButton = screen.getByText('Generate DNS Query')
    act(() => {
      fireEvent.click(generateButton)
    })
    
    // Check if result is displayed
    expect(screen.getByText('DNS Query Command')).toBeInTheDocument()
  })

  it('shows error for invalid IPv4 address', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    const ipv4Input = screen.getByPlaceholderText('Enter IPv4 or IPv6 address')
    act(() => {
      fireEvent.change(ipv4Input, { target: { value: 'invalid-ip' } })
      fireEvent.blur(ipv4Input)
    })
    
    // Error should be displayed immediately
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
  })

  it('renders with modern styling elements', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    // Check for gradient background and modern card elements
    const section = document.querySelector('section')
    expect(section).toHaveClass('relative', 'overflow-hidden')
    
    // Check for various icons
    expect(screen.getByTestId('network-icon')).toBeInTheDocument()
    expect(screen.getByTestId('terminal-icon')).toBeInTheDocument()
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument()
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument()
  })

  it('renders examples section when provided', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    expect(screen.getByText('Example Demonstrations')).toBeInTheDocument()
    expect(screen.getByText('View DNS query examples in different formats')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '1' })).toBeInTheDocument()
  })

  it('copies command to clipboard when copy button is clicked', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    const ipv4Input = screen.getByPlaceholderText('Enter IPv4 or IPv6 address')
    act(() => {
      fireEvent.change(ipv4Input, { target: { value: '1.2.3.4' } })
    })
    
    const generateButton = screen.getByText('Generate DNS Query')
    act(() => {
      fireEvent.click(generateButton)
    })
    
    const copyButton = screen.getByText('Copy')
    act(() => {
      fireEvent.click(copyButton)
    })
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
  })

  it('handles copy failure gracefully with fallback method', async () => {
    // Mock clipboard API to fail
    const mockWriteText = jest.fn(() => Promise.reject(new Error('Permission denied')))
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText
      }
    })

    // Mock document.execCommand
    const mockExecCommand = jest.fn(() => true)
    document.execCommand = mockExecCommand

    render(<InteractiveDemo dict={mockDictionary} />)
    
    const ipv4Input = screen.getByPlaceholderText('Enter IPv4 or IPv6 address')
    act(() => {
      fireEvent.change(ipv4Input, { target: { value: '1.2.3.4' } })
    })
    
    const generateButton = screen.getByText('Generate DNS Query')
    act(() => {
      fireEvent.click(generateButton)
    })
    
    const copyButton = screen.getByText('Copy')
    act(() => {
      fireEvent.click(copyButton)
    })

    // Wait for async operation to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockWriteText).toHaveBeenCalled()
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
  })

  it('handles browsers without clipboard API using fallback method', () => {
    // Remove clipboard API
    const originalClipboard = navigator.clipboard
    delete (navigator as any).clipboard

    // Mock document.execCommand
    const mockExecCommand = jest.fn(() => true)
    document.execCommand = mockExecCommand

    render(<InteractiveDemo dict={mockDictionary} />)
    
    const ipv4Input = screen.getByPlaceholderText('Enter IPv4 or IPv6 address')
    act(() => {
      fireEvent.change(ipv4Input, { target: { value: '1.2.3.4' } })
    })
    
    const generateButton = screen.getByText('Generate DNS Query')
    act(() => {
      fireEvent.click(generateButton)
    })
    
    const copyButton = screen.getByText('Copy')
    act(() => {
      fireEvent.click(copyButton)
    })

    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()

    // Restore clipboard API
    ;(navigator as any).clipboard = originalClipboard
  })

  it('copies example commands when example copy buttons are clicked', () => {
    render(<InteractiveDemo dict={mockDictionary} />)
    
    // Find the example copy button for dig command
    const exampleCopyButtons = screen.getAllByText('Copy')
    // The first few copy buttons should be for examples
    const exampleCopyButton = exampleCopyButtons.find(button => 
      button.closest('div')?.textContent?.includes('dig')
    )
    
    if (exampleCopyButton) {
      act(() => {
        fireEvent.click(exampleCopyButton)
      })
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    }
  })
}) 