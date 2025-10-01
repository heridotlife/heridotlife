// __tests__/HomePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import HomePage from '@/app/page';

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

// Mock localStorage
beforeEach(() => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.localStorage = localStorageMock as any;
});

describe('HomePage', () => {
  it('renders the main components', async () => {
    render(<HomePage />);

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Heri Rusmanto',
      );
    });

    expect(screen.getByText('Automation enthusiast')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Connect on LinkedIn/i }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/in/hveda/');

    // Check profile image
    const image = screen.getByAltText('Heri Rusmanto Profile Picture');
    expect(image).toBeInTheDocument();
  });

  it('renders theme toggle button', async () => {
    render(<HomePage />);

    // Wait for component to mount and find toggle button
    const toggleButton = await waitFor(() =>
      screen.getByRole('button', { name: /Toggle theme/i }),
    );

    expect(toggleButton).toBeInTheDocument();
  });

  it('displays the current year in footer', async () => {
    render(<HomePage />);

    // Wait for component to mount
    await waitFor(() => {
      const year = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
    });
  });
});
