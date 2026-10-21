import React from 'react';
import { cleanAndFormatScientificText } from '../../utils/scientificTextFormatter';

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
 * Parses inline Markdown (**bold**, *italic*, `code`) into React nodes.
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
      ? 'font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/15 text-white border border-white/20'
      : variant === 'dark'
        ? 'font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900/90 text-emerald-300 border border-slate-700/80'
        : 'font-mono text-[11px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200/80 font-medium';

  // Tokenize by `code`, **bold**, and *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code key={idx} className={codeClass}>
          {codeContent}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={idx} className={boldClass}>
          {renderInlineScientificMarkdown(boldContent, variant)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const italicContent = part.slice(1, -1);
      return (
        <em key={idx} className="italic">
          {renderInlineScientificMarkdown(italicContent, variant)}
        </em>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({
  text,
  variant = 'light',
  className = '',
}) => {
  const normalized = cleanAndFormatScientificText(text || '');
  const lines = normalized.split('\n');

  const elements: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let inCodeBlock = false;
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

  lines.forEach((rawLine, lineIdx) => {
    const trimmed = rawLine.trim();

    // Handle fenced code blocks ```
    if (trimmed.startsWith('```')) {
      flushList(`l-${lineIdx}`);
      if (inCodeBlock) {
        const blockContent = codeBlockLines.join('\n');
        elements.push(
          <pre
            key={`code-${lineIdx}`}
            className={
              variant === 'dark'
                ? 'p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto my-1.5'
                : 'p-2.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto my-1.5 shadow-2xs'
            }
          >
            <code>{blockContent}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
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
    if (trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.slice(1, -1).indexOf('`') === -1 && trimmed.length > 3) {
      flushList(`eq-${lineIdx}`);
      const formulaText = trimmed.slice(1, -1);
      elements.push(
        <div
          key={`eq-${lineIdx}`}
          className={
            variant === 'user'
              ? 'px-3 py-1.5 rounded-lg bg-white/15 border border-white/20 font-mono text-[11px] font-semibold text-white my-1'
              : variant === 'dark'
                ? 'px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-[11px] font-semibold text-emerald-300 my-1'
                : 'px-3 py-2 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] font-semibold my-1 shadow-2xs'
          }
        >
          {formulaText}
        </div>
      );
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
    elements.push(
      <pre
        key="code-unclosed"
        className={
          variant === 'dark'
            ? 'p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto my-1.5'
            : 'p-2.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto my-1.5 shadow-2xs'
        }
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`space-y-2 break-words ${className}`}>{elements}</div>;
};
