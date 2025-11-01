import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  truncateText,
  stripHtmlTags,
  formatTimestamp,
  formatRelativeTime,
  boolToInt,
  intToBool,
  debounce,
  throttle,
} from './utils';

describe('Utils', () => {
  describe('cn - Class Name Utility', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isHidden = false;
      const result = cn('base', isActive && 'active', isHidden && 'hidden');
      expect(result).toBe('base active');
    });

    it('should merge tailwind classes correctly', () => {
      const result = cn('p-4', 'p-8');
      // tailwind-merge should keep only the last p-* class
      expect(result).toBe('p-8');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        active: true,
        hidden: false,
        visible: true,
      });
      expect(result).toContain('active');
      expect(result).not.toContain('hidden');
      expect(result).toContain('visible');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toBe('class1 class2');
    });
  });

  describe('truncateText', () => {
    it('should not truncate text shorter than maxLength', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('should truncate text longer than maxLength', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('should truncate at last space', () => {
      const text = 'This is a very long text';
      const result = truncateText(text, 15);
      expect(result).toBe('This is a very...');
    });

    it('should use custom ellipsis', () => {
      const text = 'This is a long text';
      const result = truncateText(text, 10, '---');
      expect(result).toContain('---');
      expect(result).not.toContain('...');
    });

    it('should handle text with no spaces', () => {
      const text = 'Verylongtextwithoutspaces';
      const result = truncateText(text, 10);
      expect(result).toBe('Verylongte...');
    });

    it('should handle empty string', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    it('should handle single word longer than maxLength', () => {
      const text = 'Supercalifragilisticexpialidocious';
      const result = truncateText(text, 10);
      expect(result).toBe('Supercalif...');
    });

    it('should handle maxLength of 0', () => {
      const text = 'Test text';
      const result = truncateText(text, 0);
      expect(result).toBe('...');
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = stripHtmlTags(html);
      expect(result).toBe('Hello World');
    });

    it('should remove multiple tags', () => {
      const html = '<div><p>Text</p><span>More text</span></div>';
      const result = stripHtmlTags(html);
      expect(result).toBe('Text More text');
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Line 1<br/>Line 2</p>';
      const result = stripHtmlTags(html);
      expect(result).toBe('Line 1 Line 2');
    });

    it('should normalize whitespace', () => {
      const html = '<p>Text   with    multiple   spaces</p>';
      const result = stripHtmlTags(html);
      expect(result).toBe('Text with multiple spaces');
    });

    it('should handle newlines and tabs', () => {
      const html = '<p>Text\n\twith\t\nwhitespace</p>';
      const result = stripHtmlTags(html);
      expect(result).toBe('Text with whitespace');
    });

    it('should handle empty tags', () => {
      const html = '<p></p><div></div>Text';
      const result = stripHtmlTags(html);
      expect(result).toBe('Text');
    });

    it('should handle plain text without tags', () => {
      const text = 'Plain text without HTML';
      const result = stripHtmlTags(text);
      expect(result).toBe('Plain text without HTML');
    });

    it('should handle empty string', () => {
      const result = stripHtmlTags('');
      expect(result).toBe('');
    });

    it('should remove script tags and content', () => {
      const html = '<p>Text</p><script>alert("xss")</script>';
      const result = stripHtmlTags(html);
      expect(result).toContain('Text');
      expect(result).toContain('alert');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><span><strong>Nested</strong> text</span></p></div>';
      const result = stripHtmlTags(html);
      expect(result).toBe('Nested text');
    });
  });

  describe('formatTimestamp', () => {
    it('should format Unix timestamp to readable date', () => {
      const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
      const result = formatTimestamp(timestamp, 'en-US');
      expect(result).toContain('January');
      expect(result).toContain('2021');
    });

    it('should handle different locales', () => {
      const timestamp = 1609459200;
      const resultEN = formatTimestamp(timestamp, 'en-US');
      const resultES = formatTimestamp(timestamp, 'es-ES');
      expect(resultEN).not.toBe(resultES);
    });

    it('should use default locale when not specified', () => {
      const timestamp = 1609459200;
      const result = formatTimestamp(timestamp);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle current timestamp', () => {
      const now = Math.floor(Date.now() / 1000);
      const result = formatTimestamp(now);
      const currentYear = new Date().getFullYear().toString();
      expect(result).toContain(currentYear);
    });

    it('should handle very old timestamps', () => {
      const timestamp = 0; // Unix epoch
      const result = formatTimestamp(timestamp);
      expect(result).toContain('1970');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "Just now" for very recent timestamps', () => {
      const now = Math.floor(Date.now() / 1000);
      const result = formatRelativeTime(now);
      expect(result).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300; // 5 minutes
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toMatch(/\d+ minute(s)? ago/);
    });

    it('should format hours ago', () => {
      const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200; // 2 hours
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toMatch(/\d+ hour(s)? ago/);
    });

    it('should format days ago', () => {
      const threeDaysAgo = Math.floor(Date.now() / 1000) - 259200; // 3 days
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toMatch(/\d+ day(s)? ago/);
    });

    it('should format months ago', () => {
      const twoMonthsAgo = Math.floor(Date.now() / 1000) - 5184000; // ~2 months
      const result = formatRelativeTime(twoMonthsAgo);
      expect(result).toMatch(/\d+ month(s)? ago/);
    });

    it('should format years ago', () => {
      const twoYearsAgo = Math.floor(Date.now() / 1000) - 63072000; // ~2 years
      const result = formatRelativeTime(twoYearsAgo);
      expect(result).toMatch(/\d+ year(s)? ago/);
    });

    it('should use singular for 1 unit', () => {
      const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
      const result = formatRelativeTime(oneMinuteAgo);
      expect(result).toBe('1 minute ago');
    });

    it('should use plural for multiple units', () => {
      const twoMinutesAgo = Math.floor(Date.now() / 1000) - 120;
      const result = formatRelativeTime(twoMinutesAgo);
      expect(result).toBe('2 minutes ago');
    });

    it('should handle 30 seconds ago as "Just now"', () => {
      const thirtySecondsAgo = Math.floor(Date.now() / 1000) - 30;
      const result = formatRelativeTime(thirtySecondsAgo);
      expect(result).toBe('Just now');
    });
  });

  describe('boolToInt', () => {
    it('should convert true to 1', () => {
      expect(boolToInt(true)).toBe(1);
    });

    it('should convert false to 0', () => {
      expect(boolToInt(false)).toBe(0);
    });
  });

  describe('intToBool', () => {
    it('should convert 1 to true', () => {
      expect(intToBool(1)).toBe(true);
    });

    it('should convert 0 to false', () => {
      expect(intToBool(0)).toBe(false);
    });

    it('should convert non-1 values to false', () => {
      expect(intToBool(2)).toBe(false);
      expect(intToBool(-1)).toBe(false);
      expect(intToBool(100)).toBe(false);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call function with last provided arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should allow multiple invocations after wait period', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);

      debouncedFn();
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should allow call after limit period', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should call function immediately on first invocation', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls during throttle period', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle arguments correctly', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1', 'arg2');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

      vi.advanceTimersByTime(100);

      throttledFn('arg3', 'arg4');
      expect(mockFn).toHaveBeenCalledWith('arg3', 'arg4');
    });

    it('should allow rapid succession after limit', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttledFn();
      throttledFn();
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle truncateText with maxLength equal to text length', () => {
      const text = 'Exact length';
      const result = truncateText(text, text.length);
      expect(result).toBe(text);
    });

    it('should handle formatRelativeTime with future timestamp', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      const result = formatRelativeTime(future);
      expect(result).toBe('Just now');
    });

    it('should handle stripHtmlTags with malformed HTML', () => {
      const html = '<p>Unclosed paragraph<div>Mixed tags</p></div>';
      const result = stripHtmlTags(html);
      expect(result).toContain('Unclosed');
      expect(result).toContain('Mixed');
    });

    it('should handle cn with very long class strings', () => {
      const longClass = 'a'.repeat(1000);
      const result = cn(longClass, 'short');
      expect(result).toContain('short');
    });
  });

  describe('Performance', () => {
    it('should handle debounce with many rapid calls efficiently', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      for (let i = 0; i < 1000; i++) {
        debouncedFn();
      }

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle throttle with many rapid calls efficiently', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      for (let i = 0; i < 1000; i++) {
        throttledFn();
      }

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
