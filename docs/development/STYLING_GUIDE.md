# 2DNS Web Styling Guide

This document consolidates information about the styling system and design decisions for the 2DNS web interface.

## Design Philosophy

The 2DNS web interface follows a **developer-oriented design system** with modern web aesthetics:

- **Terminal-inspired**: Code-like elements with monospace fonts
- **High contrast**: Clear visual hierarchy with strong color contrast
- **Responsive themes**: Perfect support for both light and dark modes
- **Micro-interactions**: Rich hover and transition effects
- **Glass morphism**: Modern semi-transparent card designs

## Color System

### Terminal-Inspired Color Palette

```css
:root {
  /* Developer-oriented colors - Light mode */
  --gradient-primary: linear-gradient(135deg, #00d4aa 0%, #00c7be 100%);
  --gradient-secondary: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  --gradient-accent: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  --terminal-bg: #1e1e1e;
  --terminal-text: #d4d4d4;
  --terminal-green: #4ec9b0;
  --terminal-blue: #569cd6;
  --terminal-purple: #c586c0;
  --terminal-orange: #ce9178;
}

.dark {
  /* Developer-oriented dark mode colors */
  --gradient-background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%);
  --terminal-bg: #0d1117;
  --terminal-text: #c9d1d9;
  --terminal-green: #7ee787;
  --terminal-blue: #79c0ff;
  --terminal-purple: #d2a8ff;
  --terminal-orange: #ffa657;
}
```

### Adaptive Text Colors

```css
/* Responsive text colors that adapt to theme */
.text-adaptive {
  color: var(--text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.text-adaptive-secondary {
  color: var(--text-secondary);
}

.text-adaptive-muted {
  color: var(--text-muted);
}
```

## Component Styling

### Terminal-Style Cards

```css
.card-modern {
  background: var(--code-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--code-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.card-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-modern:hover::before {
  opacity: 1;
}
```

### Developer-Style Buttons

```css
.btn-gradient {
  background: var(--gradient-primary);
  color: white;
  border: 2px solid transparent;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.btn-gradient:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 212, 170, 0.3);
  border-color: var(--terminal-green);
}
```

### Code Block Styling

```css
.code-block {
  background: var(--terminal-bg);
  color: var(--terminal-text);
  border: 1px solid var(--code-border);
  border-radius: 8px;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  position: relative;
}

.code-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--gradient-primary);
}
```

## Typography System

### Font Hierarchy

- **Headings**: `'JetBrains Mono'` for technical feel
- **Body Text**: `'Inter'` for readability
- **Code Elements**: `'JetBrains Mono', 'Consolas', 'Monaco'`

### Syntax Highlighting

```css
.syntax-keyword {
  color: var(--syntax-keyword);
  font-weight: 600;
}

.syntax-string {
  color: var(--syntax-string);
}

.syntax-function {
  color: var(--syntax-function);
}

.syntax-comment {
  color: var(--syntax-comment);
  font-style: italic;
}
```

## Animation System

### Entrance Animations

```css
.fade-in {
  animation: fadeIn 1s ease-in-out;
}

.slide-in-left {
  animation: slideInLeft 0.8s ease-out;
}

.slide-in-right {
  animation: slideInRight 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Hover Effects

```css
.float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
```

## Component-Specific Styling

### Hero Section

- **Terminal prompt styling**: `terminal-prompt::before` adds `$ ` prefix
- **Code block subtitle**: Wrapped in syntax-highlighted container
- **Grid pattern background**: Subtle dot grid overlay
- **Gradient text**: Primary gradient applied to key headings

### Features Section

- **Terminal icons**: Database, Terminal, Lock, Zap icons
- **Code comment descriptions**: Wrapped in `/* */` comment syntax
- **Index indicators**: Zero-padded numbers like `[01]`, `[02]`
- **Cursor effect**: Animated terminal cursor on hover

### How It Works Section

- **Function syntax**: Titles wrapped in `function name() {}` syntax
- **Documentation comments**: Descriptions in `/** */` format
- **Connection lines**: Terminal-colored progressive connection
- **Completion indicator**: `process.exit(0);` with status lights

### Footer

- **Terminal commands**: Links styled as shell commands (`./features`, `git clone`)
- **Status indicators**: Online/Secure/Fast with colored dots
- **Grid pattern**: Subtle terminal-style grid background

## Theme Compatibility

### Light Mode Optimizations

- Higher background opacity (70% vs 10%) for better readability
- Enhanced border contrast using `gray-200/40`
- Code blocks use `gray-100` to `gray-200` gradients
- Tab styles use `white/60` base with `white/90` active

### Dark Mode Enhancements

- Terminal-inspired background gradients
- GitHub-style color palette for syntax highlighting
- Enhanced card backgrounds (`gray-800/60` vs `gray-800/20`)
- Improved border visibility (`gray-600/40` vs `gray-700/20`)

## Responsive Design

### Breakpoints

- **Mobile**: Simplified animations, stacked layouts
- **Tablet**: Adapted grid systems, medium spacing
- **Desktop**: Full animation suite, complex layouts

### Mobile Optimizations

- Reduced animation complexity
- Simplified hover states (tap-friendly)
- Optimized touch targets (44px minimum)
- Compressed vertical spacing

## Performance Considerations

- **GPU Acceleration**: `transform` and `opacity` animations
- **Efficient Transitions**: Avoid layout-triggering properties
- **Optimized Gradients**: Use CSS gradients over images
- **Minimal Repaints**: Careful use of `backdrop-filter`

## Best Practices

### Adding New Components

1. Use adaptive text classes: `.text-adaptive`, `.text-adaptive-secondary`, `.text-adaptive-muted`
2. Apply terminal-style styling: `.code-block`, `.syntax-*` classes
3. Include hover effects: `hover:scale-105`, `hover:shadow-xl`
4. Add entrance animations: `.fade-in`, `.slide-in-*`
5. Test in both light and dark modes

### Color Usage

- **Primary actions**: Use `--gradient-primary`
- **Secondary elements**: Use `--terminal-green`, `--terminal-blue`
- **Text content**: Always use adaptive color variables
- **Backgrounds**: Prefer transparent overlays over solid colors

### Animation Guidelines

- **Duration**: Keep under 0.5s for micro-interactions
- **Easing**: Use `ease-out` for entrances, `ease-in-out` for hovers
- **Stagger**: Add `animationDelay` for grouped elements
- **Reduce motion**: Respect `prefers-reduced-motion`

## Testing

### Visual Regression

- Test all components in light and dark modes
- Verify responsive behavior across breakpoints
- Check animation performance on low-end devices
- Validate color contrast ratios (WCAG AA)

### Cross-Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Progressive enhancement for older browsers
- Fallback colors for unsupported CSS features