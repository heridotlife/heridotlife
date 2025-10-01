import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import UnderlineLink from '../UnderlineLink';

describe('UnderlineLink', () => {
  it('renders link with children', () => {
    render(<UnderlineLink href='/test'>Click me</UnderlineLink>);
    expect(screen.getByRole('link', { name: /click me/i })).toBeInTheDocument();
  });

  describe('styling', () => {
    it('has animated-underline class', () => {
      render(<UnderlineLink href='/test'>Underline</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('animated-underline');
    });

    it('has custom-link class', () => {
      render(<UnderlineLink href='/test'>Custom</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-link');
    });

    it('has inline-flex display', () => {
      render(<UnderlineLink href='/test'>Flex</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('inline-flex');
    });

    it('has items-center alignment', () => {
      render(<UnderlineLink href='/test'>Centered</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('items-center');
    });

    it('has font-medium weight', () => {
      render(<UnderlineLink href='/test'>Medium</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('font-medium');
    });

    it('has border-bottom dotted', () => {
      render(<UnderlineLink href='/test'>Border</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('border-b', 'border-dotted');
    });

    it('has border-dark color', () => {
      render(<UnderlineLink href='/test'>Dark border</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('border-dark');
    });

    it('has hover border style', () => {
      render(<UnderlineLink href='/test'>Hover</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:border-black/0');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(
        <UnderlineLink className='custom-class' href='/test'>
          Custom
        </UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is added', () => {
      render(
        <UnderlineLink className='custom-class' href='/test'>
          Link
        </UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass(
        'animated-underline',
        'custom-link',
        'custom-class',
      );
    });
  });

  describe('href handling', () => {
    it('renders internal link', () => {
      render(<UnderlineLink href='/internal'>Internal Link</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/internal');
      expect(link).not.toHaveAttribute('target', '_blank');
    });

    it('renders external link with target="_blank"', () => {
      render(
        <UnderlineLink href='https://example.com'>External Link</UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('has rel="noopener noreferrer" for external links', () => {
      render(
        <UnderlineLink href='https://example.com'>External Link</UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders anchor links without target="_blank"', () => {
      render(<UnderlineLink href='#section'>Anchor Link</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#section');
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to link element', () => {
      const ref = jest.fn();
      render(
        <UnderlineLink ref={ref} href='/test'>
          Link
        </UnderlineLink>,
      );
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<UnderlineLink href='/test'>Accessible</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring');
      expect(link).toHaveClass('focus-visible:ring-primary-500');
    });

    it('has focus-visible rounded', () => {
      render(<UnderlineLink href='/test'>Focus</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:rounded');
    });

    it('has focus-visible ring-offset', () => {
      render(<UnderlineLink href='/test'>Focus</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring-offset-2');
    });

    it('preserves aria attributes', () => {
      render(
        <UnderlineLink href='/test' aria-label='Custom label'>
          Link
        </UnderlineLink>,
      );
      const link = screen.getByRole('link', { name: /custom label/i });
      expect(link).toBeInTheDocument();
    });

    it('renders as proper link element', () => {
      render(<UnderlineLink href='/test'>Link</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link.tagName).toBe('A');
    });
  });

  describe('children rendering', () => {
    it('renders text children', () => {
      render(<UnderlineLink href='/test'>Text content</UnderlineLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Text content');
    });

    it('renders complex children', () => {
      render(
        <UnderlineLink href='/test'>
          <strong>Bold</strong> and <em>italic</em>
        </UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('strong')).toHaveTextContent('Bold');
      expect(link.querySelector('em')).toHaveTextContent('italic');
    });

    it('can render icons as children', () => {
      render(
        <UnderlineLink href='/test'>
          <svg data-testid='icon' />
          Link with icon
        </UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('[data-testid="icon"]')).toBeInTheDocument();
    });
  });

  describe('openNewTab prop', () => {
    it('opens in new tab when openNewTab is true', () => {
      render(
        <UnderlineLink href='/test' openNewTab>
          New Tab
        </UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('does not open in new tab when openNewTab is false', () => {
      render(
        <UnderlineLink href='https://example.com' openNewTab={false}>
          Same Tab
        </UnderlineLink>,
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });

  describe('additional props', () => {
    it('passes through additional HTML attributes', () => {
      render(
        <UnderlineLink
          href='/test'
          data-testid='custom-link'
          title='Link title'
        >
          Link
        </UnderlineLink>,
      );
      const link = screen.getByTestId('custom-link');
      expect(link).toHaveAttribute('title', 'Link title');
    });
  });
});
