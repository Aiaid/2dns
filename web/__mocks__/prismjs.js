// Mock implementation of Prism.js for testing
const Prism = {
  highlight: jest.fn((code, language) => code),
  languages: {
    javascript: {},
    typescript: {},
    python: {},
    go: {},
    java: {},
    json: {},
    bash: {},
    shell: {},
  },
  highlightAll: jest.fn(),
  highlightElement: jest.fn(),
  plugins: {},
  hooks: {
    add: jest.fn(),
    run: jest.fn(),
  },
  util: {
    encode: jest.fn(tokens => tokens),
    type: jest.fn(() => 'string'),
  },
}

// Mock the default export
module.exports = Prism

// Also export as named export for ES6 imports
module.exports.default = Prism
module.exports.Prism = Prism 