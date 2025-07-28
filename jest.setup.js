import { TextEncoder, TextDecoder } from 'util';

import '@testing-library/jest-dom/extend-expect';

// Polyfills for Jest environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for tests
global.fetch = () => Promise.resolve({});

// Allow router mocks.
const mockRouter = require('next-router-mock');
jest.mock('next/router', () => mockRouter);
jest.mock('next/navigation', () => mockRouter);
