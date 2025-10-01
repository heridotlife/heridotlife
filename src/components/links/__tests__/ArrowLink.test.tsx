import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ArrowLink from '../ArrowLink';

describe('ArrowLink', () => {
  it('renders link with children and arrow', () => {
    render(<ArrowLink href='/test'>Go to page</ArrowLink>);
    const link = screen.getByRole('link', { name: /go to page/i });
    expect(link).toBeInTheDocument();
    expect(link.querySelector('svg')).toBeInTheDocument();
  });

  describe('direction prop', () => {
    it('renders arrow on right by default', () => {
      render(<ArrowLink href='/test'>Next</ArrowLink>);
      const link = screen.getByRole('link');
      const svg = link.querySelector('svg');
      expect(svg).not.toHaveClass('rotate-180');
    });

    it('renders arrow on left when direction is "left"', () => {
      render(
        <ArrowLink href='/test' direction='left'>
          Previous
        </ArrowLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('flex-row-reverse');
      const svg = link.querySelector('svg');
      expect(svg).toHaveClass('rotate-180');
    });

    it('renders arrow on right when direction is "right"', () => {
      render(
        <ArrowLink href='/test' direction='right'>
          Next
        </ArrowLink>,
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveClass('flex-row-reverse');
    });
  });

  describe('href prop', () => {
    it('renders internal link with href starting with /', () => {
      render(<ArrowLink href='/internal'>Internal Link</ArrowLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/internal');
      expect(link).not.toHaveAttribute('target', '_blank');
    });

    it('renders external link with href not starting with /', () => {
      render(<ArrowLink href='https://example.com'>External Link</ArrowLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(
        <ArrowLink href='/test' className='custom-class'>
          Custom
        </ArrowLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is added', () => {
      render(
        <ArrowLink href='/test' className='custom-class'>
          Link
        </ArrowLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('group', 'custom-class');
    });
  });

  describe('SVG arrow animation', () => {
    it('has transition classes on arrow', () => {
      render(<ArrowLink href='/test'>Animated</ArrowLink>);
      const svg = screen.getByRole('link').querySelector('svg');
      expect(svg).toHaveClass('transition-transform');
    });

    it('has group-hover animation class', () => {
      render(<ArrowLink href='/test'>Hover</ArrowLink>);
      const svg = screen.getByRole('link').querySelector('svg');
      expect(svg).toHaveClass('group-hover:translate-x-0');
    });
  });

  describe('accessibility', () => {
    it('renders as a proper link element', () => {
      render(<ArrowLink href='/test'>Accessible Link</ArrowLink>);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });

    it('preserves aria attributes', () => {
      render(
        <ArrowLink href='/test' aria-label='Custom label'>
          Link
        </ArrowLink>,
      );
      const link = screen.getByRole('link', { name: /custom label/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('custom component via as prop', () => {
    it('uses UnderlineLink as default component', () => {
      render(<ArrowLink href='/test'>Default</ArrowLink>);
      const link = screen.getByRole('link');
      // UnderlineLink adds specific classes
      expect(link).toHaveClass('animated-underline');
    });
  });

  describe('children rendering', () => {
    it('wraps children in span', () => {
      render(<ArrowLink href='/test'>Text content</ArrowLink>);
      const link = screen.getByRole('link');
      const span = link.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span).toHaveTextContent('Text content');
    });

    it('renders complex children', () => {
      render(
        <ArrowLink href='/test'>
          <strong>Bold</strong> and <em>italic</em>
        </ArrowLink>,
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('strong')).toHaveTextContent('Bold');
      expect(link.querySelector('em')).toHaveTextContent('italic');
    });
  });

  describe('arrow SVG structure', () => {
    it('renders SVG with correct viewBox', () => {
      render(<ArrowLink href='/test'>Arrow</ArrowLink>);
      const svg = screen.getByRole('link').querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    });

    it('renders SVG with correct size attributes', () => {
      render(<ArrowLink href='/test'>Arrow</ArrowLink>);
      const svg = screen.getByRole('link').querySelector('svg');
      expect(svg).toHaveAttribute('width', '1em');
      expect(svg).toHaveAttribute('height', '1em');
    });

    it('contains path elements for arrow shape', () => {
      render(<ArrowLink href='/test'>Arrow</ArrowLink>);
      const svg = screen.getByRole('link').querySelector('svg');
      const paths = svg?.querySelectorAll('path');
      expect(paths).toHaveLength(2);
    });
  });

  describe('gap spacing', () => {
    it('has gap class for spacing between text and arrow', () => {
      render(<ArrowLink href='/test'>Spaced</ArrowLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('gap-[0.25em]');
    });
  });
});
