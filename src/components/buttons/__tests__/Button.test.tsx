import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiMail } from 'react-icons/fi';
import '@testing-library/jest-dom';

import Button from '../Button';

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it('renders with default variant (primary)', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  describe('variants', () => {
    it('renders primary variant', () => {
      render(<Button variant='primary'>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500', 'text-white');
    });

    it('renders outline variant', () => {
      render(<Button variant='outline'>Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-500', 'border-primary-500');
    });

    it('renders ghost variant', () => {
      render(<Button variant='ghost'>Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-500', 'shadow-none');
    });

    it('renders light variant', () => {
      render(<Button variant='light'>Light</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-gray-700');
    });

    it('renders dark variant', () => {
      render(<Button variant='dark'>Dark</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-900', 'text-white');
    });
  });

  describe('sizes', () => {
    it('renders base size by default', () => {
      render(<Button>Base Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5');
    });

    it('renders sm size', () => {
      render(<Button size='sm'>Small Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-2', 'py-1');
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('disables button when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-transparent');
      // Check for spinner class
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides children text when loading', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-transparent');
    });
  });

  describe('icons', () => {
    it('renders left icon', () => {
      render(<Button leftIcon={FiMail}>With Left Icon</Button>);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      render(<Button rightIcon={FiMail}>With Right Icon</Button>);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders both left and right icons', () => {
      render(
        <Button leftIcon={FiMail} rightIcon={FiMail}>
          Both Icons
        </Button>,
      );
      const button = screen.getByRole('button');
      const icons = button.querySelectorAll('svg');
      expect(icons).toHaveLength(2);
    });
  });

  describe('interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} isLoading>
          Loading
        </Button>,
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('isDarkBg prop', () => {
    it('applies dark background hover styles for outline variant', () => {
      render(
        <Button variant='outline' isDarkBg>
          Outline Dark
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-900');
    });

    it('applies dark background hover styles for ghost variant', () => {
      render(
        <Button variant='ghost' isDarkBg>
          Ghost Dark
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-900');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(<Button className='custom-class'>Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('button type', () => {
    it('has type="button" by default', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('can override button type', () => {
      render(<Button type='submit'>Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = jest.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring');
    });

    it('is keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Button</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });
  });
});
