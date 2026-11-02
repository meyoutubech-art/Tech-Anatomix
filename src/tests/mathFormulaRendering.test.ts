import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderMathToHtml,
  normalizeFormulaToLatex,
  parseTextWithMathSegments,
  containsLatexMath,
} from '../components/common/MathFormula';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';

test('KaTeX centralized rendering: DC Electric Motor and Rutherford Gold Foil equations render valid KaTeX HTML without raw LaTeX leaks', () => {
  const equations = [
    '\\tau = N \\cdot I \\cdot A \\cdot B \\cdot \\sin(\\theta)',
    '\\varepsilon_{back} = N \\cdot B \\cdot A \\cdot \\omega',
    'I = \\frac{V - \\varepsilon_{back}}{R}',
    '\\frac{d\\sigma}{d\\Omega} = \\left(\\frac{z Z e^2}{4\\pi\\varepsilon_0 \\cdot 4E}\\right)^2 \\frac{1}{\\sin^4(\\theta/2)} \\quad (\\text{Rutherford Formula})',
    'b = \\frac{z Z e^2}{4\\pi\\varepsilon_0 \\cdot 2E} \\cot\\left(\\frac{\\theta}{2}\\right)',
    'T = 2\\pi \\sqrt{\\frac{L}{g}}',
  ];

  for (const eq of equations) {
    const result = renderMathToHtml(eq, false);
    assert.ok(result.html.includes('katex'), `Expected KaTeX HTML output for: ${eq}`);
    assert.ok(!result.fallbackText, `Expected no fallback for valid LaTeX: ${eq}`);
  }
});

test('KaTeX centralized rendering: Every equation across all CURATED_AI_MODELS renders cleanly without throwing', () => {
  const models = Object.values(CURATED_AI_MODELS);
  assert.ok(models.length > 0, 'Expected curated models to exist');

  for (const model of models) {
    for (const eq of model.equations || []) {
      const result = renderMathToHtml(eq, false);
      assert.ok(
        result.html.length > 0 || (result.fallbackText && result.fallbackText.length > 0),
        `Expected non-empty render output for model ${model.id} equation: ${eq}`
      );
    }
  }
});

test('parseTextWithMathSegments: Detects explicit inline \\( ... \\), $ ... $ and display \\[ ... \\], $$ ... $$ delimiters', () => {
  const text =
    'For a simple pendulum, inline \\( T = 2\\pi\\sqrt{\\frac{L}{g}} \\) and dollar $E = mc^2$ work alongside block \\[ I = \\frac{V - \\varepsilon_{back}}{R} \\] and $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$ seamlessly.';
  const segments = parseTextWithMathSegments(text);
  const mathSegments = segments.filter((s) => s.type === 'math-inline' || s.type === 'math-block');

  assert.equal(mathSegments.length, 4);
  assert.equal(mathSegments[0].type, 'math-inline');
  assert.equal(mathSegments[1].type, 'math-inline');
  assert.equal(mathSegments[2].type, 'math-block');
  assert.equal(mathSegments[3].type, 'math-block');

  for (const seg of mathSegments) {
    const rendered = renderMathToHtml(seg.latex, seg.type === 'math-block');
    assert.ok(rendered.html.includes('katex'), `Expected KaTeX HTML for segment: ${seg.latex}`);
  }
});

test('parseTextWithMathSegments: Detects undelimited raw LaTeX embedded in prose while preserving ordinary text and currency', () => {
  const proseWithRawLatex =
    'When current flows, torque follows \\tau = N \\cdot I \\cdot A \\cdot B \\cdot \\sin(\\theta) in the coil.';
  assert.equal(containsLatexMath(proseWithRawLatex), true);
  const segments = parseTextWithMathSegments(proseWithRawLatex);
  assert.ok(
    segments.some((s) => s.type === 'math-inline' || s.type === 'math-block'),
    'Expected raw LaTeX in prose to be extracted as math segment'
  );

  const currencyText = 'The lab kit costs $25 and the sensor costs $50 in total.';
  const currencySegments = parseTextWithMathSegments(currencyText);
  assert.ok(
    currencySegments.every((s) => s.type === 'text'),
    'Expected plain currency numbers not to be mistaken for LaTeX math'
  );
});

test('renderMathToHtml: Handles malformed LaTeX gracefully without crashing', () => {
  const malformed = '\\frac{V - \\varepsilon_{back}{R';
  assert.doesNotThrow(() => {
    const res = renderMathToHtml(malformed, false);
    assert.ok(res.html.length > 0 || (res.fallbackText && res.fallbackText.length > 0));
  });

  const normalized = normalizeFormulaToLatex('F = G × (M × m) / r²');
  const renderedNormalized = renderMathToHtml(normalized, false);
  assert.ok(renderedNormalized.html.includes('katex'));
});
