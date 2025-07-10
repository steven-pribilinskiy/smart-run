# Rstest Unit Testing Guide

## Overview

[Rstest](https://rstest.rs/) is a testing framework powered by Rspack that delivers comprehensive, first-class support for the Rspack ecosystem. It enables seamless integration into existing Rspack-based projects while offering full Jest-compatible APIs.

**Key Features:**
- **Jest-compatible APIs**: Full compatibility with Jest testing patterns
- **Native TypeScript support**: Out-of-the-box TypeScript support without additional configuration
- **ESM support**: Native ES modules support
- **Rspack ecosystem integration**: First-class support for Rspack-based projects
- **Modern testing experience**: Built for modern JavaScript/TypeScript development

## Configuration

### Configuration File

Rstest automatically reads the `rstest.config.ts` configuration file from the project root directory.

```typescript
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'node',
  // other configuration options
});
```

### Configuration Options

Based on the debug output example, Rstest supports the following configuration options:

```typescript
export default defineConfig({
  // Test file patterns
  include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.{idea,git,cache,output,temp}/**',
    '**/dist/.rstest-temp',
  ],
  
  // Test execution
  testTimeout: 5000,
  testEnvironment: 'node',
  retry: 0,
  slowTestThreshold: 300,
  
  // Process pool configuration
  pool: {
    type: 'forks',
  },
  
  // Test isolation and globals
  isolate: true,
  globals: false,
  passWithNoTests: false,
  
  // Mock configuration
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
  
  // Other options
  update: false,
  includeSource: [],
});
```

## Usage

### Package.json Scripts

Update your `package.json` to include Rstest commands:

```json
{
  "scripts": {
    "test": "rstest",
    "test:watch": "rstest --watch",
    "test:coverage": "rstest --coverage"
  }
}
```

### Running Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Direct execution
npx rstest
```

## Writing Unit Tests

### Basic Test Structure

Rstest uses Jest-compatible APIs, making it familiar to developers. Here's a simple example:

**Source file:**
```typescript
// index.ts
export function sayHi(name: string): string {
  return `Hi ${name}!`;
}
```

**Test file:**
```typescript
// index.test.ts
import { expect, test } from '@rstest/core';
import { sayHi } from './index';

test('should say hi', () => {
  expect(sayHi('World')).toBe('Hi World!');
});
```

### Common Test Patterns

#### Testing Functions
```typescript
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

// math.test.ts
import { describe, test, expect } from '@rstest/core';
import { add, multiply } from './math';

describe('Math operations', () => {
  test('should add two numbers', () => {
    expect(add(2, 2)).toBe(4);
  });

  test('should multiply two numbers', () => {
    expect(multiply(3, 4)).toBe(12);
  });

  test('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
    expect(multiply(-2, 3)).toBe(-6);
  });
});
```

#### Testing Classes
```typescript
// calculator.ts
export class Calculator {
  private value: number = 0;

  add(num: number): Calculator {
    this.value += num;
    return this;
  }

  subtract(num: number): Calculator {
    this.value -= num;
    return this;
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }
}

// calculator.test.ts
import { describe, test, expect, beforeEach } from '@rstest/core';
import { Calculator } from './calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  test('should start with zero', () => {
    expect(calculator.getValue()).toBe(0);
  });

  test('should add numbers', () => {
    calculator.add(5).add(3);
    expect(calculator.getValue()).toBe(8);
  });

  test('should subtract numbers', () => {
    calculator.add(10).subtract(3);
    expect(calculator.getValue()).toBe(7);
  });

  test('should reset to zero', () => {
    calculator.add(5);
    calculator.reset();
    expect(calculator.getValue()).toBe(0);
  });
});
```

#### Testing Async Functions
```typescript
// async-utils.ts
export async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// async-utils.test.ts
import { describe, test, expect } from '@rstest/core';
import { fetchData, delay } from './async-utils';

describe('Async utilities', () => {
  test('should handle async functions', async () => {
    const startTime = Date.now();
    await delay(100);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
  });

  test('should test promises', async () => {
    const promise = Promise.resolve('test data');
    await expect(promise).resolves.toBe('test data');
  });

  test('should test rejected promises', async () => {
    const promise = Promise.reject(new Error('Failed'));
    await expect(promise).rejects.toThrow('Failed');
  });
});
```

### Mock Functions and Spying

Rstest provides Jest-compatible mock functions through the `rstest` utility:

```typescript
import { rstest, test, expect } from '@rstest/core';

// Basic mock function
test('should create and use mock functions', () => {
  const mockFn = rstest.fn();
  mockFn.mockReturnValue('mocked result');
  
  expect(mockFn()).toBe('mocked result');
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn).toHaveBeenCalledTimes(1);
});

// Mock with implementation
test('should mock with custom implementation', () => {
  const mockFn = rstest.fn((x: number) => x * 2);
  
  expect(mockFn(5)).toBe(10);
  expect(mockFn).toHaveBeenCalledWith(5);
});

// Mock resolved values for async
test('should mock async functions', async () => {
  const mockAsyncFn = rstest.fn();
  mockAsyncFn.mockResolvedValue('async result');
  
  const result = await mockAsyncFn();
  expect(result).toBe('async result');
});
```

### Testing Error Conditions
```typescript
// error-handler.ts
export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}

// error-handler.test.ts
import { test, expect } from '@rstest/core';
import { divide } from './error-handler';

test('should throw error for division by zero', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero is not allowed');
});

test('should throw specific error type', () => {
  expect(() => divide(10, 0)).toThrow(Error);
});

test('should perform valid division', () => {
  expect(divide(10, 2)).toBe(5);
});
```

### Rstest Utilities

Rstest provides utility functions through the `rstest` helper:

```typescript
import { rstest } from '@rstest/core';

// Using full name
const mockFn = rstest.fn();
mockFn.mockResolvedValue('foo');

// Using alias 'rs'
import { rs } from '@rstest/core';
const mockFn2 = rs.fn();
mockFn2.mockReturnValue('bar');
```

### Global Access (Optional)

If you enable globals in your configuration, you can access rstest globally:

```typescript
// rstest.config.ts
export default defineConfig({
  globals: true,
});
```

```typescript
// test file (when globals enabled)
const mockFn = rstest.fn();
mockFn.mockResolvedValue('foo');
```

## CLI Commands

Rstest provides various CLI commands for different testing scenarios:

```bash
# Basic test run
rstest

# Watch mode
rstest --watch

# Debug mode
DEBUG=rstest npm test
```

## Debug Mode

Enable debug mode to troubleshoot issues:

```bash
DEBUG=rstest npm test
```

In debug mode, Rstest will:
- Write test outputs to disk
- Generate configuration files in `dist/.rsbuild/`
- Output the final Rstest config to `dist/.rsbuild/rstest.config.ts`

This helps developers view and debug the final configuration after processing.

## Development Status

**Note**: Rstest is currently under active development. The first stable version is planned for late 2025. Check the [Rstest Roadmap](https://rstest.rs/) for more details.

## Resources

- **Official Website**: https://rstest.rs/
- **Documentation**: https://rstest.rs/guide/
- **API Reference**: https://rstest.rs/api/
- **GitHub**: Available through the Rspack ecosystem

## Migration from Jest

Since Rstest offers Jest-compatible APIs, migrating from Jest should be straightforward:

1. Install `@rstest/core`
2. Update your configuration file to use `rstest.config.ts`
3. Change imports from `jest` to `@rstest/core`
4. Update package.json scripts to use `rstest` CLI

The test syntax and most Jest features should work without modification. 