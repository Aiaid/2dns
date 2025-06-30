# Web Interface Development Guide

This document covers the development setup and processes for the 2DNS web interface.

## Overview

The web interface is built with Next.js and provides a user-friendly way to interact with the 2DNS service. It includes features like:

- Interactive DNS query demonstration
- Real-time encoding/decoding examples
- Multi-language support (English/Chinese)
- Modern, developer-oriented UI

## Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── [lang]/            # Language-specific routes
│   │   ├── dictionaries/  # Translation files
│   │   ├── layout.tsx     # Language-specific layout
│   │   └── page.tsx       # Main page component
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── hero.tsx          # Hero section
│   ├── features.tsx      # Features showcase
│   ├── how-it-works.tsx  # Process explanation
│   └── footer.tsx        # Site footer
├── public/               # Static assets
└── styles/              # Additional stylesheets
```

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 10.2.0+

### Installation

```bash
cd web
pnpm install
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint
```

## Styling System

The web interface uses a developer-oriented design system with:

### Color Palette

- **Terminal Green**: Primary accent color
- **Terminal Blue**: Secondary accent color  
- **Terminal Purple**: Tertiary accent color
- **Terminal Orange**: Highlight color
- **Code Background**: Light/dark themed backgrounds
- **Syntax Colors**: Keyword, string, function, comment colors

### Typography

- **Headers**: Monospace fonts (JetBrains Mono, Consolas) for technical feel
- **Body**: Sans-serif fonts (Inter, system fonts) for readability
- **Code**: Monospace fonts with syntax highlighting

### Components

- **Terminal-style cards**: Code block appearance with accent borders
- **Gradient buttons**: With hover effects and terminal styling
- **Code syntax highlighting**: For technical content presentation

## Internationalization

The site supports multiple languages using Next.js built-in i18n:

### Adding New Languages

1. Create translation files in `app/[lang]/dictionaries/`
2. Update the language switcher component
3. Add language-specific routes

### Translation Structure

```json
{
  "title": "Page title",
  "subtitle": "Page subtitle", 
  "features": {
    "title": "Features title",
    "list": [
      {
        "title": "Feature name",
        "description": "Feature description"
      }
    ]
  }
}
```

## Testing

### Component Testing

The project includes comprehensive component tests using Jest and React Testing Library:

```bash
# Run all tests
pnpm test

# Test specific component
pnpm test -- hero.test.tsx

# Run tests with coverage
pnpm test -- --coverage
```

### Test Structure

- Tests are located in `components/__tests__/`
- Each component should have corresponding test file
- Tests cover rendering, interactions, and accessibility

## Build and Deployment

### Static Export

The site is configured for static export to support GitHub Pages:

```bash
pnpm build
```

Output is generated in the `out/` directory.

### Environment Configuration

- Development: Uses Next.js dev server
- Production: Builds static files for deployment

## Performance Optimization

- Image optimization with Next.js Image component
- CSS optimization with Tailwind CSS
- Component code splitting
- Static generation for fast loading

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast color schemes
- Screen reader compatibility

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement approach