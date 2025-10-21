/**
 * Utility functions for blog feature
 * @module lib/blog/utils
 */

import {
  truncateText,
  stripHtmlTags,
  formatTimestamp,
  formatRelativeTime,
  boolToInt,
  intToBool,
  debounce,
  throttle,
} from '../utils';

// Re-export shared utilities for convenience
export {
  truncateText,
  stripHtmlTags as stripHtml,
  formatTimestamp as formatDate,
  formatRelativeTime,
  boolToInt,
  intToBool,
  debounce,
  throttle,
};

/**
 * Calculate reading time based on word count
 * @param content - The HTML or plain text content to analyze
 * @param readingSpeed - Words per minute (default: 200 WPM for average readers)
 * @returns Estimated reading time in minutes (minimum 1 minute)
 */
export function calculateReadingTime(content: string, readingSpeed: number = 200): number {
  const plainText = stripHtmlTags(content);
  const words = plainText.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / readingSpeed);
  return Math.max(1, minutes);
}

/**
 * Generate excerpt from content if not provided
 */
export function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = stripHtmlTags(content);
  return truncateText(plainText, maxLength);
}

/**
 * Generate keywords from content
 */
export function generateKeywords(title: string, content: string, maxKeywords: number = 10): string {
  // Combine title and content
  const text = `${title} ${stripHtmlTags(content)}`.toLowerCase();

  // Common English stop words to filter out
  const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'that',
    'the',
    'to',
    'was',
    'will',
    'with',
    'this',
    'but',
    'they',
    'have',
    'had',
    'what',
    'when',
    'where',
    'who',
    'which',
    'why',
    'how',
  ]);

  // Extract words (alphanumeric only)
  const words = text.match(/\b[a-z0-9]{3,}\b/g) || [];

  // Count word frequency
  const wordCount = new Map<string, number>();
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  }

  // Sort by frequency and take top N
  const sortedWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return sortedWords.join(', ');
}

/**
 * Validate that a date is not in the future
 */
export function isValidPublishDate(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return timestamp <= now;
}

/**
 * Create a URL-safe filename from a string
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract the first image URL from HTML content
 */
export function extractFirstImage(html: string): string | null {
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = html.match(imgRegex);
  return match ? match[1] : null;
}

/**
 * Generate table of contents from HTML headings
 */
export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function generateTableOfContents(html: string): TOCItem[] {
  const headingRegex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  const toc: TOCItem[] = [];

  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2];
    const text = stripHtmlTags(match[3]);

    toc.push({ id, text, level });
  }

  return toc;
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, searchQuery: string): string {
  if (!searchQuery) return text;

  const terms = searchQuery.split(/\s+/).filter(Boolean);
  let highlighted = text;

  for (const term of terms) {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }

  return highlighted;
}

/**
 * Get reading progress percentage
 */
export function getReadingProgress(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number {
  if (scrollHeight <= clientHeight) return 100;

  const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
  return Math.min(100, Math.max(0, progress));
}
