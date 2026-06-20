import { describe, it, expect } from 'vitest';
import {
  tokenizeSearchQuery,
  buildFtsMatchQuery,
  buildHighlightedSnippet,
  escapeHtml,
  escapeRegExp,
} from './utils';

describe('tokenizeSearchQuery', () => {
  it('splits into lowercased word tokens', () => {
    expect(tokenizeSearchQuery('Cloud Native')).toEqual(['cloud', 'native']);
  });

  it('strips FTS5 operators and punctuation', () => {
    // Quotes, stars, parens, colons, hyphens must not survive as tokens.
    expect(tokenizeSearchQuery('"foo" OR (bar)* -baz:qux')).toEqual([
      'foo',
      'or',
      'bar',
      'baz',
      'qux',
    ]);
  });

  it('keeps unicode letters and numbers', () => {
    expect(tokenizeSearchQuery('café 2024 東京')).toEqual(['café', '2024', '東京']);
  });

  it('returns an empty array for punctuation-only input', () => {
    expect(tokenizeSearchQuery('"*()-:')).toEqual([]);
  });

  it('caps the number of tokens', () => {
    const many = Array.from({ length: 20 }, (_, i) => `t${i}`).join(' ');
    expect(tokenizeSearchQuery(many, 5)).toHaveLength(5);
  });
});

describe('buildFtsMatchQuery', () => {
  it('builds quoted prefix tokens AND-ed together', () => {
    expect(buildFtsMatchQuery('cloud native')).toBe('"cloud"* "native"*');
  });

  it('returns an empty string when there are no usable tokens', () => {
    expect(buildFtsMatchQuery('   "*"  ')).toBe('');
  });

  it('never emits unbalanced quotes from hostile input', () => {
    const out = buildFtsMatchQuery('a" OR "1"="1');
    // Every token is wrapped exactly in `"..."*`, so quotes always balance.
    const quoteCount = (out.match(/"/g) || []).length;
    expect(quoteCount % 2).toBe(0);
    expect(out).not.toContain('""');
  });
});

describe('buildHighlightedSnippet', () => {
  it('returns empty string for empty source', () => {
    expect(buildHighlightedSnippet('', ['x'])).toBe('');
  });

  it('strips HTML tags and highlights the matched term', () => {
    const html = '<p>Deploying to <strong>Cloudflare</strong> Workers is fast.</p>';
    const out = buildHighlightedSnippet(html, ['cloudflare']);
    expect(out).toContain('<mark>Cloudflare</mark>');
    expect(out).not.toContain('<strong>');
    expect(out).not.toContain('<p>');
  });

  it('escapes HTML so source markup cannot inject elements (XSS-safe)', () => {
    const malicious = 'safe <img src=x onerror=alert(1)> tail keyword';
    const out = buildHighlightedSnippet(malicious, ['keyword']);
    expect(out).not.toContain('<img');
    expect(out).toContain('<mark>keyword</mark>');
    // The only tags present are the <mark> wrappers we add.
    expect(out.replace(/<\/?mark>/g, '')).not.toMatch(/<[a-z]/i);
  });

  it('falls back to a truncated snippet when no term matches', () => {
    const text = 'a'.repeat(500);
    const out = buildHighlightedSnippet(text, ['zzz'], { maxLength: 50 });
    expect(out).not.toContain('<mark>');
    expect(out.length).toBeLessThan(120);
  });

  it('windows long content around the first match', () => {
    const text = `${'x '.repeat(200)}needle ${'y '.repeat(200)}`;
    const out = buildHighlightedSnippet(text, ['needle'], { contextRadius: 30 });
    expect(out).toContain('<mark>needle</mark>');
    expect(out.startsWith('…')).toBe(true);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('escapeHtml / escapeRegExp', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  it('escapes regex metacharacters so they match literally', () => {
    const escaped = escapeRegExp('a.b*c+');
    expect(new RegExp(escaped).test('a.b*c+')).toBe(true);
    expect(new RegExp(escaped).test('axbxc')).toBe(false);
  });
});
