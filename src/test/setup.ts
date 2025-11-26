import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock WebSocket
class MockWebSocket {
  constructor(url: string) {
    this.url = url;
  }
  url: string;
  send = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
  readyState = 1;
}

global.WebSocket = MockWebSocket as any;

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

// Suppress console errors during tests unless explicitly testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn((...args) => {
    // Only suppress expected errors, not assertion failures
    if (args.some(arg => arg && arg.toString().includes('Error'))) {
      return;
    }
    originalError.apply(console, args);
  });
});

afterAll(() => {
  console.error = originalError;
});