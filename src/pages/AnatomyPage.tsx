import React, { useState, useMemo, useEffect } from 'react';
import { PageRoute } from '../components/layout/Navbar';
import { FrogAnatomyExplorer } from '../components/biology/FrogAnatomyExplorer';
import { HumanAnatomyExplorer } from '../components/biology/HumanAnatomyExplorer';
import { ExternalModelAiChat } from '../components/ai/ExternalModelAiChat';
import { FROG_ORGAN_MANIFEST, FROG_ORGAN_LIST } from '../data/frogAnatomyData';
import { HUMAN_ORGAN_LIST } from '../data/humanAnatomyData';
import { FrogOrganId } from '../types/frogAnatomy';
import { PresentationExportModal } from '../components/common/PresentationExportModal';
import { PresentationExportOptions } from '../utils/presentationGenerator';
import {
  Activity,
  Heart,
  Layers,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Info,
  User,
  Scissors,
  FileSpreadsheet,
} from 'lucide-react';

interface AnatomyPageProps {
  onNavigate?: (route: PageRoute) => void;
  initialSpecimen?: 'frog' | 'human';
  launchKey?: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: { label: string; organId?: string; isCorrect: boolean }[];
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many chambers does the amphibian frog heart possess compared to the 4-chambered mammalian heart?',
    options: [
      { label: '2 chambers (1 atrium, 1 ventricle)', organId: 'heart', isCorrect: false },
      { label: '3 chambers (2 atria, 1 ventricle)', organId: 'heart', isCorrect: true },
      { label: '4 chambers (2 atria, 2 ventricles)', organId: 'heart', isCorrect: false },
      { label: '1 chamber with open circulation', organId: 'heart', isCorrect: false },
    ],
    explanation: 'The frog heart has 3 chambers: right atrium (deoxygenated venous blood), left atrium (oxygenated pulmonary blood), and a single muscular ventricle with trabeculae.',
  },
  {
    id: 2,
    question: 'Which prominent organ occupies the largest portion of the anterior coelom with three distinct lobes?',
    options: [
      { label: 'Stomach', organId: 'stomach', isCorrect: false },
      { label: 'Paired Lungs', organId: 'lungs', isCorrect: false },
      { label: 'Liver (Hepar)', organId: 'liver', isCorrect: true },
      { label: 'Large Intestine', organId: 'large_intestine_cloaca', isCorrect: false },
    ],
    explanation: 'The frog liver has three lobes (left anterior, left posterior, and right) framing the pericardial sac and producing bile stored in the gall bladder.',
  },
  {
    id: 3,
    question: 'What is the function of the cloaca in the frog anatomy?',
    options: [
      { label: 'Common exit chamber for digestive, urinary, and reproductive systems', organId: 'large_intestine_cloaca', isCorrect: true },
      { label: 'Primary site of nutrient absorption along the villi', organId: 'small_intestine', isCorrect: false },
      { label: 'Mechanical grinding of ingested insect prey', organId: 'stomach', isCorrect: false },
      { label: 'Gas exchange through vascularized alveoli', organId: 'lungs', isCorrect: false },
    ],
    explanation: 'In amphibians, the cloaca is the single terminal chamber into which the intestinal tract, ureters from the kidneys, and genital ducts all empty.',
  },
  {
    id: 4,
    question: 'How do frogs primarily perform pulmonary gas exchange when not using cutaneous respiration?',
    options: [
      { label: 'Diaphragm contraction creating negative thoracic pressure', organId: 'lungs', isCorrect: false },
      { label: 'Positive pressure buccal pumping driving air into paired sacculated lungs', organId: 'lungs', isCorrect: true },
      { label: 'Countercurrent gill lamellae fluid exchange', organId: 'lungs', isCorrect: false },
      { label: 'Passive capillary osmosis without muscular movement', organId: 'lungs', isCorrect: false },
    ],
    explanation: 'Frogs lack a diaphragm and ribs for thoracic expansion; they use positive pressure buccal pumping (lowering and raising the mouth floor) to push air into simple paired sacculated lungs.',
  },
  {
    id: 5,
    question: 'What physiological anatomical adaptation prevents oxygenated and deoxygenated blood mixing in the human heart?',
    options: [
      { label: 'Complete interventricular septum creating 4 distinct chambers', organId: 'human_heart', isCorrect: true },
      { label: 'Truncus arteriosus spiral valve folding', organId: 'human_heart', isCorrect: false },
      { label: 'Cutaneous gas exchange capillaries in the dermal layer', organId: 'human_heart', isCorrect: false },
      { label: 'Single common ventricle with trabecular grooves', organId: 'human_heart', isCorrect: false },
    ],
    explanation: 'The human heart possesses a complete muscular interventricular septum separating the right side (deoxygenated venous blood to lungs) from the high-pressure left side (oxygenated blood to aorta), achieving 100% circuit separation.',
  },
  {
    id: 6,
    question: 'How does the human respiratory mechanism fundamentally differ from amphibian ventilation?',
    options: [
      { label: 'Humans generate negative thoracic pressure via the diaphragm and intercostal ribs', organId: 'human_lungs', isCorrect: true },
      { label: 'Humans rely entirely on positive-pressure buccopharyngeal swallowing', organId: 'human_lungs', isCorrect: false },
      { label: 'Humans absorb 50% of oxygen through moist skin fascia', organId: 'human_lungs', isCorrect: false },
      { label: 'Humans lack internal alveoli partitions', organId: 'human_lungs', isCorrect: false },
    ],
    explanation: 'Mammals expand the thoracic cavity with the diaphragm and external intercostal muscles, creating negative intrapulmonary pressure that draws air into over 300 million alveoli, whereas frogs lack ribs/diaphragm and use positive pressure buccal pumping.',
  },
];

// Enable human anatomy explorer in Phase 1
export const ENABLE_HUMAN_ANATOMY = true;

export const AnatomyPage: React.FC<AnatomyPageProps> = ({ onNavigate, initialSpecimen, launchKey }) => {
  const [selectedSpecimen, setSelectedSpecimen] = useState<'frog' | 'human'>(initialSpecimen || 'human');
  const [activeTab, setActiveTab] = useState<'3d-model' | 'systems' | 'comparative' | 'quiz'>('3d-model');
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  useEffect(() => {
    if (initialSpecimen) {
      setSelectedSpecimen(initialSpecimen);
      setActiveTab('3d-model');
    }
  }, [initialSpecimen, launchKey]);

  // Filter quiz questions when human anatomy is temporarily disabled
  const activeQuizQuestions = useMemo(() => {
    if (!ENABLE_HUMAN_ANATOMY) {
      return QUIZ_QUESTIONS.filter((q) => !q.options.some((o) => o.organId?.startsWith('human_')));
    }
    return QUIZ_QUESTIONS;
  }, []);

  const handleSelectQuizOption = (questionId: number, optionIndex: number) => {
    setSelectedQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedQuizAnswers({});
    setShowQuizResults(false);
  };

  const quizScore = activeQuizQuestions.reduce((score, q) => {
    const selectedIdx = selectedQuizAnswers[q.id];
    if (selectedIdx !== undefined && q.options[selectedIdx].isCorrect) {
      return score + 1;
    }
    return score;
  }, 0);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const presentationData: PresentationExportOptions = useMemo(() => {
    if (selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY) {
      return {
        title: 'Frog Anatomy & Surgical Dissection',
        subtitle: 'Ranidae Morphological Systems & Visceral Architecture',
        category: 'anatomy',
        concept: 'Amphibian Biological Organization',
        slides: [
          {
            title: 'Amphibian Morphology & Neck Dissection',
            subtitle: 'Specimen Preparation & Cranial Orientation',
            bullets: [
              'Ranidae (true frogs) possess specialized aquatic and terrestrial anatomical adaptations.',
              'Cervical vertebrae pivot (90° rotation) facilitates clean surgical incision along the ventral coelom.',
              'Ventral skin flap reflection exposes the pericardial cavity and anterior visceral organs without vascular damage.',
            ],
            callout: 'Surgical Protocol: Rotate cervical neck portion to unlock organ inspection mode.',
          },
          {
            title: 'Frog Visceral Organ Manifest',
            subtitle: '6 Primary Visceral Organs',
            details: [
              { label: 'Three-Chambered Heart', text: 'Dual atria, single common ventricle with trabecular grooves minimizing blood mixing' },
              { label: 'Paired Sacculated Lungs', text: 'Thin-walled pulmonary sacs ventilated via positive-pressure buccopharyngeal pumping' },
              { label: 'Trilobed Liver & Gall Bladder', text: 'Largest coelomic organ producing bile for lipid emulsification in the duodenum' },
              { label: 'Gastric Curvature (Stomach)', text: 'Muscular J-shaped sac secreting hydrochloric acid and pepsinogen' },
              { label: 'Mesonephric Kidneys', text: 'Paired elongated retroperitoneal filters regulating osmotic water and nitrogenous wastes' },
              { label: 'Intestinal Tract & Cloaca', text: 'Duodenum, ileum, and terminal cloacal chamber receiving digestive, urinary, and genital ducts' },
            ],
          },
          {
            title: 'Comparative Physiology: Frog vs Human',
            table: {
              headers: ['Organ System', 'Frog (Amphibian)', 'Human (Mammalian)'],
              rows: [
                ['Heart Circulation', '3 chambers (2 atria, 1 ventricle)', '4 chambers (complete ventricular septum)'],
                ['Respiration', 'Positive buccal pump + cutaneous skin diffusion', 'Negative thoracic pressure via diaphragm & ribs'],
                ['Terminal Excretion', 'Cloaca (common single aperture)', 'Separate digestive (anus) & urogenital orifices'],
                ['Body Temperature', 'Poikilothermic (ectothermic)', 'Homeothermic (endothermic, 37.0 °C)'],
              ],
            },
          },
        ],
      };
    } else {
      return {
        title: 'Human Anatomy & Internal Systems',
        subtitle: 'Homo sapiens Musculoskeletal & Visceral Anatomy',
        category: 'anatomy',
        concept: 'Mammalian Human Anatomy',
        slides: [
          {
            title: 'Human Musculoskeletal & External Anatomy',
            subtitle: 'Bipedal Bilateral Symmetry',
            bullets: [
              'External body features coordinated axial and appendicular skeletal frameworks with voluntary muscle groups.',
              'Anterior abdominal midline incision follows the linea alba from the epigastrium to the suprapubic boundary.',
              'Simulated dissection demonstrates reflection of the abdominal wall to access the peritoneal coelom and visceral organs.',
            ],
            callout: 'Educational Protocol: Follow the abdominal demonstration guide to unlock the internal visceral cavity.',
          },
          {
            title: 'Key Human Internal Systems',
            subtitle: 'Vital Internal Visceral Organs',
            details: [
              { label: 'Central Nervous System (Brain)', text: 'Bilateral cerebral hemispheres and cerebellum orchestrating cognitive and autonomic homeostasis' },
              { label: 'Cardiovascular Core (Heart)', text: 'Four-chambered muscular pump maintaining strict systemic vs pulmonary dual circulation' },
              { label: 'Respiratory Lungs & Trachea', text: 'Spongy paired organs with ~300 million alveoli driven by negative thoracic diaphragm movement' },
              { label: 'Metabolic Hepatic Center (Liver)', text: 'Dual-lobed chemical factory performing gluconeogenesis, plasma protein synthesis, and detoxification' },
              { label: 'Renal Nephron Filtration (Kidneys)', text: 'Paired retroperitoneal organs filtering 180 liters of plasma daily to excrete urea' },
            ],
          },
          {
            title: 'Human Physiological Taxonomy',
            table: {
              headers: ['Parameter', 'Physiological Norm', 'Clinical Significance'],
              rows: [
                ['Cardiac Output', '4.5 - 5.5 L/min at rest', 'Maintains adequate systemic tissue perfusion pressure'],
                ['Resting Heart Rate', '60 - 100 BPM', 'Regulated dynamically by sinoatrial node and vagal nerve tone'],
                ['Tidal Volume', '500 mL per quiet breath', 'Sufficient alveolar dead-space ventilation'],
                ['Body Temperature', '36.5 - 37.5 °C', 'Optimum temperature for human enzymatic catalysts'],
              ],
            },
          },
        ],
      };
    }
  }, [selectedSpecimen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header Banner */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Specimen Switcher Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                Tech-Anatomix Virtual Anatomy Lab
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-emerald-700 font-semibold">Dissect Your Cell! • Surgical Anatomy & Viscera</span>
            </div>

            {/* Specimen Switcher Ribbon */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setSelectedSpecimen('frog')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSpecimen === 'frog'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🐸 Frog (Ranidae)</span>
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-black/15">
                  Rotate Neck Dissection
                </span>
              </button>

              {ENABLE_HUMAN_ANATOMY && (
                <button
                  onClick={() => setSelectedSpecimen('human')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSpecimen === 'human'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👤 Human Body (Homo sapiens)</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-black/15">
                    Abdominal Dissection
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY
                  ? 'Frog Anatomy Explorer (Mouse-Operated Neck Dissection & Viscera)'
                  : 'Human Anatomy Explorer (External Body & Internal Organs)'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1 leading-relaxed">
                {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY
                  ? 'Rotate the cervical neck portion of the frog with your mouse to perform the surgical incision, then inspect the 3-chambered heart, sacculated lungs, and coelomic viscera.'
                  : 'Inspect external human musculoskeletal anatomy in 3D, simulate the virtual dissection along the abdominal midline guide to unlock internal viscera, and explore the interactive 3D Human Internal Organs model (by unlim3d).'}
              </p>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/80 text-center">
                <span className="block text-base font-bold text-slate-900">
                  {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY ? 'Ranidae 3D' : 'Homo sapiens'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY ? 'Amphibian Model' : 'Mammalian Model'}
                </span>
              </div>
              <div className="bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 text-center">
                <span className="block text-base font-bold text-rose-800">
                  {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY ? 'Heart & Lungs' : '7 Major Systems'}
                </span>
                <span className="text-[10px] font-medium text-rose-600 uppercase tracking-wider">
                  Internal Viscera
                </span>
              </div>
              <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-center">
                <span className="block text-base font-bold text-emerald-800">
                  {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY ? 'Rotate Neck' : 'Abdominal Guide'}
                </span>
                <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                  Interactive Dissection
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs & Export Presentation Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('3d-model')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === '3d-model'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>3D Anatomy Explorer</span>
              </button>
              <button
                onClick={() => setActiveTab('systems')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'systems'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Organ Systems Dossier</span>
              </button>
              <button
                onClick={() => setActiveTab('comparative')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'comparative'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {ENABLE_HUMAN_ANATOMY
                    ? 'Comparative Anatomy (Frog vs Human)'
                    : 'Amphibian Anatomical & Evolutionary Context'}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Anatomy Knowledge Check ({activeQuizQuestions.length} Questions)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: 3D ANATOMY EXPLORER */}
        {activeTab === '3d-model' && (
          <div className="space-y-6">
            {selectedSpecimen === 'human' && !ENABLE_HUMAN_ANATOMY && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span>The Human Anatomy Explorer is temporarily offline for scheduled upgrades. Displaying the Frog Anatomy Explorer.</span>
                <button
                  onClick={() => setSelectedSpecimen('frog')}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Switch to Frog Explorer
                </button>
              </div>
            )}
            {/* Dedicated AI Learning Workspace (Left: AI Chat Assistant ~50%, Right: 3D Specimen Viewer ~50%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              {/* LEFT: AI CHAT ASSISTANT (Desktop Left 50%, Mobile Bottom) */}
              <div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-5 flex flex-col w-full">
                <ExternalModelAiChat
                  context={{
                    modelId: selectedSpecimen === 'frog' ? 'frog-anatomy' : 'human-anatomy',
                    title: selectedSpecimen === 'frog' ? 'Frog Anatomy Explorer (Ranidae Specimen)' : 'Human Anatomy Explorer (Homo sapiens)',
                    subject: 'Comparative Anatomy & Virtual Dissection',
                    concept: selectedSpecimen === 'frog'
                      ? 'Amphibian Organ Systems, 3-Chambered Heart Hemodynamics & Cutaneous Respiration'
                      : 'Human Thoracic, Abdominal, Cardiorespiratory & Organ Topography',
                    description: selectedSpecimen === 'frog'
                      ? 'Interactive biological dissection specimen detailing frog internal viscera, cardiovascular loops, and anatomy.'
                      : 'High-fidelity human anatomical model exploring thoracic viscera, abdominal organs, and systemic physiology.',
                    parts: selectedSpecimen === 'frog'
                      ? FROG_ORGAN_LIST.map((organ) => ({
                          id: organ.id,
                          name: organ.name,
                          description: organ.function,
                        }))
                      : HUMAN_ORGAN_LIST.map((organ) => ({
                          id: organ.id,
                          name: organ.name,
                          description: organ.function,
                        })),
                  }}
                  heightClass="h-[540px] sm:h-[600px] lg:h-[700px]"
                />
              </div>

              {/* RIGHT: 3D ANATOMY EXPLORER (Desktop Right 50%, Mobile Top) */}
              <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-7 flex flex-col w-full">
                {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY ? (
                  <FrogAnatomyExplorer />
                ) : (
                  <HumanAnatomyExplorer />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORGAN SYSTEMS DOSSIER */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY
                    ? 'Frog Organ Systems Dossier (Ranidae Specimen)'
                    : 'Human Organ Systems Dossier (Homo sapiens Specimen)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed anatomical location, physiological role, and comparative functional notes.
                </p>
              </div>

              {ENABLE_HUMAN_ANATOMY && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setSelectedSpecimen('frog')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedSpecimen === 'frog'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Frog Organs (6)
                  </button>
                  <button
                    onClick={() => setSelectedSpecimen('human')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedSpecimen === 'human'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Human Organs (7)
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedSpecimen === 'frog' || !ENABLE_HUMAN_ANATOMY
                ? FROG_ORGAN_LIST.map((organ) => (
                    <div
                      key={organ.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: organ.color }}
                            />
                            <div>
                              <h3 className="text-base font-bold text-slate-900">{organ.name}</h3>
                              <span className="text-xs text-slate-500 italic">{organ.scientificName}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {organ.system}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Physiological Function
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {organ.function}
                            </p>
                          </div>

                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Anatomical Description & Position
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {organ.educationalDescription}
                            </p>
                          </div>

                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Dissection Landmark
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {organ.location} — {organ.simplificationNotice}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono text-[11px]">ID: {organ.id}</span>
                        <button
                          onClick={() => setActiveTab('3d-model')}
                          className="text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View in 3D</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                : HUMAN_ORGAN_LIST.map((organ) => (
                    <div
                      key={organ.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: organ.color }}
                            />
                            <div>
                              <h3 className="text-base font-bold text-slate-900">{organ.name}</h3>
                              <span className="text-xs text-slate-500 italic">{organ.scientificName}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                            {organ.system}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Physiological Function
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {organ.function}
                            </p>
                          </div>

                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Anatomical Location
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {organ.location}
                            </p>
                          </div>

                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Clinical Significance
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {organ.clinicalSignificance}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono text-[11px]">ID: {organ.id}</span>
                        <button
                          onClick={() => setActiveTab('3d-model')}
                          className="text-rose-700 font-semibold hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View in 3D</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {/* TAB 3: COMPARATIVE ANATOMY */}
        {activeTab === 'comparative' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Amphibian (Frog) vs. Mammalian (Human) Comparative Anatomy
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Understanding key evolutionary divergences and adaptations between amphibians and mammals.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                      <th className="py-3 px-4">System / Organ</th>
                      <th className="py-3 px-4">Frog (Amphibia)</th>
                      <th className="py-3 px-4">Human (Mammalia)</th>
                      <th className="py-3 px-4">Physiological Significance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-900">Heart & Circulation</td>
                      <td className="py-3.5 px-4">3 chambers: 2 atria, 1 common ventricle. Truncus arteriosus spiral valve.</td>
                      <td className="py-3.5 px-4">4 chambers: 2 atria, 2 separate ventricles with complete septum.</td>
                      <td className="py-3.5 px-4">Frogs tolerate partial oxygenated/deoxygenated ventricular blood mixing because of cutaneous oxygenation.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-900">Respiration</td>
                      <td className="py-3.5 px-4">Simple paired sacculated lungs + cutaneous skin respiration; buccal positive pumping.</td>
                      <td className="py-3.5 px-4">Complex branched bronchi with millions of alveoli; thoracic negative-pressure diaphragm pumping.</td>
                      <td className="py-3.5 px-4">Frogs lack a muscular diaphragm and ribs; gas exchange occurs across both skin and lungs.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-900">Liver</td>
                      <td className="py-3.5 px-4">3 distinct lobes (left anterior, left posterior, right) with prominent median gallbladder.</td>
                      <td className="py-3.5 px-4">4 lobes (right, left, quadrate, caudate) with inferior gallbladder fossa.</td>
                      <td className="py-3.5 px-4">Both synthesize bile and process metabolic glycogen, but spatial placement adapts to amphibian torso flatness.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-900">Digestive Exits</td>
                      <td className="py-3.5 px-4">Single terminal chamber: Cloaca (digestive, urinary, and reproductive shared exit).</td>
                      <td className="py-3.5 px-4">Separated anatomical orifices (anus for feces, urethra/vagina for urogenital systems).</td>
                      <td className="py-3.5 px-4">Cloaca simplifies lower abdominal morphology in amphibians, reptiles, and birds.</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-900">Skeletal Body Wall</td>
                      <td className="py-3.5 px-4">No rib cage; rigid urostyle and broad pelvic girdle adapted for jumping (saltatory locomotion).</td>
                      <td className="py-3.5 px-4">12 pairs of ribs forming a protective thoracic cage for heart and lungs.</td>
                      <td className="py-3.5 px-4">Absence of ribcage allows direct ventral access to coelomic viscera during dissection.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setActiveTab('3d-model')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Explore in 3D Specimen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KNOWLEDGE CHECK QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Frog Anatomy Interactive Knowledge Assessment
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test your understanding of the six internal organs and comparative physiology.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {showQuizResults ? (
                    <button
                      onClick={handleResetQuiz}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowQuizResults(true)}
                      disabled={Object.keys(selectedQuizAnswers).length === 0}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                    >
                      Submit Answers ({Object.keys(selectedQuizAnswers).length}/{activeQuizQuestions.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Score Banner when results shown */}
              {showQuizResults && (
                <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-300">Assessment Result</span>
                    <h3 className="text-xl font-bold">
                      You scored {quizScore} out of {activeQuizQuestions.length} ({Math.round((quizScore / activeQuizQuestions.length) * 100)}%)
                    </h3>
                  </div>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    {quizScore === activeQuizQuestions.length ? 'Mastery Achieved 🎉' : 'Keep Practicing'}
                  </span>
                </div>
              )}

              {/* Question list */}
              <div className="space-y-6">
                {activeQuizQuestions.map((question, qIdx) => {
                  const selectedOptionIdx = selectedQuizAnswers[question.id];
                  return (
                    <div
                      key={question.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {question.question}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-9">
                        {question.options.map((opt, oIdx) => {
                          const isSelected = selectedOptionIdx === oIdx;
                          let optionClasses = 'p-3 rounded-lg border text-xs font-medium transition-all text-left cursor-pointer ';

                          if (showQuizResults) {
                            if (opt.isCorrect) {
                              optionClasses += 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
                            } else if (isSelected && !opt.isCorrect) {
                              optionClasses += 'bg-rose-50 border-rose-400 text-rose-950 font-bold';
                            } else {
                              optionClasses += 'bg-white border-slate-200 text-slate-500 opacity-60';
                            }
                          } else {
                            if (isSelected) {
                              optionClasses += 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs';
                            } else {
                              optionClasses += 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => !showQuizResults && handleSelectQuizOption(question.id, oIdx)}
                              disabled={showQuizResults}
                              className={optionClasses}
                            >
                              <div className="flex items-center justify-between">
                                <span>{opt.label}</span>
                                {showQuizResults && opt.isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                                )}
                                {showQuizResults && isSelected && !opt.isCorrect && (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {showQuizResults && (
                        <div className="mt-3 pl-9 pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-900 block mb-0.5">Scientific Explanation:</span>
                          {question.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Presentation Export Modal for Anatomy Specimen */}
      <PresentationExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={presentationData}
        defaultFilename={selectedSpecimen === 'frog' ? 'Frog_Anatomy_Dissection' : 'Human_Anatomy_Dissection'}
      />
    </div>
  );
};
