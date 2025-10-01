import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      const result = cn('bg-red-500', 'text-white', 'p-4');
      expect(result).toBe('bg-red-500 text-white p-4');
    });

    it('handles conditional classes with objects', () => {
      const result = cn('base-class', {
        'active-class': true,
        'inactive-class': false,
      });
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('inactive-class');
    });

    it('handles conditional classes with arrays', () => {
      const result = cn(['class1', 'class2'], ['class3']);
      expect(result).toBe('class1 class2 class3');
    });

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('merges Tailwind conflicting classes correctly', () => {
      // tailwind-merge should keep the last conflicting class
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('handles empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles complex nested structures', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'btn',
        {
          'btn-active': isActive,
          'btn-disabled': isDisabled,
        },
        isActive && 'text-blue-500',
        'hover:bg-gray-100',
      );
      expect(result).toContain('btn');
      expect(result).toContain('btn-active');
      expect(result).toContain('text-blue-500');
      expect(result).toContain('hover:bg-gray-100');
      expect(result).not.toContain('btn-disabled');
    });

    it('handles string with multiple spaces', () => {
      const result = cn('class1   class2    class3');
      expect(result).toBe('class1 class2 class3');
    });
  });
});
