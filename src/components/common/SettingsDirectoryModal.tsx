import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Settings,
  Search,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Layers,
  Cpu,
  FlaskConical,
  Zap,
  Dna,
  Activity,
  Compass,
  FolderGit2,
  Play,
  Server,
} from 'lucide-react';
import {
  MY_SCIENCE_MODELS_29,
  getAllIntegratedModelsDirectory,
  BACKEND_AI_AND_SCIENTIFIC_SERVICES,
  ModelLaunchTarget,
  ScienceModelDirectoryEntry,
} from '../../data/modelsDirectoryRegistry';

interface SettingsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchModel: (target: ModelLaunchTarget) => void;
}

type DirectorySectionTab = 'both' | 'my-29' | 'all-integrated' | 'backend-services';

export const SettingsDirectoryModal: React.FC<SettingsDirectoryModalProps> = ({
  isOpen,
  onClose,
  onLaunchModel,
}) => {
  const [activeSection, setActiveSection] = useState<DirectorySectionTab>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const allIntegratedModels = useMemo(() => getAllIntegratedModelsDirectory(), []);

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

  const filteredMy29Models = useMemo(() => {
    return MY_SCIENCE_MODELS_29.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (!normalizedQuery) return true;
      return (
        item.displayLabel.toLowerCase().includes(normalizedQuery) ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.subCategory.toLowerCase().includes(normalizedQuery) ||
        item.shortDescription.toLowerCase().includes(normalizedQuery) ||
        item.implementationComponent.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, selectedCategory]);

  const filteredAllModels = useMemo(() => {
    return allIntegratedModels.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        item.displayLabel.toLowerCase().includes(normalizedQuery) ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.subCategory.toLowerCase().includes(normalizedQuery) ||
        item.shortDescription.toLowerCase().includes(normalizedQuery) ||
        item.implementationComponent.toLowerCase().includes(normalizedQuery) ||
        item.dataDefinitionSource.toLowerCase().includes(normalizedQuery) ||
        item.routeLabel.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allIntegratedModels, normalizedQuery, selectedCategory, statusFilter]);

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
                <h2 id="settings-directory-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Tech-Anatomix Settings & Centralized Model Directory
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Full-Codebase Inventory
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Inspect and launch any of the 29 curated working science models or browse all {allIntegratedModels.length} integrated 3D models & laboratory simulations across the codebase.
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

        {/* Summary Metrics & Filter Bar */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Section Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveSection('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'both'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Both Sections View
              </button>
              <button
                onClick={() => setActiveSection('my-29')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'my-29'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>My Science Models (29)</span>
              </button>
              <button
                onClick={() => setActiveSection('all-integrated')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'all-integrated'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Integrated Models ({allIntegratedModels.length})</span>
              </button>
              <button
                onClick={() => setActiveSection('backend-services')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'backend-services'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Backend AI & Engines ({BACKEND_AI_AND_SCIENTIFIC_SERVICES.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by model name, number (1-29), ID, component path, or topic..."
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

          {/* Category & Architecture Type Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                Discipline:
              </span>
              {['All', 'Physics', 'Chemistry', 'Biology', 'Anatomy', 'Engineering & Earth Science'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {activeSection !== 'my-29' && activeSection !== 'backend-services' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                  Architecture:
                </span>
                {['All', 'Active & Verified', 'Standalone Lab Scene', 'Procedural 3D Synthesizer'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-sky-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'Active & Verified' ? 'Curated 3D Spec (90)' : st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-10 bg-slate-50/40">
          {/* SECTION B: MY SCIENCE MODELS (EXACT 29 WORKING MODELS) */}
          {(activeSection === 'both' || activeSection === 'my-29') && (
            <section aria-labelledby="my-science-models-heading" className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-emerald-950 via-slate-900 to-slate-900 text-white border border-emerald-800/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Section B · Dedicated Collection</span>
                  </div>
                  <h3 id="my-science-models-heading" className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    My Science Models (29 Verified Working Models)
                  </h3>
                  <p className="text-xs text-slate-300 max-w-3xl">
                    The exact 29 numbered science models from your notebook specification, each verified in the codebase and wired directly to its interactive 3D simulation scene.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-right">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300 block font-semibold">
                      Showing
                    </span>
                    <span className="text-base font-bold text-white">
                      {filteredMy29Models.length} / 29 Models
                    </span>
                  </div>
                </div>
              </div>

              {filteredMy29Models.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                  No models in My Science Models match "{searchQuery}" under filter "{selectedCategory}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMy29Models.map((item) => (
                    <div
                      key={`my29-${item.number}-${item.id}`}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0">
                            #{item.number}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeStyle(
                                item.category
                              )}`}
                            >
                              {getCategoryIcon(item.category)}
                              <span>{item.category}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Working 3D</span>
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {item.displayLabel}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {item.subCategory}
                          </p>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {item.shortDescription}
                        </p>

                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                          <div className="flex items-start gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="font-mono text-[10px] text-slate-600 break-all">
                              ID: {item.id} · {item.implementationComponent}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{item.routeLabel}</span>
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
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION A: ALL INTEGRATED MODELS (COMPLETE CODEBASE INVENTORY) */}
          {(activeSection === 'both' || activeSection === 'all-integrated') && (
            <section aria-labelledby="all-integrated-models-heading" className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Section A · Complete Codebase Discovery</span>
                  </div>
                  <h3 id="all-integrated-models-heading" className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    All Integrated Models ({allIntegratedModels.length} Total Verified Models)
                  </h3>
                  <p className="text-xs text-slate-600 max-w-3xl">
                    Complete deduplicated inventory of every 3D scientific model and simulation discovered across the codebase: 90 curated <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">ScientificModelSpec</code> models, 7 dedicated Three.js laboratory simulators, and 25 deterministic procedural 3D models.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                      Matching Inventory
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {filteredAllModels.length} / {allIntegratedModels.length}
                    </span>
                  </div>
                </div>
              </div>

              {filteredAllModels.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                  No integrated models match "{searchQuery}" under the active filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAllModels.map((item) => (
                    <div
                      key={`all-${item.id}`}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadgeStyle(
                              item.category
                            )}`}
                          >
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.isInMy29Models && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                My Science Model #{item.my29Number}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.displayLabel}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {item.subCategory}
                          </p>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {item.shortDescription}
                        </p>

                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-500">
                          <div className="font-mono text-slate-600 truncate" title={item.implementationComponent}>
                            <strong className="text-slate-700">Component:</strong> {item.implementationComponent}
                          </div>
                          <div className="font-mono text-slate-500 truncate" title={item.dataDefinitionSource}>
                            <strong className="text-slate-700">Source:</strong> {item.dataDefinitionSource}
                          </div>
                          <div className="text-slate-600 font-medium truncate" title={item.routeLabel}>
                            <strong className="text-slate-700">Route:</strong> {item.routeLabel}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenModelClick(item)}
                        className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Open Model</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* BACKEND AI ROUTES & SCIENTIFIC COMPUTATION ENGINES */}
          {(activeSection === 'both' || activeSection === 'backend-services') && (
            <section aria-labelledby="backend-services-heading" className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Backend & Engine Architecture</span>
                </div>
                <h3 id="backend-services-heading" className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Integrated Backend AI Services & Deterministic Mathematical Engines
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Server-side AI routes and deterministic scientific solvers powering model synthesis, reaction stoichiometry, and context-aware tutoring (zero private keys exposed).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {BACKEND_AI_AND_SCIENTIFIC_SERVICES.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
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
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span>
            Tech-Anatomix Centralized Model Directory · <strong>29</strong> My Science Models ·{' '}
            <strong>{allIntegratedModels.length}</strong> Total Integrated 3D Models
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
