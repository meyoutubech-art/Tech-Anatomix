import React, { useState, useRef, useEffect } from 'react';
import { ScientificModelSpec } from '../types/aiModel';
import { CURATED_AI_MODELS } from '../data/curatedAiModels';
import { Dynamic3DModelRenderer } from '../components/models/Dynamic3DModelRenderer';
import { Sparkles, Send, Lightbulb, Compass, RotateCcw, Info, X, CheckCircle2, WifiOff } from 'lucide-react';
import { classifyAiError } from '../utils/aiErrorClassifier';
import { matchOfflinePreset } from '../utils/offlineModelManager';

export const AiModelGeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [activeModel, setActiveModel] = useState<ScientificModelSpec>(CURATED_AI_MODELS.motor);
  const [fallbackNotification, setFallbackNotification] = useState<string | null>(null);
  const [aiEngineStatus, setAiEngineStatus] = useState<{
    hasApiKey: boolean;
    primaryModel?: string;
    checked: boolean;
  }>({ hasApiKey: true, checked: false });

  // Concurrency guard & request isolation tracking
  const activeRequestRef = useRef<boolean>(false);
  const currentRequestIdRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Fetch real-time AI status on mount
  useEffect(() => {
    fetch('/api/ai/health')
      .then((r) => r.json())
      .then((d) => {
        setAiEngineStatus({
          hasApiKey: Boolean(d.hasApiKey),
          primaryModel: d.primaryModel,
          checked: true,
        });
      })
      .catch(() => {
        setAiEngineStatus({ hasApiKey: true, checked: true });
      });

    // Check URL parameters for direct model lookup
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const requestedModel = searchParams.get('model') || searchParams.get('id');
      if (requestedModel) {
        fallbackMatch(requestedModel);
      }
    } catch {}
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stepTimerRef.current.forEach((t) => clearTimeout(t));
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Dynamic parameters & conditions state for active model
  const [parameters, setParameters] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(CURATED_AI_MODELS.motor.parameters).forEach((p) => {
      initial[p.id] = p.defaultValue;
    });
    return initial;
  });

  const [conditions, setConditions] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    Object.values(CURATED_AI_MODELS.motor.conditions).forEach((c) => {
      initial[c.id] = c.defaultValue;
    });
    return initial;
  });

  const [showLabels, setShowLabels] = useState(true);

  const promptSuggestions = [
    { label: '🪐 Solar System Explorer', query: 'Create a 3D model of the solar system' },
    { label: '🕰️ Simple Pendulum', query: 'Create a 3D model of a simple pendulum' },
    { label: '🎯 Projectile Motion', query: 'Create a 3D model of projectile motion' },
    { label: '📐 Inclined Plane & Friction', query: 'Create a 3D model of an inclined plane' },
    { label: '⚖️ Class 1 Lever', query: 'Create a 3D model of a lever' },
    { label: '🚜 Hydraulic Lift (Pascal)', query: 'Create a 3D model of a hydraulic lift' },
    { label: '⚪ Newton\'s Cradle', query: 'Create a 3D model of Newton\'s cradle' },
    { label: '🌈 Prism & Dispersion', query: 'Create a 3D model of a prism and dispersion' },
    { label: '⚡ DC Electric Circuit', query: 'Create a 3D model of a simple electric circuit' },
    { label: '🔭 Astronomical Telescope', query: 'Create a 3D model of an astronomical refracting telescope' },
    { label: '⚛️ Rutherford Gold Foil', query: 'Create a 3D model of Rutherford gold foil scattering experiment' },
  ];

  const batch2TestPrompts = [
    { label: '📦 11. Friction Explorer', query: 'Create a 3D model of a friction explorer' },
    { label: '〰️ 12. Wave Motion', query: 'Wave motion explorer with crests and troughs' },
    { label: '📢 13. Sound Waves', query: '3D model of sound waves in air' },
    { label: '🧲 14. Magnetic Field', query: 'Magnetic field explorer with bar magnet and straight wire' },
    { label: '⚙️ 15. DC Electric Motor', query: 'Create a DC electric motor with split-ring commutator' },
    { label: '⚛️ 16. Interactive Atom', query: 'Interactive atom model with electron shells' },
    { label: '🧪 17. Bonding Explorer', query: 'Ionic and covalent bonding explorer NaCl H2O CH4' },
    { label: '💧 18. Water Molecule', query: 'Water molecule explorer with bent geometry' },
    { label: '🫧 19. CO₂ Molecule', query: 'Carbon dioxide molecule explorer linear O=C=O' },
  ];

  const biologyBatch1Prompts = [
    { label: '❤️ 21. Heart Explorer', query: 'Create a 3D model of a human heart explorer with cutaway and blood flow' },
    { label: '🫁 22. Respiratory System', query: 'Human respiratory system with bronchial tree and alveoli gas exchange' },
    { label: '🥗 23. Digestive System', query: '3D model of human digestive system with food path and villi' },
    { label: '🧠 24. Brain Explorer', query: 'Human brain explorer with lobes, cross section and neuron synapse' },
    { label: '👁️ 25. Eye & Vision', query: 'Detailed human eye and vision model with light path and retina' },
  ];

  const biologyBatch2Prompts = [
    { label: '🌿 26. Plant Cell', query: 'Create an interactive 3D plant cell with cell wall, chloroplasts, and vacuole' },
    { label: '🔬 27. Animal Cell', query: 'Interactive animal cell with organelles and mitochondria cutaway' },
    { label: '🌱 28. Root & Transport', query: 'Plant root and transport explorer with xylem and phloem' },
    { label: '🫀 29. Blood Transport', query: 'Create a 3D model of blood transport and internal circulatory system with heart and vessels' },
    { label: '⚡ 30. Neuron & Synapse', query: 'Neuron and nerve signal explorer with action potential and synapse' },
  ];

  const physicsEngineeringBatch3Prompts = [
    { label: '⚡ 31. AC Generator', query: 'Create a 3D model of an AC electric generator with rotating armature, slip rings and carbon brushes' },
    { label: '🧲 33. Induction Explorer', query: 'Create a 3D model of electromagnetic induction with moving magnet, solenoid and galvanometer' },
    { label: '🔥 36. Heat Transfer', query: 'Create a 3D model of heat transfer explorer with conduction, convection and radiation' },
    { label: '🚗 37. 4-Stroke Engine', query: 'Create a 3D model of a four stroke internal combustion engine with piston, valves and spark plug' },
    { label: '🔔 38. Electric Bell', query: 'Create a 3D model of an electric bell mechanism with electromagnet, striker and contact breaker' },
    { label: '📐 40. Motor Effect', query: 'Create a 3D model of the motor effect with conductor on rails and Fleming left hand rule vectors' },
  ];

  const advancedPhysicsBatch1Prompts = [
    { label: '📡 1. EM Wave Propagation', query: 'Create a 3D model of electromagnetic wave propagation with perpendicular electric and magnetic fields' },
    { label: '☀️ 2. Plasma Physics', query: 'Create a 3D model of plasma physics with positive ions, free electrons, and electromagnetic fields' },
    { label: '⚛️ 3. Particle Accelerator', query: 'Create a 3D model of a particle accelerator beamline with electric acceleration and magnetic deflection' },
    { label: '🚄 4. Magnetic Levitation', query: 'Create a 3D model of a magnetic levitation mechanism with magnet arrangement, air gap, and forces' },
    { label: '🧊 5. Superconductivity & Meissner', query: 'Create a 3D model of superconductivity and the Meissner effect showing magnetic field expulsion below critical temperature' },
    { label: '🕳️ 6. Black Hole & Lensing', query: 'Create a 3D model of a black hole and gravitational lensing showing light bending and spacetime curvature' },
    { label: '🌊 7. Quantum Tunnelling', query: 'Create a 3D model of quantum tunnelling showing a potential barrier, incident wavefunction, decay inside barrier, and transmission' },
  ];

  const advancedPhysicsBatch2Prompts = [
    { label: '🧲 48. Faraday Induction', query: "Create a 3D model of Faraday's law of electromagnetic induction with bar magnet, copper solenoid, and Lenz's law" },
    { label: '⚙️ 49. Motor & Generator', query: 'Create a 3D model of an electric motor and generator energy conversion explorer with Lorentz torque and back-EMF' },
    { label: '🔌 50. AC Transformer', query: 'Create a 3D model of an AC voltage transformer with laminated core, primary and secondary windings, and mutual inductance' },
    { label: '🌈 51. Double-Slit Interference', query: 'Create a 3D model of wave interference and diffraction lab with double slit, coherent wavefronts, and fringe spacing' },
    { label: '🔬 52. Thin Film & Michelson', query: 'Create a 3D model of optical interference with thin film reflection and Michelson interferometer' },
    { label: '✈️ 53. Fluid & Aerodynamics', query: 'Create a 3D model of fluid dynamics and aerodynamics with Venturi tube, Bernoulli pressure, and airfoil lift' },
    { label: '☢️ 54. Nuclear Fusion & Fission', query: 'Create a 3D model of nuclear fusion and fission reactor physics with U-235 chain reaction and Tokamak plasma' },
  ];

  const advancedPhysicsBatch3Prompts = [
    { label: '✈️ 55. Doppler & Sonic Boom', query: 'Create a 3D model of the Doppler effect and sonic boom explorer with moving sound source, observer, wavefront compression, and Mach shock-wave cone' },
    { label: '🌍 56. Seismic Waves & Earth', query: 'Create a 3D model of seismic waves and earthquake wave propagation with Earth crust, mantle, liquid outer core S-wave shadow zone, and seismogram' },
    { label: '🧭 57. Gyroscope & Precession', query: 'Create a 3D model of a gyroscope, torque, and angular momentum laboratory with spinning rotor, Cardan gimbal, and horizontal precession' },
    { label: '〰️ 58. SHM Coupled Oscillators', query: 'Create a 3D model of simple harmonic motion and coupled oscillators with two spring-coupled masses, normal modes, and energy beat transfer' },
    { label: '🔥 59. Carnot Heat Engine', query: 'Create a 3D model of a thermodynamics Carnot cycle heat engine with hot and cold reservoirs, piston cylinder, flywheel, and P-V loop' },
    { label: '💡 60. Photoelectric Effect', query: 'Create a 3D model of the photoelectric effect and quantum energy explorer with monochromatic photons, metal cathode work function, and stopping potential' },
    { label: '🚀 61. Special Relativity', query: 'Create a 3D model of special relativity time dilation and length contraction lab with relativistic spacecraft, Einstein light clock, and Lorentz factor' },
  ];

  const advancedPhysicsBatch4Prompts = [
    { label: "⚡ 62. Maxwell's Equations", query: "Create a 3D model of Maxwell's equations and electromagnetic field explorer with configurable positive and negative charges, electric field lines, magnetic field around a conductor, and a coupled electromagnetic wave" },
    { label: '〰️ 63. AC RLC Resonance Lab', query: 'Create a 3D model of an AC circuits, RLC resonance and impedance laboratory with AC source, resistor, capacitor, inductor, phase graphs, and impedance calculations' },
    { label: '🔍 64. Lenses & Optics Lab', query: 'Create a 3D model of a lenses, optical instruments and image formation laboratory with convex and concave lenses, principal rays, real and virtual images, and microscope/telescope arrangements' },
    { label: '🩺 65. Doppler Ultrasound', query: 'Create a 3D model of a Doppler ultrasound and medical flow imaging explorer with ultrasound probe, tissue boundary, blood vessel, moving red blood cells, wave pulses, and Doppler spectrum' },
    { label: "🌍 66. Earth's Magnetosphere", query: "Create a 3D model of Earth's magnetic field and magnetosphere explorer with rotational axis, tilted magnetic dipole, 3D field lines, solar wind particles, magnetotail, and auroral regions" },
    { label: '🔬 67. Semiconductor p–n Diode', query: 'Create a 3D model of a semiconductor p-n junction, band gap and diode explorer with p-type and n-type regions, depletion zone, holes and electrons, energy band diagram, and I-V curve' },
    { label: '☢️ 68. Radioactive Decay Lab', query: 'Create a 3D model of a radioactive decay, half-life and alpha-beta-gamma radiation lab with decaying nuclei lattice, magnetic deflection field, paper/aluminum/lead absorber shields, and Geiger counter' },
  ];

  const chemistryBatch1Prompts = [
    { label: '⚛️ 69. Molecular Orbitals (MO)', query: 'Create a 3D Molecular Orbital Explorer showing Nucleus A, Nucleus B, separated atomic orbitals, bonding and antibonding σ and π molecular orbitals, nodal surfaces, and an MO energy-level diagram' },
    { label: '🔮 70. Atomic Orbital Probability', query: 'Create a 3D Atomic Orbital Probability Explorer supporting 1s, 2s, 2p (x,y,z), and 3d orbitals with probability threshold slider, cross-section slice, radial and angular nodal surfaces, and probability point cloud' },
    { label: '💎 71. Crystal Lattice (SC/BCC/FCC/HCP)', query: 'Create a 3D Advanced Crystal Lattice Explorer supporting SC, BCC, FCC, and HCP unit cells with atom-sharing labels, nearest-neighbour highlighting, reversible multi-cell expansion, space-filling packing view, and comparison mode' },
    { label: '🧭 72. Molecular Polarity Explorer', query: 'Create a 3D Molecular Polarity Explorer for H2O, CO2, NH3, CH4, and BF3 showing VSEPR bond angles, partial charges, individual bond dipole arrows, and the resultant molecular dipole vector' },
    { label: '🧲 73. Intermolecular Forces (IMF)', query: 'Create a 3D Intermolecular Forces Explorer comparing Hydrogen Bonding in H2O, Dipole-Dipole in HCl, and London Dispersion in Ar and I2 with separation distance slider, orientation slider, dashed attraction overlay, and thermal motion control' },
    { label: '🔋 74. Electrochemical Cell (Galvanic)', query: 'Create a 3D Electrochemical Cell Simulator for a Zinc-Copper galvanic cell with two half-cell beakers, zinc anode, copper cathode, KNO3 salt bridge, external wire with electron flow, voltmeter, and Nernst concentration controls' },
    { label: '⚡ 75. Electrolysis & Faraday Lab', query: 'Create a 3D Electrolysis Explorer with an electrolyte container, negative cathode, positive anode, DC power source, mobile cations and anions, gas bubble and metal plating product regions, and a Faraday Law Q=It and m=MIt/zF calculator' },
  ];

  const chemistryBatch2Prompts = [
    { label: '⏱️ 76. Chemical Kinetics Simulator', query: 'Create a 3D Chemical Kinetics Simulator with a bounded reaction vessel, reactant and product particles, collision flashes, concentration-time graph, and first-order and second-order rate calculations' },
    { label: '⚖️ 77. Chemical Equilibrium Explorer', query: 'Create a 3D Chemical Equilibrium Explorer showing a reversible reaction vessel with forward and reverse motion indicators, piston volume control, Q vs Kc comparison, and Le Chatelier disturbances' },
    { label: '📈 78. Reaction Energy Profile', query: 'Create a 3D Reaction Energy Profile Explorer with reactant region, product region, transition-state indicator, forward and reverse activation energy markers, reaction enthalpy marker, and animated molecular pathway' },
    { label: '⚡ 79. Catalysis Explorer', query: 'Create a 3D Catalysis Explorer showing a catalyst surface or homogeneous active site, approaching reactants, adsorbed/intermediate species, product release, and side-by-side uncatalysed vs catalysed energy profiles' },
    { label: '🧪 80. Acid–Base Titration Lab', query: 'Create a 3D Acid-Base Titration Laboratory with a burette containing titrant, receiving flask containing analyte, visible meniscus, stopcock valve, indicator colour transition, digital pH readout, and titration curve with equivalence marker' },
    { label: '💎 81. Solubility & Precipitation', query: 'Create a 3D Solubility and Precipitation Explorer with a transparent solution vessel, dissolved cations and anions, settled solid crystal precipitate, saturation indicator, and Qsp vs Ksp equilibrium display' },
    { label: '🛡️ 82. Buffer Solution Simulator', query: 'Create a 3D Buffer Solution Simulator showing a vessel with weak acid and conjugate base species, strong acid and base addition droppers, digital pH readout, composition bars, and buffer capacity comparison' },
  ];

  const handleGenerate = async (userQuery: string, forceFresh = false) => {
    const q = userQuery.trim();
    if (!q || isGenerating || activeRequestRef.current) return;

    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    currentRequestIdRef.current = reqId;
    activeRequestRef.current = true;
    setIsGenerating(true);
    setFallbackNotification(null);
    setGenerationStep('Analyzing scientific concept...');

    // Clear previous timers
    stepTimerRef.current.forEach((t) => clearTimeout(t));
    stepTimerRef.current = [];

    // Schedule progressive user-friendly status updates during generation/retries
    stepTimerRef.current.push(
      setTimeout(() => {
        setGenerationStep('AI model generation is temporarily busy. Retrying...');
      }, 2400)
    );
    stepTimerRef.current.push(
      setTimeout(() => {
        setGenerationStep('Synthesizing 3D parts, physical constraints, and materials...');
      }, 5500)
    );
    stepTimerRef.current.push(
      setTimeout(() => {
        setGenerationStep('Finalizing physical parameters and scientific accuracy...');
      }, 9000)
    );

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/ai/generate-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, forceFresh, requestId: reqId }),
        signal: controller.signal,
      });

      // Ignore out-of-order response if another request was triggered
      if (currentRequestIdRef.current !== reqId) return;

      if (!res.ok) {
        const errorMsg = classifyAiError(res.status);
        setFallbackNotification(errorMsg);
        return;
      }

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        setFallbackNotification('Invalid JSON response from server.');
        return;
      }

      if (data.requestId && data.requestId !== currentRequestIdRef.current) return;

      if (data.model && data.model.parts && data.model.parts.length > 0) {
        const spec: ScientificModelSpec = data.model;
        setActiveModel(spec);

        const newParams: Record<string, number> = {};
        Object.values(spec.parameters || {}).forEach((p) => {
          newParams[p.id] = p.defaultValue;
        });
        setParameters(newParams);

        const newConds: Record<string, any> = {};
        Object.values(spec.conditions || {}).forEach((c) => {
          newConds[c.id] = c.defaultValue;
        });
        setConditions(newConds);

        if (data.isFallback) {
          setFallbackNotification(
            data.fallbackReason ||
              data.note ||
              "Loaded verified interactive scientific model."
          );
        } else {
          setFallbackNotification(null);
        }
      } else {
        const errorMsg = data.error ? classifyAiError(data.error) : 'AI model generation could not be completed.';
        setFallbackNotification(errorMsg);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      // Network disconnect fallback
      const offlineMatch = matchOfflinePreset(q);
      if (offlineMatch.matched && offlineMatch.spec) {
        const spec = offlineMatch.spec;
        setActiveModel(spec);
        const newParams: Record<string, number> = {};
        Object.values(spec.parameters || {}).forEach((p) => {
          newParams[p.id] = p.defaultValue;
        });
        setParameters(newParams);
        const newConds: Record<string, any> = {};
        Object.values(spec.conditions || {}).forEach((c) => {
          newConds[c.id] = c.defaultValue;
        });
        setConditions(newConds);
        setFallbackNotification(
          `⚡ Offline Fallback: Loaded verified interactive model for "${offlineMatch.presetTitle || q}".`
        );
        return;
      }
      const errorMsg = classifyAiError(e);
      setFallbackNotification(errorMsg);
    } finally {
      if (currentRequestIdRef.current === reqId) {
        stepTimerRef.current.forEach((t) => clearTimeout(t));
        activeRequestRef.current = false;
        setIsGenerating(false);
        setGenerationStep('');
        setPrompt('');
      }
    }
  };

  const fallbackMatch = (q: string) => {
    let offlineMatch = matchOfflinePreset(q);
    
    // Explicitly exclude removed models from Create 3D Model page lookup
    if (
      offlineMatch.matched &&
      offlineMatch.spec &&
      (offlineMatch.spec.id === 'reflection-refraction' ||
        offlineMatch.spec.id === 'hydroelectric-power' ||
        offlineMatch.spec.id === 'blood-circulation-microscope' ||
        offlineMatch.spec.id === 'blood-microscope')
    ) {
      offlineMatch = { matched: false };
    }

    let spec = (offlineMatch.matched && offlineMatch.spec) ? offlineMatch.spec : CURATED_AI_MODELS.motor;

    if (!offlineMatch.matched) {
      const lower = q.toLowerCase();
      if (lower.includes('projectile') || lower.includes('parabola') || lower.includes('launch') || lower.includes('ballistic')) {
        spec = CURATED_AI_MODELS.projectile;
      } else if (lower.includes('inclined') || lower.includes('incline') || lower.includes('ramp') || lower.includes('slope')) {
        spec = CURATED_AI_MODELS.inclinedPlane;
      } else if (lower.includes('lever') || lower.includes('fulcrum') || lower.includes('seesaw')) {
        spec = CURATED_AI_MODELS.lever;
      } else if (lower.includes('hydraulic') || lower.includes('pascal') || lower.includes('piston')) {
        spec = CURATED_AI_MODELS.hydraulicLift;
      } else if (lower.includes('cradle') || lower.includes('momentum') || lower.includes('collision')) {
        spec = CURATED_AI_MODELS.newtonsCradle;
      } else if (lower.includes('prism') || lower.includes('dispersion') || lower.includes('rainbow') || lower.includes('spectrum')) {
        spec = CURATED_AI_MODELS.prismDispersion;
      } else if (lower.includes('circuit') || lower.includes('ohm') || lower.includes('resistor')) {
        spec = CURATED_AI_MODELS.circuit;
      } else if (lower.includes('pendulum') || lower.includes('bob')) {
        spec = CURATED_AI_MODELS.pendulum;
      } else if (lower.includes('solar') || lower.includes('planet') || lower.includes('orbit')) {
        spec = CURATED_AI_MODELS.solar;
      }
    }

    setActiveModel(spec);
    const newParams: Record<string, number> = {};
    Object.values(spec.parameters).forEach((p) => {
      newParams[p.id] = p.defaultValue;
    });
    setParameters(newParams);

    const newConds: Record<string, any> = {};
    Object.values(spec.conditions).forEach((c) => {
      newConds[c.id] = c.defaultValue;
    });
    setConditions(newConds);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">AI Model Studio</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Structured Science-Aware Generation Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Create a 3D Model with AI
          </h1>
        </div>

        {/* Live AI Engine Status Indicator */}
        <div className="flex items-center gap-2">
          {aiEngineStatus.checked && (
            aiEngineStatus.hasApiKey ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Live: {aiEngineStatus.primaryModel || 'Gemini'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Simulation Engine: 41 Verified Models</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Non-blocking fallback notification banner if AI generation was unavailable */}
      {fallbackNotification && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-2xs transition-all">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{fallbackNotification}</span>
          </div>
          <button
            onClick={() => setFallbackNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Generation Prompt Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate(prompt);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder='e.g., "Create a 3D model of a simple electric motor", "Create a model of a lever", "Show magnetic field lines", "Create a water molecule"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isGenerating ? 'Generating...' : 'Generate 3D Model'}</span>
          </button>
          {activeModel && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerate(activeModel.prompt || activeModel.concept || activeModel.title, true)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 border border-slate-200"
              title="Force fresh AI synthesis for active model"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Regenerate Fresh</span>
            </button>
          )}
        </form>

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 p-3 rounded-lg border border-sky-200 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{generationStep || 'Synthesizing 3D parts and physical parameters...'}</span>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-slate-600 pb-0.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-slate-400 shrink-0 font-medium">Core Models:</span>
            {promptSuggestions.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Temporary Test Prompts for Models 11–20 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-sky-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
              🧪 Models 11–20:
            </span>
            {batch2TestPrompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Biology Batch 1 Prompts for Models 21–25 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-rose-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
              🧬 Biology 21–25:
            </span>
            {biologyBatch1Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Biology Batch 2 Prompts for Models 26–30 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-emerald-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              🌿 Biology 26–30:
            </span>
            {biologyBatch2Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Physics & Engineering Batch 3 Prompts for Models 31–40 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-indigo-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 shrink-0">
              ⚡ Models 31–40:
            </span>
            {physicsEngineeringBatch3Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Advanced Physics Batch 1 Prompts for Models 1–7 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-violet-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-300 shrink-0">
              🌌 Adv. Physics 1–7:
            </span>
            {advancedPhysicsBatch1Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Advanced Physics Batch 2 Prompts for Models 48–54 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-amber-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              🔬 Physics Batch 2 (48–54):
            </span>
            {advancedPhysicsBatch2Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Advanced Physics Batch 3 Prompts for Models 55–61 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-teal-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-300 shrink-0">
              🚀 Physics Batch 3 (55–61):
            </span>
            {advancedPhysicsBatch3Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Advanced Physics Batch 4 Prompts for Models 62–68 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-rose-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
              ⚡ Physics Batch 4 (62–68):
            </span>
            {advancedPhysicsBatch4Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Chemistry Batch 1 Prompts for Models 69–75 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-cyan-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300 shrink-0">
              🧪 Chemistry Batch 1 (69–75):
            </span>
            {chemistryBatch1Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dedicated Chemistry Batch 2 Prompts for Models 76–82 */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-emerald-800 pb-0.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              ⚗️ Chemistry Batch 2 (76–82):
            </span>
            {chemistryBatch2Prompts.map((item) => (
              <button
                key={item.label}
                onClick={() => handleGenerate(item.query)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rendered 3D Model with Inspector and Parameters */}
      <Dynamic3DModelRenderer
        modelSpec={activeModel}
        parameters={parameters}
        conditions={conditions}
        onUpdateParameter={(id, val) => setParameters((prev) => ({ ...prev, [id]: val }))}
        onUpdateCondition={(id, val) => setConditions((prev) => ({ ...prev, [id]: val }))}
        onTryIt={() => {
          const el = document.getElementById('ai-model-parameters-deck');
          if (el) {
            el.classList.add('ring-2', 'ring-sky-500');
            setTimeout(() => el.classList.remove('ring-2', 'ring-sky-500'), 1500);
          }
        }}
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
      />
    </div>
  );
};

