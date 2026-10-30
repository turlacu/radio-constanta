import { load } from 'cheerio';

// Parse once so all HTML entities are decoded without interpreting encoded
// markup a second time. Callers must continue rendering the result as text.
export function stripHtml(html) {
  if (!html) return '';

  const $ = load(html, {}, false);
  $('script, style').remove();
  return $.root().text().replace(/\s+/g, ' ').trim();
}
