// __tests__/HomePage.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import HomePage from '@/app/page'; // Update path as needed

describe('HomePage', () => {
  it('renders the main components', () => {
    render(<HomePage />);

    // Check if title, subtitle, and LinkedIn link render
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Heri Rusmanto',
    );
    expect(screen.getByText('Automation enthusiast')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Connect with me on LinkedIn/i }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/in/hveda/');

    // Check profile image
    const image = screen.getByAltText('Profile Picture');
    expect(image).toBeInTheDocument();
  });

  it('toggles dark mode', () => {
    render(<HomePage />);

    // Initial button label for light mode
    const toggleButton = screen.getByRole('button', { name: /Set to dark/i });
    expect(toggleButton).toBeInTheDocument();

    // Click to change to dark mode
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Set to light');
  });

  it('displays the current year in footer', () => {
    render(<HomePage />);

    // Footer year check
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} By`)).toBeInTheDocument();
  });
});
