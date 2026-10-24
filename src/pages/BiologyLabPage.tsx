import React, { useState, useMemo, useEffect } from 'react';
import { CellScene } from '../components/biology/CellScene';
import { HeartScene } from '../components/biology/HeartScene';
import { DnaScene } from '../components/biology/DnaScene';
import { Dynamic3DModelRenderer } from '../components/models/Dynamic3DModelRenderer';
import { CELL_ORGANELLES, HEART_STRUCTURES, DNA_BASE_PAIRS } from '../data/biologyData';
import { FROG_ORGAN_LIST } from '../data/frogAnatomyData';
import { FrogAnatomyExplorer } from '../components/biology/FrogAnatomyExplorer';
import { BIOLOGY_BATCH_1_MODELS } from '../data/curatedModelsBatch3';
import { BIOLOGY_BATCH_2_MODELS } from '../data/curatedModelsBatch4';
import { ModelAwareChatbot, ModelChatContext } from '../components/ai/ModelAwareChatbot';
import {
  Dna,
  Heart,
  Sparkles,
  BookOpen,
  Brain,
  Eye,
  Wind,
  Utensils,
  Leaf,
  Microscope,
  Activity,
  Zap,
  TreePine,
  Droplets,
} from 'lucide-react';

export type BiologyModelId =
  | 'cell'
  | 'heart'
  | 'dna'
  | 'heart-explorer'
  | 'respiratory-explorer'
  | 'digestive-system'
  | 'brain-explorer'
  | 'eye-vision'
  | 'plant-cell-explorer'
  | 'animal-cell-explorer'
  | 'plant-root-transport'
  | 'blood-circulation-microscope'
  | 'blood-transport'
  | 'neuron-nerve-signal'
  | 'frog-anatomy';

export interface BiologyLabPageProps {
  initialModelId?: BiologyModelId;
  launchKey?: number;
}

export const BiologyLabPage: React.FC<BiologyLabPageProps> = ({ initialModelId, launchKey }) => {
  const [bioModel, setBioModel] = useState<BiologyModelId>(initialModelId || 'cell');

  const [batchParams, setBatchParams] = useState<Record<string, number>>({});
  const [batchConds, setBatchConds] = useState<Record<string, any>>({});

  // Selected sub-elements for foundation scenes
  const [selectedOrganelleId, setSelectedOrganelleId] = useState('nucleus');
  const [selectedStructureId, setSelectedStructureId] = useState('left_ventricle');
  const [selectedPairId, setSelectedPairId] = useState('at_pair');

  const handleTryIt = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.classList.add('ring-2', 'ring-rose-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-rose-500'), 1500);
    }
  };

  const activeCuratedSpec = useMemo(() => {
    switch (bioModel) {
      case 'heart-explorer':
        return BIOLOGY_BATCH_1_MODELS.heartExplorer;
      case 'respiratory-explorer':
        return BIOLOGY_BATCH_1_MODELS.respiratoryExplorer;
      case 'digestive-system':
        return BIOLOGY_BATCH_1_MODELS.digestiveExplorer;
      case 'brain-explorer':
        return BIOLOGY_BATCH_1_MODELS.brainExplorer;
      case 'eye-vision':
        return BIOLOGY_BATCH_1_MODELS.eyeVisionExplorer;
      case 'plant-cell-explorer':
        return BIOLOGY_BATCH_2_MODELS.plantCell;
      case 'animal-cell-explorer':
        return BIOLOGY_BATCH_2_MODELS.animalCell;
      case 'plant-root-transport':
        return BIOLOGY_BATCH_2_MODELS.plantRootTransport;
      case 'blood-circulation-microscope':
        return BIOLOGY_BATCH_2_MODELS.bloodMicroscope;
      case 'blood-transport':
        return BIOLOGY_BATCH_2_MODELS.bloodTransport;
      case 'neuron-nerve-signal':
        return BIOLOGY_BATCH_2_MODELS.neuronSignalExplorer;
      default:
        return null;
    }
  }, [bioModel]);

  useEffect(() => {
    if (initialModelId) {
      setBioModel(initialModelId);
    }
  }, [initialModelId, launchKey]);

  useEffect(() => {
    if (activeCuratedSpec) {
      const initParams: Record<string, number> = {};
      Object.values(activeCuratedSpec.parameters || {}).forEach((p) => {
        initParams[p.id] = p.defaultValue;
      });
      setBatchParams(initParams);

      const initConds: Record<string, any> = {};
      Object.values(activeCuratedSpec.conditions || {}).forEach((c) => {
        initConds[c.id] = c.defaultValue;
      });
      setBatchConds(initConds);
    }
  }, [activeCuratedSpec]);

  // Build model-aware context for active biology model and selected structure
  const chatbotContext: ModelChatContext = useMemo(() => {
    if (activeCuratedSpec) {
      return {
        modelId: activeCuratedSpec.id,
        title: activeCuratedSpec.title,
        subject: 'Biology',
        concept: activeCuratedSpec.concept || activeCuratedSpec.title,
        description: activeCuratedSpec.description,
        components: (activeCuratedSpec.parts || []).map((p) => ({
          id: p.id,
          name: p.name,
          whatIsIt: (p as any).whatIsIt || p.name,
          whatDoesItDo: (p as any).whatDoesItDo || p.description,
          description: p.description,
          realLifeExample: (p as any).realLifeExample || '',
        })),
        selectedComponent: null,
      };
    }

    if (bioModel === 'cell') {
      const selectedOrg = CELL_ORGANELLES.find((o) => o.id === selectedOrganelleId);
      return {
        modelId: 'cell',
        title: 'Animal Cell Organelles',
        subject: 'Biology / Cytology',
        concept: 'Eukaryotic Cell Architecture & Organelle Functions',
        description:
          '3D interactive eukaryotic animal cell demonstrating organelle compartmentalization, ATP synthesis, genetic storage, and transport.',
        components: CELL_ORGANELLES.map((o) => ({
          id: o.id,
          name: o.name,
          whatIsIt: o.structure,
          whatDoesItDo: o.function,
          description: o.function,
          realLifeExample: o.curiousFact,
        })),
        selectedComponent: selectedOrg
          ? {
              id: selectedOrg.id,
              name: selectedOrg.name,
              whatIsIt: selectedOrg.structure,
              whatDoesItDo: selectedOrg.function,
              description: selectedOrg.function,
              realLifeExample: selectedOrg.curiousFact,
            }
          : null,
      };
    } else if (bioModel === 'heart') {
      const selectedStruct = HEART_STRUCTURES.find((s) => s.id === selectedStructureId);
      return {
        modelId: 'heart',
        title: 'Human Heart Anatomy',
        subject: 'Biology / Cardiology & Physiology',
        concept: 'Double Circulation, Chamber Hemodynamics & Valvular Control',
        description:
          'Interactive 3D model of the 4-chambered human heart illustrating systemic and pulmonary circuits, pressure differentials, and valve mechanisms.',
        components: HEART_STRUCTURES.map((s) => ({
          id: s.id,
          name: s.name,
          whatIsIt: `${s.name} (${s.bloodType} blood)`,
          whatDoesItDo: s.role,
          description: s.role,
          realLifeExample: s.clinicalNote,
        })),
        selectedComponent: selectedStruct
          ? {
              id: selectedStruct.id,
              name: selectedStruct.name,
              whatIsIt: `${selectedStruct.name} carrying ${selectedStruct.bloodType} blood.`,
              whatDoesItDo: selectedStruct.role,
              description: selectedStruct.role,
              realLifeExample: selectedStruct.clinicalNote,
            }
          : null,
      };
    } else if (bioModel === 'frog-anatomy') {
      return {
        modelId: 'frog-anatomy',
        title: 'Frog Anatomy Explorer (Ventral Dissection Prototype)',
        subject: 'Biology / Comparative Amphibian Anatomy',
        concept: 'Amphibian Visceral Coelom & Comparative Organ Systems',
        description:
          'Educational 3D prototype illustrating the ventral visceral anatomy of the frog, featuring a 3-chambered heart, 3-lobed liver, paired lungs, J-shaped stomach, coiled small intestine, and large intestine/cloaca.',
        components: FROG_ORGAN_LIST.map((org) => ({
          id: org.id,
          name: org.name,
          whatIsIt: `${org.name} (${org.scientificName})`,
          whatDoesItDo: org.function,
          description: org.educationalDescription,
          realLifeExample: org.simplificationNotice,
        })),
        selectedComponent: null,
      };
    } else {
      const selectedPair = DNA_BASE_PAIRS.find((p) => p.id === selectedPairId);
      return {
        modelId: 'dna',
        title: 'Watson-Crick DNA Double Helix',
        subject: 'Biology / Molecular Genetics',
        concept: 'Antiparallel Double Helix & Complementary Base Pairing (Chargaff’s Rules)',
        description:
          'High-fidelity 3D model of B-DNA showcasing major/minor grooves, hydrogen bonding (A=T double bond, G≡C triple bond), and antiparallel sugar-phosphate backbones.',
        components: DNA_BASE_PAIRS.map((p) => ({
          id: p.id,
          name: p.pairName,
          whatIsIt: `${p.pairName} (${p.hydrogenBonds} Hydrogen Bonds, Distance: ${p.bondDistance})`,
          whatDoesItDo: p.description,
          description: p.description,
          realLifeExample: `${p.base1.name} (${p.base1.ringType}) pairs strictly with ${p.base2.name} (${p.base2.ringType}) via Chargaff's rules.`,
        })),
        selectedComponent: selectedPair
          ? {
              id: selectedPair.id,
              name: selectedPair.pairName,
              whatIsIt: `${selectedPair.pairName} with ${selectedPair.hydrogenBonds} hydrogen bonds.`,
              whatDoesItDo: selectedPair.description,
              description: selectedPair.description,
              realLifeExample: `Bond distance: ${selectedPair.bondDistance}. Complementary pairing across double helix.`,
            }
          : null,
      };
    }
  }, [bioModel, activeCuratedSpec, selectedOrganelleId, selectedStructureId, selectedPairId]);

  const getPageTitle = () => {
    switch (bioModel) {
      case 'cell':
        return '3D Animal Cell Organelle Explorer';
      case 'frog-anatomy':
        return 'Frog Anatomy Explorer (Ventral Dissection Prototype)';
      case 'heart':
        return '3D Human Heart Anatomical Visualizer';
      case 'dna':
        return '3D Watson-Crick DNA Double Helix';
      case 'heart-explorer':
        return '3D Human Heart Explorer (Model 21)';
      case 'respiratory-explorer':
        return '3D Human Respiratory System (Model 22)';
      case 'digestive-system':
        return '3D Human Digestive System (Model 23)';
      case 'brain-explorer':
        return '3D Human Brain Explorer (Model 24)';
      case 'eye-vision':
        return '3D Human Eye and Vision (Model 25)';
      case 'plant-cell-explorer':
        return '3D Plant Cell Explorer (Model 26)';
      case 'animal-cell-explorer':
        return '3D Animal Cell Explorer (Model 27)';
      case 'plant-root-transport':
        return '3D Plant Root and Transport Explorer (Model 28)';
      case 'blood-circulation-microscope':
        return '3D Blood & Circulation Microscope (Model 29)';
      case 'blood-transport':
        return '3D Blood Transport & Gas Exchange Explorer';
      case 'neuron-nerve-signal':
        return '3D Neuron & Nerve Signal Explorer (Model 30)';
      default:
        return '3D Biology Lab Explorer';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Model Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Biology Lab</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Curated 3D Cellular & Physiological Models</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {getPageTitle()}
          </h1>
        </div>

        {/* Biology Lab Workspace Switcher (Preset catalogue items 21–30 hidden from navigation bar and accessible via prompt) */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider">Foundations:</span>
            <button
              onClick={() => {
                setBioModel('cell');
                setBatchParams({});
                setBatchConds({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                bioModel === 'cell' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>3D Cell</span>
            </button>
            <button
              onClick={() => {
                setBioModel('heart');
                setBatchParams({});
                setBatchConds({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                bioModel === 'heart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Classic Heart</span>
            </button>
            <button
              onClick={() => {
                setBioModel('dna');
                setBatchParams({});
                setBatchConds({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                bioModel === 'dna' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dna className="w-3.5 h-3.5 text-sky-600" />
              <span>3D DNA Helix</span>
            </button>
            <button
              onClick={() => {
                setBioModel('frog-anatomy');
                setBatchParams({});
                setBatchConds({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                bioModel === 'frog-anatomy'
                  ? 'bg-white text-emerald-950 shadow-xs border border-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Frog Anatomy Prototype</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Model Viewport & Controls */}
      {bioModel === 'cell' && (
        <CellScene
          selectedOrganelleId={selectedOrganelleId}
          onSelectOrganelle={setSelectedOrganelleId}
          onTryIt={() => handleTryIt('cell-controls-panel')}
        />
      )}

      {bioModel === 'heart' && (
        <HeartScene
          selectedStructureId={selectedStructureId}
          onSelectStructure={setSelectedStructureId}
          onTryIt={() => handleTryIt('heart-controls-panel')}
        />
      )}

      {bioModel === 'dna' && (
        <DnaScene
          selectedPairId={selectedPairId}
          onSelectPair={setSelectedPairId}
          onTryIt={() => handleTryIt('dna-controls-deck')}
        />
      )}

      {bioModel === 'frog-anatomy' && (
        <FrogAnatomyExplorer onTryIt={() => handleTryIt('frog-controls-panel')} />
      )}

      {activeCuratedSpec && (
        <Dynamic3DModelRenderer
          modelSpec={activeCuratedSpec}
          parameters={batchParams}
          conditions={batchConds}
          onUpdateParameter={(id, val) => setBatchParams((prev) => ({ ...prev, [id]: val }))}
          onUpdateCondition={(id, val) => setBatchConds((prev) => ({ ...prev, [id]: val }))}
        />
      )}

      {/* Model-Aware AI Chatbot synchronized with current model & component */}
      <div className="pt-4 border-t border-slate-200">
        <ModelAwareChatbot context={chatbotContext} />
      </div>
    </div>
  );
};
