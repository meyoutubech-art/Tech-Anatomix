import React from 'react';
import { ExternalLink, FileSpreadsheet, Sparkles, BookOpen } from 'lucide-react';
import { ExternalModelAiChat, ExternalModelChatContext } from '../ai/ExternalModelAiChat';
import { EducationalExplanationBox } from '../common/EducationalExplanationBox';
import { getComponentDisplayName } from '../../utils/componentDisplayName';

export interface ExternalModelWorkspaceProps {
  // Model Identification & Metadata
  modelId: string;
  title: string;
  badge?: string;
  subtitle?: string;
  concept?: string;
  description?: string;
  parts?: Array<{ id: string; name: string; label?: string; description?: string }>;
  equations?: string[];
  examConnection?: string;
  whatIsIt?: string;
  howDoesItWork?: string;
  realLifeExample?: string;
  whyTitle?: string;
  whyExplanation?: string;

  // 3D Viewer Props
  embedUrl: string;
  embedTitle?: string;
  authorName?: string;
  authorUrl?: string;
  modelUrl?: string;
  rawEmbedHtml?: string;

  // Actions
  onExportPresentation?: () => void;
  heightClass?: string;
}

export const ExternalModelWorkspace: React.FC<ExternalModelWorkspaceProps> = ({
  modelId,
  title,
  badge = 'Interactive 3D Model',
  subtitle,
  concept,
  description,
  parts = [],
  equations = [],
  examConnection,
  whatIsIt,
  howDoesItWork,
  realLifeExample,
  whyTitle,
  whyExplanation,
  embedUrl,
  embedTitle,
  authorName,
  authorUrl,
  modelUrl,
  rawEmbedHtml,
  onExportPresentation,
  heightClass = 'h-[520px] sm:h-[580px] lg:h-[640px]',
}) => {
  const chatContext: ExternalModelChatContext = {
    modelId,
    title,
    concept: concept || subtitle,
    description,
    parts: parts.map((p) => ({
      ...p,
      name: getComponentDisplayName(p),
    })),
    equations,
    examConnection,
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* =========================================================================
          MODEL TITLE BANNER (Spans Across Workspace)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-600" />
              <span>{badge}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Verified 3D Embed
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {modelUrl && (
            <a
              href={modelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="Open full 3D model directly on Sketchfab"
            >
              <span>Sketchfab</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          )}
        </div>
      </div>

      {/* =========================================================================
          TWO-COLUMN WORKSPACE:
          DESKTOP (lg:):
            LEFT: AI CHAT ASSISTANT (~50%)
            RIGHT: 3D MODEL VIEWER (~50%)
          MOBILE (< lg):
            3D MODEL VIEWER (Top, order-1)
            AI CHAT ASSISTANT (Bottom, order-2)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
        {/* LEFT PANEL (Desktop Left 50%): AI CHAT ASSISTANT */}
        <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col w-full">
          <ExternalModelAiChat
            context={chatContext}
            heightClass={heightClass}
            className="w-full h-full"
          />
        </div>

        {/* RIGHT PANEL (Desktop Right 50%): 3D MODEL VIEWER */}
        <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col w-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive 3D Viewer</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Click & drag to orbit · Scroll to zoom
              </span>
            </div>

            {/* Iframe Viewport */}
            <div className={`sketchfab-embed-wrapper w-full ${heightClass} relative rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-950 flex flex-col`}>
              {/* TOP EXTREME LEFT: Brand Logo in Viewer Screen */}
              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <img
                  src="/logo.png"
                  alt="Tech-Anatomix Logo"
                  className="w-9 h-9 object-contain rounded-lg shadow-md drop-shadow bg-slate-900/60 p-1 backdrop-blur-xs border border-white/15"
                />
              </div>

              {embedUrl ? (
                <iframe
                  title={embedTitle || title}
                  frameBorder="0"
                  allowFullScreen
                  // @ts-ignore
                  mozallowfullscreen="true"
                  webkitallowfullscreen="true"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  // @ts-ignore
                  xr-spatial-tracking="true"
                  execution-while-out-of-viewport="true"
                  execution-while-not-rendered="true"
                  web-share="true"
                  src={embedUrl}
                  className="w-full h-full border-0 block"
                />
              ) : rawEmbedHtml ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: rawEmbedHtml }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BELOW WORKSPACE: FULL-WIDTH EDUCATIONAL EXPLANATION BOX
          ========================================================================= */}
      <EducationalExplanationBox
        data={{
          title,
          badge: badge || '3D Human Anatomy & Physiology',
          subtitle: concept || subtitle,
          whatIsIt: whatIsIt || description,
          howDoesItWork: howDoesItWork || description,
          realLifeExample: realLifeExample || 'Physiological and structural foundation for advanced biomedical science.',
          whyTitle: whyTitle || '3D ANATOMICAL MODEL REVIEW',
          whyExplanation: whyExplanation || 'Explore this biological system in high-fidelity 3D with interactive orbit, zoom, pan, and real-time anatomical annotations directly on the model.',
          examConnection,
          formula: equations?.[0],
        }}
      />
    </div>
  );
};
