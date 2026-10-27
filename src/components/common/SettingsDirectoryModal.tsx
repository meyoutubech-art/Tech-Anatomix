import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Settings,
  Search,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Zap,
  Dna,
  Activity,
  Compass,
  FolderGit2,
  Play,
  Server,
  ShieldCheck,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getUnifiedModelLibrary,
  getModelDiscoveryDiagnostics,
  BACKEND_AI_AND_SCIENTIFIC_SERVICES,
  ModelLaunchTarget,
  ScienceModelDirectoryEntry,
} from '../../data/modelsDirectoryRegistry';

interface SettingsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchModel: (target: ModelLaunchTarget) => void;
}

export const SettingsDirectoryModal: React.FC<SettingsDirectoryModalProps> = ({
  isOpen,
  onClose,
  onLaunchModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [showBackendEngines, setShowBackendEngines] = useState(false);

  const unifiedInventory = useMemo(() => getUnifiedModelLibrary(), []);
  const diagnostics = useMemo(() => getModelDiscoveryDiagnostics(), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredModels = useMemo(() => {
    return unifiedInventory.filter((item) => {
      // Subject filter: match primary category or secondary subjectTags
      if (selectedSubject !== 'All Subjects') {
        const matchesPrimary = item.category === selectedSubject;
        const matchesSecondaryTag = (item.subjectTags || []).some(
          (tag) => tag.toLowerCase() === selectedSubject.toLowerCase()
        );
        if (!matchesPrimary && !matchesSecondaryTag) {
          return false;
        }
      }

      if (!normalizedQuery) return true;

      const canonicalMatch =
        (item.canonicalName || item.title).toLowerCase().includes(normalizedQuery) ||
        item.displayLabel.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery);

      const aliasMatch = (item.aliases || []).some((alias) =>
        alias.toLowerCase().includes(normalizedQuery)
      );

      const subjectMatch =
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.subCategory.toLowerCase().includes(normalizedQuery) ||
        (item.subjectTags || []).some((tag) => tag.toLowerCase().includes(normalizedQuery));

      const metaMatch =
        item.shortDescription.toLowerCase().includes(normalizedQuery) ||
        item.implementationComponent.toLowerCase().includes(normalizedQuery) ||
        item.dataDefinitionSource.toLowerCase().includes(normalizedQuery) ||
        item.routeLabel.toLowerCase().includes(normalizedQuery);

      return canonicalMatch || aliasMatch || subjectMatch || metaMatch;
    });
  }, [unifiedInventory, normalizedQuery, selectedSubject]);

  if (!isOpen) return null;

  const getCategoryBadgeStyle = (category: ScienceModelDirectoryEntry['category']) => {
    switch (category) {
      case 'Physics':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Chemistry':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Biology':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Anatomy':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getCategoryIcon = (category: ScienceModelDirectoryEntry['category']) => {
    switch (category) {
      case 'Physics':
        return <Zap className="w-3.5 h-3.5" />;
      case 'Chemistry':
        return <FlaskConical className="w-3.5 h-3.5" />;
      case 'Biology':
        return <Dna className="w-3.5 h-3.5" />;
      case 'Anatomy':
        return <Activity className="w-3.5 h-3.5" />;
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  const handleOpenModelClick = (item: ScienceModelDirectoryEntry) => {
    onLaunchModel(item.launchTarget);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-directory-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-7xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="settings-directory-title"
                  className="text-base sm:text-lg font-bold tracking-tight text-white"
                >
                  Tech-Anatomix Settings & Unified Model Library
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {diagnostics.totalUniqueModels} Unique Canonical Models
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {diagnostics.duplicateReferencesResolved} Alias References Deduplicated
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Single unified inventory automatically discovered from all codebase registries ({diagnostics.curatedSpecsCount} curated 3D specs, {diagnostics.standaloneLabScenesCount} standalone Three.js lab scenes, and {diagnostics.proceduralModelsCount} deterministic procedural 3D models).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Settings Directory"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Subject Category Filter Bar */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Subject Filters */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Subject Filters">
              {diagnostics.availableCategories.map((subject) => {
                const isSelected = selectedSubject === subject;
                const count =
                  subject === 'All Subjects'
                    ? unifiedInventory.length
                    : unifiedInventory.filter(
                        (m) =>
                          m.category === subject ||
                          (m.subjectTags || []).some(
                            (tag) => tag.toLowerCase() === subject.toLowerCase()
                          )
                      ).length;
                return (
                  <button
                    key={subject}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{subject}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search unified library by model name, ID, alias, or subject..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Discovery & Verification Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Showing <strong>{filteredModels.length}</strong> of{' '}
                  <strong>{diagnostics.totalUniqueModels}</strong> unique models
                </span>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Integrated: <strong>{diagnostics.integratedCount}</strong>
              </span>
              <span>
                Verified: <strong className="text-emerald-700">{diagnostics.verifiedCount}</strong>
              </span>
              {diagnostics.needsReviewCount > 0 && (
                <span>
                  Needs Review: <strong className="text-amber-700">{diagnostics.needsReviewCount}</strong>
                </span>
              )}
              {diagnostics.unavailableCount > 0 && (
                <span>
                  Unavailable: <strong className="text-rose-700">{diagnostics.unavailableCount}</strong>
                </span>
              )}
            </div>

            <button
              onClick={() => setShowBackendEngines((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-sky-600" />
              <span>Backend AI & Solvers ({BACKEND_AI_AND_SCIENTIFIC_SERVICES.length})</span>
              {showBackendEngines ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Unified Model Library Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/40">
          {/* Optional Collapsible Backend AI & Scientific Engines Drawer */}
          {showBackendEngines && (
            <section
              aria-labelledby="backend-services-heading"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Backend & Engine Architecture</span>
                  </div>
                  <h3
                    id="backend-services-heading"
                    className="text-sm sm:text-base font-bold text-slate-900 mt-1"
                  >
                    Integrated Backend AI Services & Deterministic Mathematical Engines
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BACKEND_AI_AND_SCIENTIFIC_SERVICES.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{svc.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {svc.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{svc.description}</p>
                    <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/70">
                      {svc.endpointOrFile}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ONE UNIFIED MODEL LIBRARY */}
          <section aria-labelledby="unified-model-library-heading" className="space-y-4">
            <h3 id="unified-model-library-heading" className="sr-only">
              Unified Science Model Library
            </h3>

            {filteredModels.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  No models match "{searchQuery}" in {selectedSubject}.
                </p>
                <p className="text-xs text-slate-500">
                  Try searching by another canonical name, alias, model ID, or switch the subject filter to All Subjects.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('All Subjects');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((item) => {
                  const canonicalTitle = item.canonicalName || item.title;
                  const secondaryTags = (item.subjectTags || []).filter(
                    (t) => t !== item.category
                  );
                  const visibleAliases = (item.aliases || []).filter(
                    (a) =>
                      a.toLowerCase() !== canonicalTitle.toLowerCase() &&
                      a.toLowerCase() !== item.displayLabel.toLowerCase()
                  );

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2.5">
                        {/* Top Metadata Badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeStyle(
                              item.category
                            )}`}
                          >
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {item.isInMy29Models && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300"
                                title="Featured Core Science Model"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Featured #{item.my29Number}</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>
                                {item.verificationStatus || 'Verified'} · {item.integrationStatus || 'Integrated'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Canonical Model Title & Subcategory */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {canonicalTitle}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {item.subCategory}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {item.shortDescription}
                        </p>

                        {/* Secondary Subject Tags */}
                        {secondaryTags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                            {secondaryTags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Technical Provenance & Aliases */}
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-500">
                          <div className="flex items-start gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="font-mono text-slate-600 break-all">
                              ID: {item.id} · {item.discoverySource || item.status}
                            </span>
                          </div>
                          {visibleAliases.length > 0 && (
                            <div className="text-slate-500 truncate" title={visibleAliases.join(', ')}>
                              <strong className="text-slate-700">Aliases:</strong>{' '}
                              {visibleAliases.slice(0, 3).join(', ')}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate" title={item.routeLabel}>
                              {item.routeLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenModelClick(item)}
                        className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open Model</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span>
            Tech-Anatomix Unified Model Library ·{' '}
            <strong>{diagnostics.totalUniqueModels}</strong> Unique Integrated Models ({diagnostics.original29Count} Featured Core + {diagnostics.additionalModelsCount} Additional Discovered)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
