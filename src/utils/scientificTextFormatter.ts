/**
 * VIZLAB Scientific Text & LaTeX Normalizer
 *
 * Converts raw LaTeX math ($25\text{ m/s}$, $45^\circ$, $9.81\text{ m/s}^2$, \frac{a}{b}, \sqrt{x}, Greek symbols)
 * into clean, human-readable Unicode scientific notation while preserving structured Markdown
 * (**bold**, *italic*, `code`, headings, lists, and formula blocks).
 */

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '⁸',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

const LATEX_SYMBOL_MAP: Array<[RegExp, string]> = [
  [/\\circ\b/g, '°'],
  [/\^\\circ\b/g, '°'],
  [/\^\{\\circ\}/g, '°'],
  [/\\degree\b/g, '°'],
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\pm\b/g, '±'],
  [/\\mp\b/g, '∓'],
  [/\\approx\b/g, '≈'],
  [/\\neq\b/g, '≠'],
  [/\\ne\b/g, '≠'],
  [/\\leq\b/g, '≤'],
  [/\\le\b/g, '≤'],
  [/\\geq\b/g, '≥'],
  [/\\ge\b/g, '≥'],
  [/\\ll\b/g, '≪'],
  [/\\gg\b/g, '≫'],
  [/\\propto\b/g, '∝'],
  [/\\infty\b/g, '∞'],
  [/\\rightarrow\b/g, '→'],
  [/\\to\b/g, '→'],
  [/\\longrightarrow\b/g, '⟶'],
  [/\\Rightarrow\b/g, '⇒'],
  [/\\leftarrow\b/g, '←'],
  [/\\leftrightarrow\b/g, '↔'],
  [/\\rightleftharpoons\b/g, '⇌'],
  [/\\uparrow\b/g, '↑'],
  [/\\downarrow\b/g, '↓'],
  [/\\partial\b/g, '∂'],
  [/\\nabla\b/g, '∇'],
  [/\\int\b/g, '∫'],
  [/\\oint\b/g, '∮'],
  [/\\sum\b/g, '∑'],
  [/\\prod\b/g, '∏'],
  [/\\Delta\b/g, 'Δ'],
  [/\\Gamma\b/g, 'Γ'],
  [/\\Theta\b/g, 'Θ'],
  [/\\Lambda\b/g, 'Λ'],
  [/\\Xi\b/g, 'Ξ'],
  [/\\Pi\b/g, 'Π'],
  [/\\Sigma\b/g, 'Σ'],
  [/\\Phi\b/g, 'Φ'],
  [/\\Psi\b/g, 'Ψ'],
  [/\\Omega\b/g, 'Ω'],
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\gamma\b/g, 'γ'],
  [/\\delta\b/g, 'δ'],
  [/\\epsilon\b/g, 'ε'],
  [/\\varepsilon\b/g, 'ε'],
  [/\\zeta\b/g, 'ζ'],
  [/\\eta\b/g, 'η'],
  [/\\theta\b/g, 'θ'],
  [/\\vartheta\b/g, 'ϑ'],
  [/\\iota\b/g, 'ι'],
  [/\\kappa\b/g, 'κ'],
  [/\\lambda\b/g, 'λ'],
  [/\\mu\b/g, 'μ'],
  [/\\nu\b/g, 'ν'],
  [/\\xi\b/g, 'ξ'],
  [/\\pi\b/g, 'π'],
  [/\\rho\b/g, 'ρ'],
  [/\\sigma\b/g, 'σ'],
  [/\\tau\b/g, 'τ'],
  [/\\upsilon\b/g, 'υ'],
  [/\\phi\b/g, 'φ'],
  [/\\varphi\b/g, 'φ'],
  [/\\chi\b/g, 'χ'],
  [/\\psi\b/g, 'ψ'],
  [/\\omega\b/g, 'ω'],
  [/\\hbar\b/g, 'ℏ'],
  [/\\ell\b/g, 'ℓ'],
  [/\\angle\b/g, '∠'],
  [/\\perp\b/g, '⊥'],
  [/\\parallel\b/g, '∥'],
];

function toSuperscript(str: string): string {
  if (str === '\\circ' || str === '°') return '°';
  const chars = Array.from(str.trim());
  if (chars.every((c) => SUPERSCRIPT_MAP[c])) {
    return chars.map((c) => SUPERSCRIPT_MAP[c]).join('');
  }
  return `^(${str})`;
}

function toSubscript(str: string): string {
  const chars = Array.from(str.trim());
  if (chars.every((c) => SUBSCRIPT_MAP[c])) {
    return chars.map((c) => SUBSCRIPT_MAP[c]).join('');
  }
  return `_${str}`;
}

/**
 * Converts a single LaTeX math expression (without surrounding $ or $$) into clean Unicode.
 */
export function convertLatexFragmentToUnicode(latex: string): string {
  let s = latex;

  // 1. Strip sizing commands \left, \right, \big, \Big, \displaystyle
  s = s.replace(/\\(?:left|right|big|Big|bigg|Bigg|displaystyle)\b/g, '');

  // 2. Replace \text{...}, \mathrm{...}, \mathbf{...}, \textit{...}, \operatorname{...}
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\(?:text|mathrm|mathbf|mathit|mathsf|textbf|textit|operatorname)\{([^{}]*)\}/g, '$1');
  }

  // 3. Handle \vec{x} or \hat{x} or \bar{x}
  s = s.replace(/\\vec\{([^{}]+)\}/g, '$1⃗');
  s = s.replace(/\\hat\{([^{}]+)\}/g, '$1̂');
  s = s.replace(/\\bar\{([^{}]+)\}/g, '$1̄');

  // 4. Replace \frac{a}{b} (support nested up to 2 levels)
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
      const n = num.trim();
      const d = den.trim();
      const numSimple = /^[a-zA-Z0-9α-ωΑ-ΩΔπ°²³]+$/.test(n);
      const denSimple = /^[a-zA-Z0-9α-ωΑ-ΩΔπ°²³]+$/.test(d);
      if (numSimple && denSimple) {
        return `${n}/${d}`;
      }
      return `(${n}) / (${d})`;
    });
  }

  // 5. Replace \sqrt[n]{x} and \sqrt{x}
  s = s.replace(/\\sqrt\[([^{}\]]+)\]\{([^{}]+)\}/g, (_, root, inner) => {
    const r = toSuperscript(root);
    const body = inner.trim();
    return /^[a-zA-Z0-9]+$/.test(body) ? `${r}√${body}` : `${r}√(${body})`;
  });
  for (let i = 0; i < 2; i++) {
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, (_, inner) => {
      const body = inner.trim();
      return /^[a-zA-Z0-9]+$/.test(body) ? `√${body}` : `√(${body})`;
    });
  }

  // 6. Degree symbols before general superscripts
  s = s.replace(/\^\{\\circ\}/g, '°');
  s = s.replace(/\^\\circ\b/g, '°');
  s = s.replace(/\\circ\b/g, '°');

  // 7. Replace known LaTeX symbols and Greek letters
  for (const [regex, replacement] of LATEX_SYMBOL_MAP) {
    s = s.replace(regex, replacement);
  }

  // 8. Replace standard trig/log function backslashes: \sin, \cos, \tan, \log, \ln, \exp, \max, \min, \lim
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|max|min|lim)\b/g, '$1');

  // 9. Replace LaTeX spacing commands (\, \; \: \! \quad \qquad \~ `\ `)
  s = s.replace(/\\(?:,|;|:|!|quad|qquad)\b/g, ' ');
  s = s.replace(/\\ /g, ' ');

  // 10. Convert braced superscripts ^{...} and single-char superscripts ^x
  s = s.replace(/\^\{([^{}]+)\}/g, (_, exp) => toSuperscript(exp));
  s = s.replace(/\^([0-9+\-=ni])/g, (_, exp) => toSuperscript(exp));

  // 11. Convert braced subscripts _{...} and single-char subscripts _x
  s = s.replace(/_\{([^{}]+)\}/g, (_, sub) => toSubscript(sub));
  s = s.replace(/_([0-9+\-=aehijklmnoprstuvx])/g, (_, sub) => toSubscript(sub));

  // 12. Clean up remaining stray curly braces { and }
  s = s.replace(/[{}]/g, '');

  // 13. Collapse multiple spaces
  s = s.replace(/[ \t]{2,}/g, ' ').trim();

  return s;
}

/**
 * Cleans and normalizes an entire AI text response or explanation string:
 * - Converts block math $$...$$ and \[...\] into clean formula lines
 * - Converts inline math $...$ and \(...\) into readable Unicode scientific notation
 * - Cleans any un-delimited stray LaTeX commands (\text{...}, ^\circ, \rightarrow, etc.)
 */
export function cleanAndFormatScientificText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Convert display math $$...$$ and \[...\]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, mathBody) => {
    const converted = convertLatexFragmentToUnicode(mathBody.replace(/\n+/g, ' '));
    return `\n\`${converted}\`\n`;
  });

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, mathBody) => {
    const converted = convertLatexFragmentToUnicode(mathBody.replace(/\n+/g, ' '));
    return `\n\`${converted}\`\n`;
  });

  // 2. Convert inline math \(...\)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, mathBody) => {
    return convertLatexFragmentToUnicode(mathBody);
  });

  // 3. Convert inline math $...$ (avoiding currency like $100 followed by space/words without LaTeX)
  text = text.replace(/\$([^\n$]+?)\$/g, (_, mathBody) => {
    return convertLatexFragmentToUnicode(mathBody);
  });

  // 4. Clean any stray un-delimited LaTeX commands that might appear outside $...$
  if (text.includes('\\') || text.includes('^') || text.includes('_')) {
    text = text.replace(/\\(?:text|mathrm|mathbf)\{([^{}]*)\}/g, '$1');
    text = text.replace(/\^\{\\circ\}/g, '°');
    text = text.replace(/\^\\circ\b/g, '°');
    for (const [regex, replacement] of LATEX_SYMBOL_MAP) {
      text = text.replace(regex, replacement);
    }
    text = text.replace(/\^\{([0-9+\-=ni]+)\}/g, (_, exp) => toSuperscript(exp));
    text = text.replace(/(\b(?:m\/s|cm\/s|km\/h|s|m|cm|mm|km|kg|g|N|J|W|Pa|Hz|V|A|C|T|K|mol|L))\^([0-9+-]+)/g, (_, unit, exp) => `${unit}${toSuperscript(exp)}`);
    text = text.replace(/([0-9a-zA-Z)])\^([23])\b/g, (_, base, exp) => `${base}${toSuperscript(exp)}`);
  }

  return text;
}
