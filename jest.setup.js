import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Jest environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for tests
global.fetch = jest.fn();

// Allow router mocks.
// eslint-disable-next-line no-undef
jest.mock('next/router', () => require('next-router-mock'));
