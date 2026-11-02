import React from 'react';
import { MathFormula, MathText, containsLatexMath } from './MathFormula';

export interface FormattedAiMessageProps {
  text: string;
  /**
   * Visual theme of the message container:
   * - 'light': Light card background (used in AiLabAssistant, ModelAwareChatbot, EducationalExplanationBox)
   * - 'dark': Dark slate background (used in ExternalModelAiChat, ReactionAiChatbot)
   * - 'user': High-contrast user bubble (dark/colored background with white text)
   */
  variant?: 'light' | 'dark' | 'user';
  className?: string;
}

/**
 * Parses inline Markdown (**bold**, *italic*, `code`) and mathematical expressions
 * ($$...$$, \[...\], \(...\), $...$, and raw LaTeX) into React nodes.
 */
export function renderInlineScientificMarkdown(
  line: string,
  variant: 'light' | 'dark' | 'user' = 'light'
): React.ReactNode[] {
  if (!line) return [];

  const boldClass =
    variant === 'user'
      ? 'font-bold text-white'
      : variant === 'dark'
        ? 'font-semibold text-sky-300'
        : 'font-semibold text-slate-900';

  const codeClass =
    variant === 'user'
      ? 'font-mono text-[11px] bg-slate-800 text-sky-200 px-1.5 py-0.5 rounded'
      : variant === 'dark'
        ? 'font-mono text-[11px] bg-slate-800/90 text-sky-300 px-1.5 py-0.5 rounded border border-slate-700'
        : 'font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80';

  // Tokenize by explicit math blocks first (so * inside math is never treated as italic),
  // then `code`, **bold**, and *italic*
  const tokenRegex =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)(?:\\.|[^$\n])+?(?<!\s)\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Display math token: $$...$$ or \[...\]
    if (
      (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) ||
      (part.startsWith('\\[') && part.endsWith('\\]') && part.length > 4)
    ) {
      const innerLatex = part.slice(2, -2).trim();
      return <MathFormula key={idx} formula={innerLatex} displayMode={true} className="my-1.5" />;
    }

    // Inline math token: \(...\) or $...$
    if (part.startsWith('\\(') && part.endsWith('\\)') && part.length > 4) {
      const innerLatex = part.slice(2, -2).trim();
      return <MathFormula key={idx} formula={innerLatex} displayMode={false} />;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const innerLatex = part.slice(1, -1).trim();
      if (/^[0-9]+(?:\.[0-9]{1,2})?\s+\w+/.test(innerLatex) && !containsLatexMath(innerLatex)) {
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      }
      return <MathFormula key={idx} formula={innerLatex} displayMode={false} />;
    }

    // Inline backtick `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const innerContent = part.slice(1, -1).trim();
      if (containsLatexMath(innerContent)) {
        return <MathFormula key={idx} formula={innerContent} displayMode={false} />;
      }
      return (
        <code key={idx} className={codeClass}>
          {innerContent}
        </code>
      );
    }

    // Bold **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} className={boldClass}>
          {renderInlineScientificMarkdown(boldContent, variant)}
        </strong>
      );
    }

    // Italic *...*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const italicContent = part.slice(1, -1);
      return (
        <em key={idx} className="italic">
          {renderInlineScientificMarkdown(italicContent, variant)}
        </em>
      );
    }

    // Plain text or text containing undelimited LaTeX commands
    return <MathText key={idx} text={part} />;
  });
}

/**
 * Collapses multi-line display math blocks ($$...$$ and \[...\]) outside of fenced code blocks
 * onto single logical lines so line-by-line Markdown parsing keeps display equations intact.
 */
function collapseMultilineDisplayMath(rawText: string): string {
  if (!rawText) return '';
  const text = rawText.replace(/\r\n/g, '\n');

  // Protect fenced code blocks first
  const codeBlocks: string[] = [];
  const masked = text.replace(/```[\s\S]*?```/g, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `@@FENCED_CODE_${idx}@@`;
  });

  const collapsed = masked
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => {
      const oneLine = String(inner).replace(/\s*\n\s*/g, ' ').trim();
      return `\n$$${oneLine}$$\n`;
    })
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => {
      const oneLine = String(inner).replace(/\s*\n\s*/g, ' ').trim();
      return `\n\\[${oneLine}\\]\n`;
    });

  return collapsed.replace(/@@FENCED_CODE_(\d+)@@/g, (_, idxStr) => codeBlocks[Number(idxStr)] || '');
}

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({
  text,
  variant = 'light',
  className = '',
}) => {
  const preparedText = collapseMultilineDisplayMath(text || '');
  const lines = preparedText.split('\n');

  const elements: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (!listType || listItems.length === 0) return;
    if (listType === 'ul') {
      elements.push(
        <ul key={`${keyPrefix}-ul`} className="space-y-1.5 pl-4 list-disc marker:text-sky-500">
          {listItems}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`${keyPrefix}-ol`} className="space-y-1.5 pl-4 list-decimal marker:font-semibold marker:text-sky-500">
          {listItems}
        </ol>
      );
    }
    listType = null;
    listItems = [];
  };

  const flushCodeBlock = (keyPrefix: string) => {
    const rawCode = codeBlockLines.join('\n').trim();
    if (!rawCode) return;

    const isMathFence =
      /^(?:latex|tex|math|katex)$/i.test(codeBlockLang) ||
      (!codeBlockLang &&
        containsLatexMath(rawCode) &&
        !/\b(?:function|const|let|var|import|export|return|class|def|print|console\.log|if|for|while)\b/.test(rawCode));

    if (isMathFence) {
      elements.push(
        <div key={`${keyPrefix}-math`} className="my-2 overflow-x-auto">
          <MathFormula formula={rawCode} displayMode={true} />
        </div>
      );
    } else {
      elements.push(
        <pre
          key={`${keyPrefix}-pre`}
          className={
            variant === 'dark' || variant === 'user'
              ? 'p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto my-2'
              : 'p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto my-2'
          }
        >
          <code>{rawCode}</code>
        </pre>
      );
    }
  };

  lines.forEach((rawLine, lineIdx) => {
    const trimmed = rawLine.trim();

    // Handle fenced code blocks ```
    if (trimmed.startsWith('```')) {
      flushList(`l-${lineIdx}`);
      if (inCodeBlock) {
        flushCodeBlock(`code-${lineIdx}`);
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      return;
    }

    // Empty line flushes active list
    if (!trimmed) {
      flushList(`empty-${lineIdx}`);
      return;
    }

    // Standalone display equation line: $$...$$ or \[...\]
    if (
      (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) ||
      (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 4)
    ) {
      flushList(`disp-eq-${lineIdx}`);
      const innerLatex = trimmed.slice(2, -2).trim();
      elements.push(
        <div key={`disp-eq-${lineIdx}`} className="my-1.5 overflow-x-auto">
          <MathFormula formula={innerLatex} displayMode={true} />
        </div>
      );
      return;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList(`h-${lineIdx}`);
      const headingText = headingMatch[2];
      elements.push(
        <h4
          key={`h-${lineIdx}`}
          className={
            variant === 'user'
              ? 'font-bold text-white text-xs sm:text-sm pt-1'
              : variant === 'dark'
                ? 'font-bold text-sky-300 text-xs sm:text-sm pt-1'
                : 'font-bold text-slate-900 text-xs sm:text-sm pt-1'
          }
        >
          {renderInlineScientificMarkdown(headingText, variant)}
        </h4>
      );
      return;
    }

    // Bullet list items (- , * , • )
    const bulletMatch = trimmed.match(/^(?:[-•]|\*(?!\*))\s+(.*)$/);
    if (bulletMatch) {
      if (listType === 'ol') flushList(`switch-${lineIdx}`);
      listType = 'ul';
      listItems.push(
        <li key={`li-${lineIdx}`} className="leading-relaxed">
          {renderInlineScientificMarkdown(bulletMatch[1], variant)}
        </li>
      );
      return;
    }

    // Numbered list items (1. , 2. )
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (listType === 'ul') flushList(`switch-${lineIdx}`);
      listType = 'ol';
      listItems.push(
        <li key={`oli-${lineIdx}`} className="leading-relaxed">
          {renderInlineScientificMarkdown(orderedMatch[2], variant)}
        </li>
      );
      return;
    }

    // Standalone formula line wrapped in single backticks: `...`
    if (
      trimmed.startsWith('`') &&
      trimmed.endsWith('`') &&
      trimmed.slice(1, -1).indexOf('`') === -1 &&
      trimmed.length > 3
    ) {
      flushList(`eq-${lineIdx}`);
      const inner = trimmed.slice(1, -1).trim();
      if (containsLatexMath(inner)) {
        elements.push(
          <div key={`eq-${lineIdx}`} className="my-1.5 overflow-x-auto">
            <MathFormula formula={inner} displayMode={true} />
          </div>
        );
      } else {
        elements.push(
          <p key={`eq-${lineIdx}`} className="leading-relaxed font-medium">
            {renderInlineScientificMarkdown(trimmed, variant)}
          </p>
        );
      }
      return;
    }

    // Regular paragraph line
    flushList(`p-${lineIdx}`);
    elements.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed">
        {renderInlineScientificMarkdown(trimmed, variant)}
      </p>
    );
  });

  flushList('final');

  if (inCodeBlock && codeBlockLines.length > 0) {
    flushCodeBlock('code-unclosed');
  }

  return <div className={`space-y-2 break-words ${className}`}>{elements}</div>;
};
