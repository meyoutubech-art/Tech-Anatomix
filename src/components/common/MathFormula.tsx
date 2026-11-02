import React, { useMemo } from 'react';
import katex from 'katex';
import { convertLatexFragmentToUnicode } from '../../utils/scientificTextFormatter';

/**
 * Known LaTeX mathematical commands used to detect undelimited LaTeX in text or equations.
 */
const LATEX_COMMAND_REGEX =
  /\\(?:frac|dfrac|tfrac|sqrt|cbrt|root|left|right|big|Big|bigg|Bigg|text|textrm|textbf|textit|mathrm|mathbf|mathit|mathcal|mathbb|hat|vec|bar|dot|ddot|overline|underline|widetilde|widehat|alpha|beta|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|Theta|vartheta|iota|kappa|lambda|Lambda|mu|nu|xi|Xi|pi|Pi|rho|varrho|sigma|Sigma|tau|upsilon|Upsilon|phi|Phi|varphi|chi|psi|Psi|omega|Omega|cdot|times|div|pm|mp|approx|sim|simeq|cong|equiv|neq|ne|leq|le|geq|ge|ll|gg|propto|infty|partial|nabla|forall|exists|in|notin|subset|subseteq|cup|cap|emptyset|to|rightarrow|leftarrow|leftrightarrow|longrightarrow|longleftarrow|Rightarrow|Leftarrow|Leftrightarrow|implies|iff|rightleftharpoons|leftrightharpoons|uparrow|downarrow|perp|parallel|angle|triangle|circ|degree|prime|ell|hbar|Re|Im|wp|aleph|int|iint|iiint|oint|sum|prod|coprod|lim|limsup|liminf|sup|inf|max|min|det|dim|ker|hom|arg|deg|gcd|Pr|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|coth|ln|log|exp|quad|qquad|begin|end|matrix|pmatrix|bmatrix|vmatrix|Bmatrix|cases|aligned|align|binom|overset|underset|xrightarrow|xleftarrow|ce)\b/;

/**
 * Detects whether a string contains explicit LaTeX delimiters or raw LaTeX commands/subscripts/superscripts.
 */
export function containsLatexMath(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  if (
    /\$\$[\s\S]+?\$\$/.test(input) ||
    /\\\[[\s\S]+?\\\]/.test(input) ||
    /\\\([\s\S]+?\\\)/.test(input) ||
    /\$(?!\s)[^$\n]+?(?<!\s)\$/.test(input)
  ) {
    return true;
  }
  if (LATEX_COMMAND_REGEX.test(input)) {
    return true;
  }
  if (/[_^]\{[^}]+\}/.test(input)) {
    return true;
  }
  return false;
}

const UNICODE_SUBSCRIPT_TO_LATEX: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '₊': '+',
  '₋': '-',
  '₌': '=',
  '₍': '(',
  '₎': ')',
  'ₐ': 'a',
  'ₑ': 'e',
  'ₒ': 'o',
  'ₓ': 'x',
  'ₕ': 'h',
  'ₖ': 'k',
  'ₗ': 'l',
  'ₘ': 'm',
  'ₙ': 'n',
  'ₚ': 'p',
  'ₛ': 's',
  'ₜ': 't',
};

const UNICODE_SUPERSCRIPT_TO_LATEX: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
  '⁼': '=',
  '⁽': '(',
  '⁾': ')',
  'ⁿ': 'n',
};

const UNICODE_GREEK_TO_LATEX: Record<string, string> = {
  α: '\\alpha ',
  β: '\\beta ',
  γ: '\\gamma ',
  Γ: '\\Gamma ',
  δ: '\\delta ',
  Δ: '\\Delta ',
  ε: '\\varepsilon ',
  ζ: '\\zeta ',
  η: '\\eta ',
  θ: '\\theta ',
  Θ: '\\Theta ',
  κ: '\\kappa ',
  λ: '\\lambda ',
  Λ: '\\Lambda ',
  μ: '\\mu ',
  ν: '\\nu ',
  ξ: '\\xi ',
  π: '\\pi ',
  Π: '\\Pi ',
  ρ: '\\rho ',
  σ: '\\sigma ',
  Σ: '\\sum ',
  τ: '\\tau ',
  φ: '\\phi ',
  Φ: '\\Phi ',
  χ: '\\chi ',
  ψ: '\\psi ',
  Ψ: '\\Psi ',
  ω: '\\omega ',
  Ω: '\\Omega ',
};

/**
 * Protects existing \text{...}, \mathrm{...}, \textbf{...} blocks during normalization
 * so we do not corrupt text annotations inside LaTeX.
 */
function withProtectedLatexTextBlocks(
  input: string,
  transform: (segment: string) => string
): string {
  const blocks: string[] = [];
  const pattern = /\\(?:text|textrm|textbf|textit|mathrm|mathbf|mathit)\s*\{(?:[^{}]|\{[^{}]*\})*\}/g;
  const masked = input.replace(pattern, (match) => {
    const idx = blocks.length;
    blocks.push(match);
    return `@@LATEX_TEXT_${idx}@@`;
  });
  const transformed = transform(masked);
  return transformed.replace(/@@LATEX_TEXT_(\d+)@@/g, (_, idxStr) => blocks[Number(idxStr)] || '');
}

/**
 * Normalizes a mathematical equation string (which may be pure LaTeX, wrapped LaTeX,
 * or hybrid Unicode/ASCII scientific formula) into valid KaTeX syntax.
 */
export function normalizeFormulaToLatex(rawFormula: string): string {
  if (!rawFormula) return '';
  let expr = rawFormula.trim();

  // Strip outer delimiters if the entire string is wrapped
  if (expr.startsWith('$$') && expr.endsWith('$$') && expr.length > 4) {
    expr = expr.slice(2, -2).trim();
  } else if (expr.startsWith('\\[') && expr.endsWith('\\]') && expr.length > 4) {
    expr = expr.slice(2, -2).trim();
  } else if (expr.startsWith('\\(') && expr.endsWith('\\)') && expr.length > 4) {
    expr = expr.slice(2, -2).trim();
  } else if (
    expr.startsWith('$') &&
    expr.endsWith('$') &&
    expr.length > 2 &&
    !expr.slice(1, -1).includes('$')
  ) {
    expr = expr.slice(1, -1).trim();
  }

  // Handle combining over-dots (e.g. θ̇ -> \dot{\theta}, θ̈ -> \ddot{\theta})
  expr = expr
    .replace(/([A-Za-zα-ωΑ-Ω])\u0308/g, (_, ch) => {
      const mapped = UNICODE_GREEK_TO_LATEX[ch] ? UNICODE_GREEK_TO_LATEX[ch].trim() : ch;
      return `\\ddot{${mapped}}`;
    })
    .replace(/([A-Za-zα-ωΑ-Ω])\u0307/g, (_, ch) => {
      const mapped = UNICODE_GREEK_TO_LATEX[ch] ? UNICODE_GREEK_TO_LATEX[ch].trim() : ch;
      return `\\dot{${mapped}}`;
    });

  // If there is a trailing descriptive parenthetical remark at the end of an equation
  // that is NOT already wrapped in \text{...}, wrap it in \quad \text{(...)}
  expr = expr.replace(
    /\s+\(([A-Za-z][A-Za-z0-9\s,&/–—'-]{3,})\)\s*$/,
    (fullMatch, innerText, offset) => {
      const preceding = expr.slice(0, offset);
      if (/\\text\s*\{[^}]*$/.test(preceding)) return fullMatch;
      return ` \\quad \\text{(${innerText.trim()})}`;
    }
  );

  // Transform outside \text{...} blocks
  expr = withProtectedLatexTextBlocks(expr, (seg) => {
    let s = seg;

    // Vulgar fractions
    s = s
      .replace(/½/g, '\\frac{1}{2}')
      .replace(/⅓/g, '\\frac{1}{3}')
      .replace(/⅔/g, '\\frac{2}{3}')
      .replace(/¼/g, '\\frac{1}{4}')
      .replace(/¾/g, '\\frac{3}{4}');

    // Square root Unicode: √(expr) -> \sqrt{expr}, √x -> \sqrt{x}
    s = s.replace(/√\(([^()]+)\)/g, '\\sqrt{$1}');
    s = s.replace(/√([a-zA-Z0-9_]+)/g, '\\sqrt{$1}');

    // Unicode subscript sequences
    s = s.replace(/[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₕₖₗₘₙₚₛₜ]+/g, (match) => {
      const converted = Array.from(match)
        .map((ch) => UNICODE_SUBSCRIPT_TO_LATEX[ch] ?? ch)
        .join('');
      return `_{${converted}}`;
    });

    // Unicode superscript sequences
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ]+/g, (match) => {
      const converted = Array.from(match)
        .map((ch) => UNICODE_SUPERSCRIPT_TO_LATEX[ch] ?? ch)
        .join('');
      return `^{${converted}}`;
    });

    // Unicode Greek letters
    s = s.replace(/[αβγΓδΔεζηθΘκλΛμνξπΠρσΣτφΦχψΨωΩ]/g, (ch) => UNICODE_GREEK_TO_LATEX[ch] ?? ch);

    // Unicode math operators
    s = s
      .replace(/−/g, '-')
      .replace(/[·•]/g, ' \\cdot ')
      .replace(/×/g, ' \\times ')
      .replace(/÷/g, ' \\div ')
      .replace(/±/g, ' \\pm ')
      .replace(/∓/g, ' \\mp ')
      .replace(/≈/g, ' \\approx ')
      .replace(/≠/g, ' \\neq ')
      .replace(/≤/g, ' \\leq ')
      .replace(/≥/g, ' \\geq ')
      .replace(/≪/g, ' \\ll ')
      .replace(/≫/g, ' \\gg ')
      .replace(/∝/g, ' \\propto ')
      .replace(/∞/g, ' \\infty ')
      .replace(/∂/g, ' \\partial ')
      .replace(/∇/g, ' \\nabla ')
      .replace(/∮/g, ' \\oint ')
      .replace(/∫/g, ' \\int ')
      .replace(/∏/g, ' \\prod ')
      .replace(/⇌/g, ' \\rightleftharpoons ')
      .replace(/[→➔⟶]/g, ' \\to ')
      .replace(/[⇒⟹]/g, ' \\implies ')
      .replace(/[⇔⟺]/g, ' \\iff ')
      .replace(/⊥/g, ' \\perp ')
      .replace(/∥/g, ' \\parallel ')
      .replace(/°C\b/g, '^\\circ\\text{C}')
      .replace(/°F\b/g, '^\\circ\\text{F}')
      .replace(/°/g, '^\\circ ');

    // Wrap multi-character bare subscripts like V_rms, F_clamp, mu_net into _{\text{...}}
    s = s.replace(/(?<![\\a-zA-Z])_([a-zA-Z0-9]{2,})\b(?!\s*\{)/g, (_, sub) => {
      if (/^[0-9]+$/.test(sub)) return `_{${sub}}`;
      return `_{\\text{${sub}}}`;
    });

    return s;
  });

  // Escape unescaped % signs so LaTeX doesn't treat them as comments
  expr = expr.replace(/(?<!\\)%/g, '\\%');

  return expr.trim();
}

/**
 * Module-level memoization cache for KaTeX HTML output to avoid repeated parsing overhead.
 */
const katexHtmlCache = new Map<string, { html: string; isError: boolean }>();
const MAX_KATEX_CACHE_SIZE = 1500;

export function renderMathToHtml(
  rawFormula: string,
  displayMode = false
): { html: string; isError: boolean; fallbackText: string } {
  const normalized = normalizeFormulaToLatex(rawFormula);
  if (!normalized) {
    return { html: '', isError: false, fallbackText: '' };
  }

  const cacheKey = `${displayMode ? 'D' : 'I'}:${normalized}`;
  const cached = katexHtmlCache.get(cacheKey);
  if (cached) {
    return {
      html: cached.html,
      isError: cached.isError,
      fallbackText: cached.isError ? convertLatexFragmentToUnicode(rawFormula) : '',
    };
  }

  try {
    const html = katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'htmlAndMathml',
    });

    // Check if KaTeX emitted an unrecoverable parse error span
    const isError = html.includes('class="katex-error"');
    if (katexHtmlCache.size >= MAX_KATEX_CACHE_SIZE) {
      const firstKey = katexHtmlCache.keys().next().value;
      if (firstKey) katexHtmlCache.delete(firstKey);
    }
    katexHtmlCache.set(cacheKey, { html, isError });

    return {
      html,
      isError,
      fallbackText: isError ? convertLatexFragmentToUnicode(rawFormula) : '',
    };
  } catch {
    const fallbackText = convertLatexFragmentToUnicode(rawFormula);
    return { html: '', isError: true, fallbackText };
  }
}

export interface MathFormulaProps {
  /** The mathematical expression or LaTeX string to render */
  formula: string;
  /** Render as block/display equation (default: false for inline) */
  displayMode?: boolean;
  /** Additional CSS classes for the wrapper element */
  className?: string;
  /** Optional test ID */
  testId?: string;
}

/**
 * Centralized reusable mathematical rendering component powered by KaTeX.
 * Safely renders inline and display equations, fractions, roots, Greek symbols,
 * integrals, summations, subscripts, superscripts, matrices, and scientific notation.
 * Gracefully falls back on malformed input without ever crashing or leaking raw LaTeX.
 */
export const MathFormula: React.FC<MathFormulaProps> = React.memo(
  ({ formula, displayMode = false, className = '', testId }) => {
    const segments = useMemo(() => {
      if (!formula || typeof formula !== 'string') return [];
      // Support compound formulas separated by " | "
      return formula
        .split(/\s+\|\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }, [formula]);

    if (segments.length === 0) return null;

    if (segments.length > 1) {
      return (
        <span
          data-testid={testId || 'katex-formula-group'}
          className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 max-w-full ${className}`}
        >
          {segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="opacity-40 select-none">•</span>}
              <MathFormula formula={seg} displayMode={false} />
            </React.Fragment>
          ))}
        </span>
      );
    }

    const singleFormula = segments[0];
    const { html, isError, fallbackText } = useMemo(
      () => renderMathToHtml(singleFormula, displayMode),
      [singleFormula, displayMode]
    );

    if (isError || !html) {
      return (
        <span
          data-testid={testId || 'katex-formula-fallback'}
          className={`font-mono ${className}`}
        >
          {fallbackText || singleFormula}
        </span>
      );
    }

    const WrapperTag = displayMode ? 'div' : 'span';
    const modeClass = displayMode ? 'math-formula-block' : 'math-formula-inline';

    return (
      <WrapperTag
        data-testid={testId || (displayMode ? 'katex-display-formula' : 'katex-inline-formula')}
        className={`${modeClass} ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
);

MathFormula.displayName = 'MathFormula';

export type MathTextSegment =
  | { type: 'text'; content: string }
  | { type: 'math-inline'; latex: string }
  | { type: 'math-block'; latex: string };

/**
 * Splits a plain text segment (which has no explicit $...$ or \(...\) delimiters)
 * into ordinary text and any embedded undelimited LaTeX mathematical expressions
 * (e.g. "\tau = N \cdot I \cdot A \cdot B \cdot \sin(\theta)" or "\frac{V - \varepsilon_{back}}{R}" or "\theta").
 */
function splitUndelimitedLatexInText(text: string): MathTextSegment[] {
  if (!text || !LATEX_COMMAND_REGEX.test(text) && !/[_^]\{[^}]+\}/.test(text)) {
    return [{ type: 'text', content: text }];
  }

  // Pattern that matches either:
  // 1) A full equation containing at least one LaTeX macro or _{...}/^{...}
  //    (with optional LHS like "I = " or "\tau = " and RHS with operators, braces, functions, etc.)
  // 2) A standalone LaTeX command with its arguments (e.g. \frac{a}{b}, \sqrt{x}, \theta, \Omega)
  const undelimitedMathRegex =
    /(?:(?:[A-Za-z0-9_\\]+(?:\{[^{}]*\})?\s*[=≈∝<>≤≥±+\-*/]\s*)+(?:\\[A-Za-z]+(?:\s*\{(?:[^{}]|\{[^{}]*\})*\})*|[_^]\{[^{}]+\}|[0-9A-Za-z_\\^+\-*/=().,[\]\s])+)|(?:\\[A-Za-z]+(?:\s*[_^]?(?:\{(?:[^{}]|\{[^{}]*\})*\}|[A-Za-z0-9]))*(?:\s*(?:[=≈∝<>≤≥±+\-*/^_]|\\(?:cdot|times|div|pm|mp|approx|propto|to|rightarrow|longrightarrow|implies|iff|rightleftharpoons|sin|cos|tan|cot|sec|csc|ln|log|exp|sqrt|frac|dfrac|tfrac|left|right|quad|qquad|text|mathrm))\s*(?:\\[A-Za-z]+(?:\s*\{(?:[^{}]|\{[^{}]*\})*\})*|[0-9A-Za-z_\\^+\-*/=(){}[\].,])+)*)/g;

  const result: MathTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(undelimitedMathRegex)) {
    const rawMatch = match[0];
    const startIdx = match.index ?? 0;

    // Must actually contain a known LaTeX command or braced sub/superscript
    if (!LATEX_COMMAND_REGEX.test(rawMatch) && !/[_^]\{[^}]+\}/.test(rawMatch)) {
      continue;
    }

    // Trim trailing prose words or trailing punctuation that isn't part of the math
    let cleanedMath = rawMatch;
    let trailingText = '';

    // Strip trailing English words (2+ letters not preceded by \ or _ or ^) at the end of the match
    const trailingProseMatch = cleanedMath.match(
      /(\s+(?:is|are|was|were|in|on|at|to|for|from|with|by|and|or|where|when|which|that|the|a|an|as|of|under|into|across|through|during|producing|gives|yields|represents|denotes|equals|called)\b[\s\S]*)$/i
    );
    if (trailingProseMatch) {
      trailingText = trailingProseMatch[1];
      cleanedMath = cleanedMath.slice(0, cleanedMath.length - trailingText.length);
    }

    // Strip trailing sentence punctuation (.,;:)
    const trailingPunctMatch = cleanedMath.match(/([.,;:]+\s*)$/);
    if (trailingPunctMatch) {
      trailingText = trailingPunctMatch[1] + trailingText;
      cleanedMath = cleanedMath.slice(0, cleanedMath.length - trailingPunctMatch[1].length);
    }

    // Balance parentheses if a leading "(" in prose wrapped the math expression
    const openParens = (cleanedMath.match(/\(/g) || []).length;
    const closeParens = (cleanedMath.match(/\)/g) || []).length;
    if (closeParens > openParens && cleanedMath.endsWith(')')) {
      cleanedMath = cleanedMath.slice(0, -1);
      trailingText = ')' + trailingText;
    }

    if (!cleanedMath.trim()) continue;

    if (startIdx > lastIndex) {
      result.push({ type: 'text', content: text.slice(lastIndex, startIdx) });
    }

    result.push({ type: 'math-inline', latex: cleanedMath.trim() });

    if (trailingText) {
      result.push({ type: 'text', content: trailingText });
    }

    lastIndex = startIdx + rawMatch.length;
  }

  if (result.length === 0) {
    return [{ type: 'text', content: text }];
  }

  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return result;
}

/**
 * Parses a string into text, inline math, and block math segments.
 * Supports:
 * - $$ ... $$ (block/display math)
 * - \[ ... \] (block/display math)
 * - \( ... \) (inline math)
 * - $ ... $ (inline math)
 * - Undelimited LaTeX commands embedded in text
 */
export function parseTextWithMathSegments(text: string): MathTextSegment[] {
  if (!text || typeof text !== 'string') return [];

  // Match explicit delimiters first: $$...$$, \[...\], \(...\), $...$
  const delimiterRegex =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)(?:\\.|[^$\n])+?(?<!\s)\$)/g;

  const segments: MathTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(delimiterRegex)) {
    const token = match[0];
    const idx = match.index ?? 0;

    if (idx > lastIndex) {
      const plainChunk = text.slice(lastIndex, idx);
      segments.push(...splitUndelimitedLatexInText(plainChunk));
    }

    if (token.startsWith('$$') && token.endsWith('$$')) {
      const inner = token.slice(2, -2).trim();
      if (inner) {
        segments.push({ type: 'math-block', latex: inner });
      }
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      const inner = token.slice(2, -2).trim();
      if (inner) {
        segments.push({ type: 'math-block', latex: inner });
      }
    } else if (token.startsWith('\\(') && token.endsWith('\\)')) {
      const inner = token.slice(2, -2).trim();
      if (inner) {
        segments.push({ type: 'math-inline', latex: inner });
      }
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const inner = token.slice(1, -1).trim();
      // Avoid false-positive currency matches like "$10 and $20"
      if (/^[0-9]+(?:\.[0-9]{1,2})?\s+\w+/.test(inner) && !containsLatexMath(inner)) {
        segments.push({ type: 'text', content: token });
      } else if (inner) {
        segments.push({ type: 'math-inline', latex: inner });
      }
    }

    lastIndex = idx + token.length;
  }

  if (lastIndex < text.length) {
    segments.push(...splitUndelimitedLatexInText(text.slice(lastIndex)));
  }

  return segments;
}

export interface MathTextProps {
  /** Text that may contain inline or block LaTeX equations */
  text: string;
  /** Optional className for wrapper */
  className?: string;
}

/**
 * Renders prose text containing embedded inline or block LaTeX expressions using KaTeX,
 * while preserving ordinary non-mathematical text untouched.
 */
export const MathText: React.FC<MathTextProps> = React.memo(({ text, className = '' }) => {
  const segments = useMemo(() => parseTextWithMathSegments(text), [text]);

  if (segments.length === 0) return null;
  if (segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{segments[0].content}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <React.Fragment key={i}>{seg.content}</React.Fragment>;
        }
        if (seg.type === 'math-block') {
          return <MathFormula key={i} formula={seg.latex} displayMode={true} className="my-1.5" />;
        }
        return <MathFormula key={i} formula={seg.latex} displayMode={false} />;
      })}
    </span>
  );
});

MathText.displayName = 'MathText';
