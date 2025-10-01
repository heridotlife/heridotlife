import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import TextButton from '../TextButton';

describe('TextButton', () => {
  it('renders button with children', () => {
    render(<TextButton>Click me</TextButton>);
    expect(
      screen.getByRole('button', { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it('renders with default variant (primary)', () => {
    render(<TextButton>Primary Button</TextButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-primary-500');
  });

  describe('variants', () => {
    it('renders primary variant', () => {
      render(<TextButton variant='primary'>Primary</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-500');
      expect(button).toHaveClass('hover:text-primary-600');
    });

    it('renders basic variant', () => {
      render(<TextButton variant='basic'>Basic</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-black');
      expect(button).toHaveClass('hover:text-gray-600');
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<TextButton disabled>Disabled</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('applies disabled text color for primary variant', () => {
      render(
        <TextButton variant='primary' disabled>
          Disabled
        </TextButton>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:text-primary-200');
    });

    it('applies disabled text color for basic variant', () => {
      render(
        <TextButton variant='basic' disabled>
          Disabled
        </TextButton>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:text-gray-300');
    });
  });

  describe('interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<TextButton onClick={handleClick}>Click me</TextButton>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <TextButton onClick={handleClick} disabled>
          Disabled
        </TextButton>,
      );
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('accepts and applies custom className', () => {
      render(<TextButton className='custom-class'>Custom</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is added', () => {
      render(<TextButton className='custom-class'>Custom</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button', 'inline-flex', 'custom-class');
    });
  });

  describe('button type', () => {
    it('has type="button" by default', () => {
      render(<TextButton>Button</TextButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('can override button type', () => {
      render(<TextButton type='submit'>Submit</TextButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = jest.fn();
      render(<TextButton ref={ref}>Button</TextButton>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has focus-visible ring styles', () => {
      render(<TextButton>Accessible</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring');
    });

    it('is keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<TextButton onClick={handleClick}>Button</TextButton>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has font-semibold styling', () => {
      render(<TextButton>Button</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('font-semibold');
    });

    it('has transition duration class', () => {
      render(<TextButton>Button</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition', 'duration-100');
    });

    it('has justify-center for centering content', () => {
      render(<TextButton>Button</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('justify-center');
    });
  });

  describe('hover states', () => {
    it('has hover styles for primary variant', () => {
      render(<TextButton variant='primary'>Hover me</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:text-primary-600');
    });

    it('has hover styles for basic variant', () => {
      render(<TextButton variant='basic'>Hover me</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:text-gray-600');
    });
  });

  describe('active states', () => {
    it('has active styles for primary variant', () => {
      render(<TextButton variant='primary'>Active</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:text-primary-700');
    });

    it('has active styles for basic variant', () => {
      render(<TextButton variant='basic'>Active</TextButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:text-gray-800');
    });
  });
});
