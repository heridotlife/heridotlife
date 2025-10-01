import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import PrimaryLink from '../PrimaryLink';

describe('PrimaryLink', () => {
  it('renders link with children', () => {
    render(<PrimaryLink href='/test'>Click me</PrimaryLink>);
    expect(screen.getByRole('link', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with default variant (primary)', () => {
    render(<PrimaryLink href='/test'>Primary Link</PrimaryLink>);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('text-primary-500');
  });

  describe('variants', () => {
    it('renders primary variant', () => {
      render(
        <PrimaryLink variant='primary' href='/test'>
          Primary
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-primary-500');
      expect(link).toHaveClass('hover:text-primary-600');
      expect(link).toHaveClass('active:text-primary-700');
    });

    it('renders basic variant', () => {
      render(
        <PrimaryLink variant='basic' href='/test'>
          Basic
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-black');
      expect(link).toHaveClass('hover:text-gray-600');
      expect(link).toHaveClass('active:text-gray-800');
    });

    it('applies disabled styles for primary variant', () => {
      render(
        <PrimaryLink variant='primary' href='/test'>
          Primary
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('disabled:text-primary-200');
    });

    it('applies disabled styles for basic variant', () => {
      render(
        <PrimaryLink variant='basic' href='/test'>
          Basic
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('disabled:text-gray-300');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(
        <PrimaryLink className='custom-class' href='/test'>
          Custom
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is added', () => {
      render(
        <PrimaryLink className='custom-class' href='/test'>
          Link
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('inline-flex', 'font-medium', 'custom-class');
    });
  });

  describe('href handling', () => {
    it('renders internal link', () => {
      render(<PrimaryLink href='/internal'>Internal Link</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/internal');
      expect(link).not.toHaveAttribute('target', '_blank');
    });

    it('renders external link with target="_blank"', () => {
      render(
        <PrimaryLink href='https://example.com'>External Link</PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('has rel="noopener noreferrer" for external links', () => {
      render(
        <PrimaryLink href='https://example.com'>External Link</PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to link element', () => {
      const ref = jest.fn();
      render(
        <PrimaryLink ref={ref} href='/test'>
          Link
        </PrimaryLink>,
      );
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<PrimaryLink href='/test'>Accessible</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring');
      expect(link).toHaveClass('focus-visible:ring-primary-500');
    });

    it('has focus-visible rounded', () => {
      render(<PrimaryLink href='/test'>Focus</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:rounded');
    });

    it('has focus-visible ring-offset', () => {
      render(<PrimaryLink href='/test'>Focus</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring-offset-2');
    });

    it('preserves aria attributes', () => {
      render(
        <PrimaryLink href='/test' aria-label='Custom label'>
          Link
        </PrimaryLink>,
      );
      const link = screen.getByRole('link', { name: /custom label/i });
      expect(link).toBeInTheDocument();
    });

    it('renders as proper link element', () => {
      render(<PrimaryLink href='/test'>Link</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });
  });

  describe('styling', () => {
    it('has inline-flex display', () => {
      render(<PrimaryLink href='/test'>Flex</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('inline-flex');
    });

    it('has items-center alignment', () => {
      render(<PrimaryLink href='/test'>Centered</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('items-center');
    });

    it('has font-medium weight', () => {
      render(<PrimaryLink href='/test'>Medium</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('font-medium');
    });
  });

  describe('children rendering', () => {
    it('renders text children', () => {
      render(<PrimaryLink href='/test'>Text content</PrimaryLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Text content');
    });

    it('renders complex children', () => {
      render(
        <PrimaryLink href='/test'>
          <strong>Bold</strong> and <em>italic</em>
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('strong')).toHaveTextContent('Bold');
      expect(link.querySelector('em')).toHaveTextContent('italic');
    });
  });

  describe('openNewTab prop', () => {
    it('opens in new tab when openNewTab is true', () => {
      render(
        <PrimaryLink href='/test' openNewTab>
          New Tab
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('does not open in new tab when openNewTab is false', () => {
      render(
        <PrimaryLink href='https://example.com' openNewTab={false}>
          Same Tab
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });

  describe('hover states', () => {
    it('has hover state for primary variant', () => {
      render(
        <PrimaryLink variant='primary' href='/test'>
          Hover
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:text-primary-600');
    });

    it('has hover state for basic variant', () => {
      render(
        <PrimaryLink variant='basic' href='/test'>
          Hover
        </PrimaryLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:text-gray-600');
    });
  });
});
