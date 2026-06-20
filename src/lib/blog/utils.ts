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
 * Escape a string for safe insertion into HTML text content.
 */
export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

/**
 * Escape a string so it can be used literally inside a RegExp.
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tokenize a free-text search query into safe, lowercased word tokens.
 *
 * Only Unicode letters and numbers are kept, which strips every FTS5 operator
 * (`"`, `*`, `:`, `-`, `(`, `)`, `AND`, `OR`, `NEAR`, ...) so user input can
 * never break out of a quoted phrase or inject query syntax.
 */
export function tokenizeSearchQuery(query: string, maxTokens: number = 10): string[] {
  const matches = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return matches.filter((t) => t.length > 0).slice(0, maxTokens);
}

/**
 * Build a safe FTS5 MATCH expression from raw user input.
 *
 * Each token is wrapped in a quoted phrase with a trailing prefix token (`*`)
 * so partial words match, and tokens are AND-ed together (implicit). Returns an
 * empty string when the query has no usable tokens.
 */
export function buildFtsMatchQuery(query: string, maxTokens: number = 10): string {
  return tokenizeSearchQuery(query, maxTokens)
    .map((token) => `"${token}"*`)
    .join(' ');
}

/**
 * Build an HTML-safe, highlighted snippet from (possibly HTML) source text.
 *
 * The source is stripped of tags, a window around the first matching term is
 * extracted, the result is HTML-escaped, and matched terms are wrapped in
 * `<mark>`. Because escaping happens before the (single-pass) highlight, the
 * only HTML in the output is the `<mark>` tags this function inserts.
 */
export function buildHighlightedSnippet(
  source: string,
  terms: string[],
  options: { contextRadius?: number; maxLength?: number } = {}
): string {
  const { contextRadius = 120, maxLength = 240 } = options;
  const plain = stripHtmlTags(source);
  if (!plain) return '';

  const lower = plain.toLowerCase();
  let pos = -1;
  let matchLen = 0;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1 && (pos === -1 || i < pos)) {
      pos = i;
      matchLen = term.length;
    }
  }

  let snippet: string;
  if (pos === -1) {
    snippet = truncateText(plain, maxLength, '…');
  } else {
    const start = Math.max(0, pos - contextRadius);
    const end = Math.min(plain.length, pos + matchLen + contextRadius);
    snippet = plain.slice(start, end);
    // Trim partial leading/trailing words and add ellipses where we cut.
    if (start > 0) snippet = '…' + snippet.replace(/^\S+\s/, '');
    if (end < plain.length) snippet = snippet.replace(/\s\S+$/, '') + '…';
  }

  const escaped = escapeHtml(snippet);
  const pattern = terms
    .filter(Boolean)
    .map((t) => escapeRegExp(escapeHtml(t)))
    .join('|');
  if (!pattern) return escaped;

  return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<mark>$1</mark>');
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
