import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { stripHtml } from '../server/utils/stripHtml.js';
import { normalizeStyledUnicode } from '../server/utils/normalizeStyledUnicode.js';

test('decodes Romanian quotation marks in the reported news title', () => {
  const title =
    'Actorul Patrick Stewart, protagonist al francizelor &#8222;X-Men&#8221; și &#8222;Star Trek&#8221;, a murit la 86 de ani';
  assert.equal(
    stripHtml(title),
    'Actorul Patrick Stewart, protagonist al francizelor „X-Men” și „Star Trek”, a murit la 86 de ani'
  );
});

test('decodes decimal, hexadecimal and named entities', () => {
  assert.equal(
    stripHtml('&#8222;Știri&#8221; &#x2014; &ldquo;Dobrogea&rdquo; &amp; &quot;Constanța&quot;'),
    '„Știri” — “Dobrogea” & "Constanța"'
  );
  assert.equal(stripHtml('&#8211; &#8217; &#8230; &copy; &#x1F4F0;'), '– ’ … © 📰');
});

test('strips formatting while preserving Romanian letters and inline word boundaries', () => {
  assert.equal(
    stripHtml('<strong>Știri</strong> din <em>Constanța</em>: pre<b>fix</b>'),
    'Știri din Constanța: prefix'
  );
  assert.equal(stripHtml('<span title="a > b">Țară și școală</span>'), 'Țară și școală');
});

test('normalizes decoded nonbreaking spaces and surrounding whitespace', () => {
  assert.equal(
    stripHtml('  <p>Știri&nbsp; din&#160; Constanța</p>\n\t <p>astăzi</p>  '),
    'Știri din Constanța astăzi'
  );
});

test('handles empty input and preserves ordinary plain text and unknown entities', () => {
  for (const value of ['', null, undefined]) assert.equal(stripHtml(value), '');
  assert.equal(stripHtml('Știri din Constanța'), 'Știri din Constanța');
  assert.equal(stripHtml('A &unknown; B'), 'A &unknown; B');
});

test('encoded markup remains literal text and is escaped by React', () => {
  const text = stripHtml('&lt;img src=x onerror=alert(1)&gt; &amp; știri');
  assert.equal(text, '<img src=x onerror=alert(1)> & știri');
  assert.equal(
    renderToStaticMarkup(createElement('h2', null, text)),
    '<h2>&lt;img src=x onerror=alert(1)&gt; &amp; știri</h2>'
  );
  assert.equal(stripHtml('&amp;#8222;text&amp;#8221;'), '&#8222;text&#8221;');
});

test('excludes non-content script and style elements from plain text', () => {
  assert.equal(
    stripHtml('<script>alert(1)</script><style>p{color:red}</style><p>Știri</p>'),
    'Știri'
  );
});

test('entity decoding composes with existing styled Unicode normalization', () => {
  assert.equal(
    normalizeStyledUnicode(stripHtml('<b>&#x1D400;</b> &amp; Ｂ: știri')),
    'A & B: știri'
  );
});
