// Normalize styled Unicode letters/digits (math alphanumeric, fullwidth)
// to plain ASCII so article/list text always renders with the app font.
const RANGES = [
  // Mathematical Bold
  { start: 0x1d400, end: 0x1d419, base: 0x41 }, // A-Z
  { start: 0x1d41a, end: 0x1d433, base: 0x61 }, // a-z
  { start: 0x1d7ce, end: 0x1d7d7, base: 0x30 }, // 0-9
  // Mathematical Italic
  { start: 0x1d434, end: 0x1d44d, base: 0x41 },
  { start: 0x1d44e, end: 0x1d467, base: 0x61 },
  // Mathematical Bold Italic
  { start: 0x1d468, end: 0x1d481, base: 0x41 },
  { start: 0x1d482, end: 0x1d49b, base: 0x61 },
  // Mathematical Script / Bold Script
  { start: 0x1d49c, end: 0x1d4b5, base: 0x41 },
  { start: 0x1d4b6, end: 0x1d4cf, base: 0x61 },
  { start: 0x1d4d0, end: 0x1d4e9, base: 0x41 },
  { start: 0x1d4ea, end: 0x1d503, base: 0x61 },
  // Mathematical Fraktur / Bold Fraktur
  { start: 0x1d504, end: 0x1d51d, base: 0x41 },
  { start: 0x1d51e, end: 0x1d537, base: 0x61 },
  { start: 0x1d56c, end: 0x1d585, base: 0x41 },
  { start: 0x1d586, end: 0x1d59f, base: 0x61 },
  // Mathematical Double-Struck
  { start: 0x1d538, end: 0x1d551, base: 0x41 },
  { start: 0x1d552, end: 0x1d56b, base: 0x61 },
  { start: 0x1d7d8, end: 0x1d7e1, base: 0x30 },
  // Mathematical Sans-Serif variants
  { start: 0x1d5a0, end: 0x1d5b9, base: 0x41 },
  { start: 0x1d5ba, end: 0x1d5d3, base: 0x61 },
  { start: 0x1d5d4, end: 0x1d5ed, base: 0x41 },
  { start: 0x1d5ee, end: 0x1d607, base: 0x61 },
  { start: 0x1d608, end: 0x1d621, base: 0x41 },
  { start: 0x1d622, end: 0x1d63b, base: 0x61 },
  { start: 0x1d63c, end: 0x1d655, base: 0x41 },
  { start: 0x1d656, end: 0x1d66f, base: 0x61 },
  { start: 0x1d7e2, end: 0x1d7eb, base: 0x30 },
  { start: 0x1d7ec, end: 0x1d7f5, base: 0x30 },
  // Mathematical Monospace
  { start: 0x1d670, end: 0x1d689, base: 0x41 },
  { start: 0x1d68a, end: 0x1d6a3, base: 0x61 },
  { start: 0x1d7f6, end: 0x1d7ff, base: 0x30 },
  // Fullwidth Latin / digits
  { start: 0xff21, end: 0xff3a, base: 0x41 },
  { start: 0xff41, end: 0xff5a, base: 0x61 },
  { start: 0xff10, end: 0xff19, base: 0x30 },
];

const mapStyledCodePoint = (cp) => {
  for (const range of RANGES) {
    if (cp >= range.start && cp <= range.end) {
      return String.fromCodePoint(range.base + (cp - range.start));
    }
  }
  return null;
};

export function normalizeStyledUnicode(input) {
  if (!input) return '';

  let output = '';
  for (const char of input) {
    const cp = char.codePointAt(0);
    const normalized = mapStyledCodePoint(cp);
    output += normalized || char;
  }
  return output;
}

export default normalizeStyledUnicode;
