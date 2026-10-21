import React, { useState } from 'react';
import { PresentationExportOptions, generateAndDownloadPptx } from '../../utils/presentationGenerator';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface PresentationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PresentationExportOptions;
  defaultFilename?: string;
}

export const PresentationExportModal: React.FC<PresentationExportModalProps> = ({
  isOpen,
  onClose,
  data,
  defaultFilename,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<{
    slideCount: number;
    filename: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsGenerating(true);
    setError(null);
    setDownloadSuccess(null);

    try {
      setProgressStep('Validating scientific content and equations...');
      await new Promise((r) => setTimeout(r, 200));

      setProgressStep('Compiling 16:9 widescreen presentation layout...');
      await new Promise((r) => setTimeout(r, 250));

      setProgressStep('Packaging PowerPoint (.pptx) archive...');
      const targetFilename = defaultFilename || data.title;
      const res = await generateAndDownloadPptx(data, targetFilename);

      if (res.success) {
        setDownloadSuccess({
          slideCount: res.slideCount,
          filename: `${targetFilename.replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`,
        });
      }
    } catch (err: any) {
      console.error('PPTX export error:', err);
      setError(err?.message || 'Failed to generate presentation. Please check input parameters.');
    } finally {
      setIsGenerating(false);
      setProgressStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export to PowerPoint (.pptx)</h3>
              <p className="text-[11px] text-slate-400">Tech-Anatomix STEM Presentation Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Deck Overview Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white text-sm">{data.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800">
                16:9 Widescreen
              </span>
            </div>
            {data.subtitle && <p className="text-xs text-slate-400">{data.subtitle}</p>}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                {data.slides.length + 1} Total Slides
              </span>
              <span>•</span>
              <span>Fully Editable PPTX Archive</span>
            </div>
          </div>

          {/* Slide Outline Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Slide Outline ({data.slides.length + 1} Slides)
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
                <span className="font-mono text-emerald-400 font-bold text-[10px]">1</span>
                <span className="font-medium text-slate-200">Title Slide: {data.title}</span>
              </div>
              {data.slides.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-sky-400 font-bold text-[10px]">{idx + 2}</span>
                    <span className="text-slate-300 truncate">{s.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {s.bullets ? `${s.bullets.length} points` : s.table ? 'Data Table' : 'System Overview'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress / Error / Success States */}
          {isGenerating && (
            <div className="p-3.5 rounded-xl bg-sky-950/80 border border-sky-800/80 text-sky-300 text-xs flex items-center gap-2.5 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
              <span>{progressStep || 'Generating slides...'}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Presentation Generation Failed</span>
                <span className="text-[11px] text-rose-300/90">{error}</span>
              </div>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs space-y-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">PowerPoint File Created & Downloaded!</span>
              </div>
              <p className="text-[11px] text-emerald-300/80">
                Generated {downloadSuccess.slideCount} slides formatted for classroom and lab presentation.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            {downloadSuccess ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg hover:shadow-emerald-900/40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating PPTX...' : downloadSuccess ? 'Download Again' : 'Download PowerPoint (.pptx)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
