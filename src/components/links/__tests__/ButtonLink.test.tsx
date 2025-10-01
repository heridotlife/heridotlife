import { render, screen } from '@testing-library/react';
import { FiMail } from 'react-icons/fi';
import '@testing-library/jest-dom';

import ButtonLink from '../ButtonLink';

describe('ButtonLink', () => {
  it('renders link with children', () => {
    render(<ButtonLink href='/test'>Click me</ButtonLink>);
    expect(screen.getByRole('link', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with default variant (primary)', () => {
    render(<ButtonLink href='/test'>Primary Link</ButtonLink>);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('bg-primary-500');
  });

  describe('variants', () => {
    it('renders primary variant', () => {
      render(
        <ButtonLink variant='primary' href='/test'>
          Primary
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-primary-500', 'text-white');
    });

    it('renders outline variant', () => {
      render(
        <ButtonLink variant='outline' href='/test'>
          Outline
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-primary-500', 'border-primary-500');
    });

    it('renders ghost variant', () => {
      render(
        <ButtonLink variant='ghost' href='/test'>
          Ghost
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-primary-500', 'shadow-none');
    });

    it('renders light variant', () => {
      render(
        <ButtonLink variant='light' href='/test'>
          Light
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-white', 'text-gray-700');
    });

    it('renders dark variant', () => {
      render(
        <ButtonLink variant='dark' href='/test'>
          Dark
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-gray-900', 'text-white');
    });
  });

  describe('sizes', () => {
    it('renders base size by default', () => {
      render(<ButtonLink href='/test'>Base Size</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('px-3', 'py-1.5');
    });

    it('renders sm size', () => {
      render(
        <ButtonLink size='sm' href='/test'>
          Small Size
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('px-2', 'py-1');
    });
  });

  describe('icons', () => {
    it('renders left icon', () => {
      render(
        <ButtonLink leftIcon={FiMail} href='/test'>
          With Left Icon
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(
        <ButtonLink rightIcon={FiMail} href='/test'>
          With Right Icon
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link.querySelector('svg')).toBeInTheDocument();
    });

    it('renders both left and right icons', () => {
      render(
        <ButtonLink leftIcon={FiMail} rightIcon={FiMail} href='/test'>
          Both Icons
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      const icons = link.querySelectorAll('svg');
      expect(icons).toHaveLength(2);
    });

    it('applies custom icon className', () => {
      render(
        <ButtonLink
          leftIcon={FiMail}
          classNames={{ leftIcon: 'custom-left-icon' }}
          href='/test'
        >
          Custom Icon
        </ButtonLink>,
      );
      const icon = screen.getByRole('link').querySelector('svg');
      expect(icon).toHaveClass('custom-left-icon');
    });
  });

  describe('isDarkBg prop', () => {
    it('applies dark background hover styles for outline variant', () => {
      render(
        <ButtonLink variant='outline' isDarkBg href='/test'>
          Outline Dark
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:bg-gray-900');
    });

    it('applies dark background hover styles for ghost variant', () => {
      render(
        <ButtonLink variant='ghost' isDarkBg href='/test'>
          Ghost Dark
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:bg-gray-900');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(
        <ButtonLink className='custom-class' href='/test'>
          Custom
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });
  });

  describe('href handling', () => {
    it('renders internal link', () => {
      render(<ButtonLink href='/internal'>Internal Link</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/internal');
      expect(link).not.toHaveAttribute('target', '_blank');
    });

    it('renders external link with target="_blank"', () => {
      render(<ButtonLink href='https://example.com'>External Link</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('has rel="noopener noreferrer" for external links', () => {
      render(<ButtonLink href='https://example.com'>External Link</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to link element', () => {
      const ref = jest.fn();
      render(
        <ButtonLink ref={ref} href='/test'>
          Link
        </ButtonLink>,
      );
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<ButtonLink href='/test'>Accessible</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring');
    });

    it('preserves aria attributes', () => {
      render(
        <ButtonLink href='/test' aria-label='Custom label'>
          Link
        </ButtonLink>,
      );
      const link = screen.getByRole('link', { name: /custom label/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has rounded corners', () => {
      render(<ButtonLink href='/test'>Rounded</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('rounded');
    });

    it('has shadow', () => {
      render(<ButtonLink href='/test'>Shadow</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('shadow-sm');
    });

    it('has transition colors', () => {
      render(<ButtonLink href='/test'>Transition</ButtonLink>);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('transition-colors');
    });
  });

  describe('openNewTab prop', () => {
    it('opens in new tab when openNewTab is true', () => {
      render(
        <ButtonLink href='/test' openNewTab>
          New Tab
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('does not open in new tab when openNewTab is false', () => {
      render(
        <ButtonLink href='https://example.com' openNewTab={false}>
          Same Tab
        </ButtonLink>,
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });
});
