import React, { useState, useEffect } from 'react';
import {
  DiagramScanResult,
  DiagramLabelPin,
} from '../../types/diagramScan';
import { CURATED_AI_MODELS } from '../../data/curatedAiModels';
import { Dynamic3DModelRenderer } from '../models/Dynamic3DModelRenderer';
import { HeartScene } from '../biology/HeartScene';
import { CellScene } from '../biology/CellScene';
import { DnaScene } from '../biology/DnaScene';
import { EducationalExplanationBox, ExplanationData } from '../common/EducationalExplanationBox';
import { ModelAwareChatbot, ModelChatContext } from '../ai/ModelAwareChatbot';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Maximize2,
  Eye,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface DiagramSplitScreenViewProps {
  scanResult: DiagramScanResult;
  onResetScan: () => void;
}

export const DiagramSplitScreenView: React.FC<DiagramSplitScreenViewProps> = ({
  scanResult,
  onResetScan,
}) => {
  // Mobile responsive view mode toggle
  const [mobileTab, setMobileTab] = useState<'image' | '3d'>('3d');

  // Selected label/component linking
  const [selectedPinId, setSelectedPinId] = useState<string | null>(() => {
    return scanResult.labels.length > 0 ? scanResult.labels[0].id : null;
  });

  // User confirmation for uncertain identifications
  const [isConfirmedByUser, setIsConfirmedByUser] = useState<boolean>(
    scanResult.isConfident
  );

  // 3D Model Label Visibility (default: ON)
  const [showLabels, setShowLabels] = useState(true);

  // Active 3D model specification (curated or dynamic AI generated)
  const activeSpec = scanResult.modelSpec
    ? scanResult.modelSpec
    : (scanResult.verified3DModelId && CURATED_AI_MODELS[scanResult.verified3DModelId])
      ? CURATED_AI_MODELS[scanResult.verified3DModelId]
      : (scanResult.verified3DModelId && CURATED_AI_MODELS[scanResult.verified3DModelId.toLowerCase()])
        ? CURATED_AI_MODELS[scanResult.verified3DModelId.toLowerCase()]
        : CURATED_AI_MODELS.motor;

  // Active selected pin object
  const activePin = scanResult.labels.find((l) => l.id === selectedPinId) || scanResult.labels[0];

  // Handle clicking a pin in the textbook diagram image
  const handleSelectImagePin = (pin: DiagramLabelPin) => {
    setSelectedPinId(pin.id);
  };

  // Explanation Data dynamically generated for the area BELOW the 3D window
  const explanationData: ExplanationData = activePin
    ? {
        title: activePin.name,
        badge: 'Selected Diagram Component',
        subtitle: `${scanResult.concept} · Linked 3D Part: ${activePin.componentId}`,
        whatIsIt:
          activePin.whatIsIt ||
          `The ${activePin.name} is a key functional component identified in the textbook diagram.`,
        whatDoesItDo:
          activePin.whatDoesItDo ||
          `Operates within the ${scanResult.concept} system to perform mechanical or biological functions.`,
        realLifeExample:
          activePin.realLifeExample ||
          `Found in everyday scientific and technological applications using ${scanResult.concept}.`,
        whyTitle: 'HOW DOES THIS COMPONENT FUNCTION IN THE 3D MODEL?',
        whyExplanation: `Synchronized between diagram coordinates [${activePin.xPercent}%, ${activePin.yPercent}%] and the 3D mesh. Camera focus is locked onto ${activePin.name}.`,
        examConnection: scanResult.examConnection,
        onClearSelection: () => setSelectedPinId(null),
      }
    : {
        title: scanResult.concept,
        badge: scanResult.confidenceLabel,
        subtitle: `${scanResult.subject} · ${scanResult.diagramType}`,
        whatIsIt: scanResult.whatIsIt,
        howDoesItWork: scanResult.howDoesItWork,
        realLifeExample: scanResult.realLifeExample,
        whyTitle: 'WHY DOES THIS 3D MODEL MATCH THE DIAGRAM?',
        whyExplanation: scanResult.whyExplanation,
        examConnection: scanResult.examConnection,
      };

  return (
    <div className="space-y-6">
      {/* Top Status & Controls Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              {scanResult.subject}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {scanResult.diagramType}
            </span>
            <span className="text-slate-300">·</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                scanResult.confidence >= 0.85
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {scanResult.confidence >= 0.85 ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              )}
              <span>
                {scanResult.confidenceLabel} ({Math.round(scanResult.confidence * 100)}%)
              </span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {scanResult.concept}
          </h2>
        </div>

        {/* Action Buttons & Mobile Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mobile View Toggle */}
          <div className="lg:hidden flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setMobileTab('image')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                mobileTab === 'image'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              [TEXTBOOK IMAGE]
            </button>
            <button
              onClick={() => setMobileTab('3d')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                mobileTab === '3d'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              [3D MODEL]
            </button>
          </div>

          <button
            onClick={onResetScan}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Another Diagram</span>
          </button>
        </div>
      </div>

      {/* Low Confidence / Possible Identification Confirmation Notice */}
      {!isConfirmedByUser && (
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Possible Identification ({Math.round(scanResult.confidence * 100)}% Match Confidence)
              </p>
              <p className="text-amber-700 mt-0.5">
                VIZLAB never presents uncertain AI interpretations as absolute scientific fact. Please review the detected components below and confirm if this matches your diagram.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConfirmedByUser(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            Confirm &amp; Explore 3D Model
          </button>
        </div>
      )}

      {/* Main Split-Screen Container */}
      {/* Desktop: Side-by-Side (50% Diagram, 50% 3D Model) */}
      {/* Mobile: Toggled via mobileTab state */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Original Uploaded Diagram Image with Interactive Pins */}
        <div
          className={`lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4 ${
            mobileTab === '3d' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Original Textbook Diagram
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {scanResult.labels.length} Detected Labels
            </span>
          </div>

          {/* Interactive Image Container with Label Markers */}
          <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 select-none group">
            <img
              src={scanResult.imageUrl}
              alt={scanResult.concept}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Interactive Pins on Image */}
            {scanResult.labels.map((pin) => {
              const isSelected = activePin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  onClick={() => handleSelectImagePin(pin)}
                  style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                  title={`${pin.name} (Click to link to 3D model)`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold shadow-md transition-all cursor-pointer z-20 ${
                    isSelected
                      ? 'bg-sky-600 text-white ring-4 ring-sky-300 scale-110 shadow-sky-300/50'
                      : 'bg-white/95 text-slate-800 hover:bg-white hover:scale-105 border border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white animate-pulse' : 'bg-sky-600'
                    }`}
                  />
                  <span>{pin.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Labels List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Interactive Component Linking</span>
              <span>Tap to inspect</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scanResult.labels.map((pin) => {
                const isSelected = activePin?.id === pin.id;
                return (
                  <button
                    key={pin.id}
                    onClick={() => handleSelectImagePin(pin)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? 'bg-sky-600' : 'bg-slate-400'
                        }`}
                      />
                      <span className="text-xs truncate">{pin.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {Math.round(pin.confidence * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Interactive 3D VIZLAB Model */}
        <div
          className={`lg:col-span-7 flex flex-col gap-4 ${
            mobileTab === 'image' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Render 3D Model Window */}
          {scanResult.verified3DModelId === 'heart' ? (
            <HeartScene
              selectedStructureId={activePin?.componentId || 'left_ventricle'}
              onSelectStructure={(id) => {
                const match = scanResult.labels.find((l) => l.componentId === id);
                if (match) setSelectedPinId(match.id);
              }}
            />
          ) : scanResult.verified3DModelId === 'cell' ? (
            <CellScene
              selectedOrganelleId={activePin?.componentId || 'nucleus'}
              onSelectOrganelle={(id) => {
                const match = scanResult.labels.find((l) => l.componentId === id);
                if (match) setSelectedPinId(match.id);
              }}
            />
          ) : scanResult.verified3DModelId === 'dna' ? (
            <DnaScene
              selectedPairId={activePin?.componentId || 'pair-1'}
              onSelectPair={(id) => {
                const match = scanResult.labels.find((l) => l.componentId === id);
                if (match) setSelectedPinId(match.id);
              }}
            />
          ) : (
            <Dynamic3DModelRenderer
              modelSpec={activeSpec}
              selectedPartId={activePin?.componentId}
              showLabels={showLabels}
              onToggleLabels={setShowLabels}
              onSelectPart={(part) => {
                if (part) {
                  const match = scanResult.labels.find((l) => l.componentId === part.id);
                  if (match) setSelectedPinId(match.id);
                }
              }}
            />
          )}

          {/* EDUCATIONAL EXPLANATION BOX (Directly BELOW 3D window) */}
          <EducationalExplanationBox data={explanationData} />
        </div>
      </div>

      {/* Model-Aware AI Chatbot synchronized with scanned diagram & 3D model */}
      <div className="pt-4 border-t border-slate-200">
        <ModelAwareChatbot
          context={{
            modelId: scanResult.verified3DModelId || scanResult.concept,
            title: scanResult.concept,
            subject: `${scanResult.subject} / Diagram Scan Analysis`,
            concept: `${scanResult.concept} (${scanResult.diagramType})`,
            description: `${scanResult.diagramType} with ${scanResult.labels.length} detected labels. ${scanResult.whyExplanation}`,
            components: scanResult.labels.map((l) => ({
              id: l.id,
              name: l.name,
              whatIsIt: l.whatIsIt || `Textbook label: ${l.name}`,
              whatDoesItDo: l.whatDoesItDo || `Functional component in ${scanResult.concept}`,
              description: `Linked to 3D part: ${l.componentId}. Image position: (${Math.round(l.xPercent)}%, ${Math.round(l.yPercent)}%).`,
              realLifeExample: l.realLifeExample,
            })),
            selectedComponent: activePin
              ? {
                  id: activePin.id,
                  name: activePin.name,
                  whatIsIt: activePin.whatIsIt || `Textbook label: ${activePin.name}`,
                  whatDoesItDo: activePin.whatDoesItDo || `Functional component in ${scanResult.concept}`,
                  description: `Linked to 3D part: ${activePin.componentId}.`,
                  realLifeExample: activePin.realLifeExample,
                }
              : null,
          }}
        />
      </div>
    </div>
  );
};
