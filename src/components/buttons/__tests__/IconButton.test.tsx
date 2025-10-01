import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiSettings } from 'react-icons/fi';
import '@testing-library/jest-dom';

import IconButton from '../IconButton';

describe('IconButton', () => {
  it('renders icon button with icon', () => {
    render(<IconButton icon={FiSettings} aria-label='Settings' />);
    const button = screen.getByRole('button', { name: /settings/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with default variant (primary)', () => {
    render(<IconButton icon={FiSettings} aria-label='Settings' />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  describe('variants', () => {
    it('renders primary variant', () => {
      render(
        <IconButton variant='primary' icon={FiSettings} aria-label='Primary' />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500', 'text-white');
    });

    it('renders outline variant', () => {
      render(
        <IconButton variant='outline' icon={FiSettings} aria-label='Outline' />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-500', 'border-primary-500');
    });

    it('renders ghost variant', () => {
      render(
        <IconButton variant='ghost' icon={FiSettings} aria-label='Ghost' />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-500', 'shadow-none');
    });

    it('renders light variant', () => {
      render(
        <IconButton variant='light' icon={FiSettings} aria-label='Light' />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white', 'text-gray-700');
    });

    it('renders dark variant', () => {
      render(<IconButton variant='dark' icon={FiSettings} aria-label='Dark' />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-900', 'text-white');
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<IconButton disabled icon={FiSettings} aria-label='Disabled' />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('disables button when isLoading is true', () => {
      render(<IconButton isLoading icon={FiSettings} aria-label='Loading' />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when isLoading is true', () => {
      render(<IconButton isLoading icon={FiSettings} aria-label='Loading' />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-transparent');
      // Check for spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('applies correct spinner color for primary variant', () => {
      render(
        <IconButton
          isLoading
          variant='primary'
          icon={FiSettings}
          aria-label='Loading'
        />,
      );
      const button = screen.getByRole('button');
      const spinnerContainer = button.querySelector('.absolute');
      expect(spinnerContainer).toHaveClass('text-white');
    });

    it('applies correct spinner color for light variant', () => {
      render(
        <IconButton
          isLoading
          variant='light'
          icon={FiSettings}
          aria-label='Loading'
        />,
      );
      const button = screen.getByRole('button');
      const spinnerContainer = button.querySelector('.absolute');
      expect(spinnerContainer).toHaveClass('text-black');
    });

    it('applies correct spinner color for outline variant', () => {
      render(
        <IconButton
          isLoading
          variant='outline'
          icon={FiSettings}
          aria-label='Loading'
        />,
      );
      const button = screen.getByRole('button');
      const spinnerContainer = button.querySelector('.absolute');
      expect(spinnerContainer).toHaveClass('text-primary-500');
    });
  });

  describe('interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <IconButton
          onClick={handleClick}
          icon={FiSettings}
          aria-label='Click me'
        />,
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <IconButton
          onClick={handleClick}
          disabled
          icon={FiSettings}
          aria-label='Disabled'
        />,
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <IconButton
          onClick={handleClick}
          isLoading
          icon={FiSettings}
          aria-label='Loading'
        />,
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('isDarkBg prop', () => {
    it('applies dark background hover styles for outline variant', () => {
      render(
        <IconButton
          variant='outline'
          isDarkBg
          icon={FiSettings}
          aria-label='Dark bg'
        />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-900');
    });

    it('applies dark background hover styles for ghost variant', () => {
      render(
        <IconButton
          variant='ghost'
          isDarkBg
          icon={FiSettings}
          aria-label='Dark bg'
        />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-900');
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className to button', () => {
      render(
        <IconButton
          className='custom-class'
          icon={FiSettings}
          aria-label='Custom'
        />,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('accepts and applies custom icon className', () => {
      render(
        <IconButton
          icon={FiSettings}
          classNames={{ icon: 'custom-icon-class' }}
          aria-label='Custom icon'
        />,
      );
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveClass('custom-icon-class');
    });
  });

  describe('button type', () => {
    it('has type="button" by default', () => {
      render(<IconButton icon={FiSettings} aria-label='Button' />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('can override button type', () => {
      render(
        <IconButton type='submit' icon={FiSettings} aria-label='Submit' />,
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = jest.fn();
      render(<IconButton ref={ref} icon={FiSettings} aria-label='Ref' />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<IconButton icon={FiSettings} aria-label='Accessible' />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring');
    });

    it('requires aria-label or aria-labelledby for accessibility', () => {
      // Icon buttons should have accessible labels
      render(<IconButton icon={FiSettings} aria-label='Settings button' />);
      expect(
        screen.getByRole('button', { name: /settings button/i }),
      ).toBeInTheDocument();
    });

    it('is keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <IconButton
          onClick={handleClick}
          icon={FiSettings}
          aria-label='Button'
        />,
      );
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('sizing', () => {
    it('has minimum width and height for touch targets', () => {
      render(<IconButton icon={FiSettings} aria-label='Touch target' />);
      const button = screen.getByRole('button');
      // Check for minimum size classes
      expect(button).toHaveClass('min-h-[28px]', 'min-w-[28px]');
    });
  });

  describe('without icon prop', () => {
    it('renders button without icon when icon prop is not provided', () => {
      render(<IconButton aria-label='No icon' />);
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });
  });
});
