import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../simulations/orbitControls';
import { PageRoute } from '../components/layout/Navbar';
import {
  learnThroughPlayManager,
  LearnThroughPlayState,
} from '../utils/learnThroughPlayEngine';
import {
  ArrowRight,
  FlaskConical,
  Dna,
  Zap,
  ShieldCheck,
  Sparkles,
  Activity,
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  Award,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: PageRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playState, setPlayState] = useState<LearnThroughPlayState>(() =>
    learnThroughPlayManager.getState()
  );

  // Interactive 3D Hero Atom Play Controls (Immediate SEE -> TRY -> OBSERVE -> DISCOVER on Home)
  const [orbitalEnergyLevel, setOrbitalEnergyLevel] = useState<number>(1.5);
  const [excitedShellState, setExcitedShellState] = useState<boolean>(false);
  const [atomDiscoveryUnlocked, setAtomDiscoveryUnlocked] = useState<boolean>(false);

  const orbitalEnergyRef = useRef<number>(1.5);
  orbitalEnergyRef.current = orbitalEnergyLevel;
  const excitedShellRef = useRef<boolean>(false);
  excitedShellRef.current = excitedShellState;

  useEffect(() => {
    return learnThroughPlayManager.subscribe(setPlayState);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement, {
      minDistance: 3,
      maxDistance: 15,
    });
    controls.target.set(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Interactive 3D Quantum Atom Nucleus + Orbital Shells
    const atomGroup = new THREE.Group();
    scene.add(atomGroup);

    // Central Nucleus (Protons & Neutrons bundle)
    const nucleusGroup = new THREE.Group();
    const protonMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const neutronMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
    const sphereGeo = new THREE.SphereGeometry(0.2, 16, 16);

    for (let i = 0; i < 14; i++) {
      const isProton = i % 2 === 0;
      const mesh = new THREE.Mesh(sphereGeo, isProton ? protonMat : neutronMat);
      const angle = (i / 14) * Math.PI * 2;
      const rad = 0.3 + Math.random() * 0.15;
      mesh.position.set(
        rad * Math.sin(angle) * Math.cos(i),
        rad * Math.cos(angle),
        rad * Math.sin(angle) * Math.sin(i)
      );
      nucleusGroup.add(mesh);
    }
    atomGroup.add(nucleusGroup);

    // 3 Orbital Elliptical Rings with Electron Particles
    const ringPlanes = [
      { rx: Math.PI / 4, ry: 0, rz: 0, color: 0x0284c7 },
      { rx: -Math.PI / 4, ry: Math.PI / 3, rz: 0, color: 0x10b981 },
      { rx: 0, ry: -Math.PI / 4, rz: Math.PI / 3, color: 0xf59e0b },
    ];

    const electronMeshes: THREE.Mesh[] = [];
    const ringGroups: THREE.Group[] = [];
    const electronGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const electronMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
    });

    ringPlanes.forEach((rp) => {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.set(rp.rx, rp.ry, rp.rz);

      const curve = new THREE.EllipseCurve(0, 0, 2.2, 1.4, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, p.y, 0))
      );
      const material = new THREE.LineBasicMaterial({ color: rp.color, transparent: true, opacity: 0.65 });
      const ellipse = new THREE.Line(geometry, material);
      ringGroup.add(ellipse);

      const electron = new THREE.Mesh(electronGeo, electronMat);
      ringGroup.add(electron);
      electronMeshes.push(electron);
      ringGroups.push(ringGroup);

      atomGroup.add(ringGroup);
    });

    let lastTime = performance.now();
    let animId: number;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      const energyMult = orbitalEnergyRef.current;
      const isExcited = excitedShellRef.current;
      const targetScale = isExcited ? 1.24 : 1.0;

      if (!controls.isPointerDown) {
        atomGroup.rotation.y += delta * 0.22 * energyMult;
        atomGroup.rotation.x += delta * 0.09 * energyMult;
      }

      ringGroups.forEach((rg) => {
        rg.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      });

      // Animate electrons along orbital paths
      electronMeshes.forEach((el, idx) => {
        const speed = (1.1 + idx * 0.35) * energyMult;
        const t = (currentTime / 1000) * speed;
        el.position.x = 2.2 * Math.cos(t);
        el.position.y = 1.4 * Math.sin(t);
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      sphereGeo.dispose();
      electronGeo.dispose();
      protonMat.dispose();
      neutronMat.dispose();
      electronMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleHeroAtomExperiment = (newEnergy: number, nextExcited: boolean) => {
    setOrbitalEnergyLevel(newEnergy);
    setExcitedShellState(nextExcited);
    if (!atomDiscoveryUnlocked) {
      setAtomDiscoveryUnlocked(true);
      learnThroughPlayManager.recordDiscovery({
        id: 'home-quantum-atom-excitation',
        domain: 'physics',
        title: 'Atomic Orbital Energy & Excitation',
        symbol: '⚛️',
        scientificPrinciple:
          'Adding energy to an atom accelerates electron motion and promotes electrons to higher-radius excited shells (ΔE = hf).',
        formulaOrRule: 'ΔE = E_n2 - E_n1 = h·f',
        accuracyPct: 100,
      });
    }
  };

  const discoveryCount = Object.keys(playState.discoveries).length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Universal Non-Reader Accessibility & Discovery Progress Ribbon */}
      <div
        data-testid="universal-accessibility-ribbon"
        className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-2.5"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <span>🌍 Learn Through Play:</span>
            </span>
            <span className="text-slate-300">
              👁️ SEE ➔ ✋ TRY ➔ 🔍 OBSERVE ➔ 💡 DISCOVER ➔ 🎯 APPLY ➔ 🏆 MASTER
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span
              data-testid="global-discovery-counter"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700 font-mono font-semibold"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{discoveryCount} Scientific Discoveries Unlocked</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !playState.autoSpeakEnabled;
                learnThroughPlayManager.setAutoSpeakEnabled(next);
                if (next) {
                  learnThroughPlayManager.speakInstruction(
                    'welcome-voice-guide',
                    'Voice Guide Enabled. Tap any visual card or experiment control to hear spoken instructions and scientific discoveries aloud.',
                    true
                  );
                }
              }}
              data-testid="toggle-auto-speak-button"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer border ${
                playState.autoSpeakEnabled
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Toggle automatic voice narration for non-readers and auditory learners"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{playState.autoSpeakEnabled ? '🔊 Voice Guide: ON' : '🔊 Voice Guide: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                learnThroughPlayManager.speakInstruction(
                  'home-intro-narration',
                  'Welcome to Tech-Anatomix! Play with the live 3D atom on the right, or tap Physics, Chemistry, Biology, or Anatomy below to run real 3D science experiments.',
                  true
                )
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors cursor-pointer"
              title="Listen to page guide"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speak Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-10 pb-14 md:pt-16 md:pb-20 border-b border-slate-200 bg-linear-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                <span>🔬 Interactive 3D Virtual Science &amp; Discovery World</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
                  Tech-Anatomix
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
                  Dissect Your Cell! · Learn Science Through Play
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Experiment directly with living 3D models, chemical reactions, and anatomical specimens. Watch visual demonstrations, change real physical variables, and discover why scientific phenomena happen—with full voice and visual guidance for every learner.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('physics')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <span>⚡ Explore Physics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('chemistry')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                >
                  <span>🧪 Virtual Chemistry Lab</span>
                </button>
                <button
                  onClick={() => onNavigate('anatomy')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>🐸 3D Dissection</span>
                </button>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Deterministic Math Engines</span>
                </div>
                <span>·</span>
                <div>Visual + Audio Non-Reader Accessible</div>
                <span>·</span>
                <div>122+ Interactive 3D Models</div>
              </div>
            </div>

            {/* Right Column: Live Interactive 3D Model Hero Viewport + Instant SEE/TRY/DISCOVER Mini-Experiment */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="absolute top-4 left-4 z-10 bg-white/95 px-3 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs flex items-center gap-2">
                  <span>⚛️ Live 3D Carbon-14 Atom · Drag to Rotate</span>
                  {excitedShellState && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px]">
                      Excited State (n=3)
                    </span>
                  )}
                </div>
                <div ref={mountRef} className="w-full h-[340px] sm:h-[380px] rounded-xl overflow-hidden" />
              </div>

              {/* Instant Visual Play Deck under Hero Atom (Works for Non-Readers & Readers alike) */}
              <div
                data-testid="hero-mini-experiment-deck"
                className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚛️</span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                        ✋ Try Instant Experiment · Quantum Energy Excitation
                      </span>
                      <span className="text-xs text-slate-300">
                        Slide energy or tap <strong className="text-white">⚡ Excite Shells</strong> to see electrons jump!
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleHeroAtomExperiment(2.8, !excitedShellState);
                        learnThroughPlayManager.speakInstruction(
                          'hero-atom-demo',
                          'Energy added! Watch the electrons speed up and expand into a wider excited orbital shell.',
                          true
                        );
                      }}
                      data-testid="hero-excite-atom-button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        excitedShellState
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{excitedShellState ? '⚡ Excited Shell (Reset)' : '⚡ Excite Electron Shells'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        learnThroughPlayManager.speakInstruction(
                          'hero-atom-explain',
                          'An atom has protons and neutrons in its center nucleus, and fast electrons orbiting around it. Adding energy makes electrons move faster and jump to outer shells!',
                          true
                        )
                      }
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
                      title="Listen to explanation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                  <div className="sm:col-span-7 flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300 shrink-0">⚡ Speed:</span>
                    <input
                      type="range"
                      min="0.4"
                      max="3.5"
                      step="0.1"
                      value={orbitalEnergyLevel}
                      onChange={(e) =>
                        handleHeroAtomExperiment(parseFloat(e.target.value), excitedShellState)
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold tabular-nums text-emerald-400 w-12 text-right">
                      {orbitalEnergyLevel.toFixed(1)}×
                    </span>
                  </div>

                  <div className="sm:col-span-5 text-right">
                    {atomDiscoveryUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>💡 Discovery: ΔE = hf Orbital Jump!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        ✋ Move slider to unlock discovery
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Subject Workstations Section with Visual-First Play Previews */}
      <section className="py-16 md:py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Interactive Scientific Laboratories. Play, Experiment &amp; Discover.
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every workstation is powered by genuine WebGL 3D renderers, visual demonstrations, and spoken audio guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Physics Card */}
            <div
              onClick={() => onNavigate('physics')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      learnThroughPlayManager.speakInstruction(
                        'card-physics',
                        'Physics Lab. Launch projectiles at 45 degrees for maximum distance, swing pendulums, and build live electric circuits.',
                        true
                      );
                    }}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-700 border border-slate-200"
                    title="Speak Physics Lab overview"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  ⚡ Physics Lab
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Real-time projectile kinematics with aerodynamic drag, non-linear simple pendulums, and direct current circuits obeying Ohm&apos;s Law.
                </p>

                <div className="mt-4 p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-[11px] text-sky-950 font-semibold space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-sky-700 font-bold">
                    🎯 Playable Challenges Inside:
                  </div>
                  <div>🚀 45° Optimal Projectile Launch</div>
                  <div>⏱️ Pendulum Length vs. Period T</div>
                  <div>💡 Ohm&apos;s Law Circuit Brightness</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-sky-600">
                <span>Launch Physics Lab</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Chemistry Card */}
            <div
              onClick={() => onNavigate('chemistry')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      learnThroughPlayManager.speakInstruction(
                        'card-chemistry',
                        'Chemistry Lab. Pour acids, bases, and salts into the 3D beaker to trigger real color changes, golden precipitates, and fizzing gas bubbles.',
                        true
                      );
                    }}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border border-slate-200"
                    title="Speak Chemistry Lab overview"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  🧪 Chemistry Lab
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  3D virtual reaction bench with beakers, reagent pouring, dynamic color shifts, effervescent bubbling, precipitate clouds, and 3D molecules.
                </p>

                <div className="mt-4 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-950 font-semibold space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
                    🎯 Playable Challenges Inside:
                  </div>
                  <div>🟨 Golden Rain PbI₂↓ Precipitate</div>
                  <div>🫧 CO₂↑ Effervescent Gas Fizz</div>
                  <div>🌡️ Exothermic Acid–Base Heat</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-emerald-600">
                <span>Enter Chemistry Lab</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Biology Card */}
            <div
              onClick={() => onNavigate('biology')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Dna className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      learnThroughPlayManager.speakInstruction(
                        'card-biology',
                        'Biology Lab. Explore inside a 3D living cell, pump blood through a 4-chambered heart, and match A-T and G-C base pairs on a DNA double helix.',
                        true
                      );
                    }}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200"
                    title="Speak Biology Lab overview"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  🧬 Biology Lab
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Interactive cutaway 3D cell explorer with selectable organelles, anatomical 4-chambered heart with blood flow, and Watson-Crick DNA helix.
                </p>

                <div className="mt-4 p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-950 font-semibold space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-rose-700 font-bold">
                    🎯 Playable Challenges Inside:
                  </div>
                  <div>🔋 Find the ATP Cell Powerhouse</div>
                  <div>🫀 Control Heart BPM &amp; Valves</div>
                  <div>🧬 Match A=T &amp; G≡C Base Pairs</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-rose-600">
                <span>Explore Biology Lab</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Anatomy Card */}
            <div
              onClick={() => onNavigate('anatomy')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      learnThroughPlayManager.speakInstruction(
                        'card-anatomy',
                        'Frog and Human Anatomy Lab. Perform guided 3D dissections with your mouse and compare amphibian 3-chambered hearts with human 4-chambered hearts.',
                        true
                      );
                    }}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200"
                    title="Speak Anatomy Lab overview"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  🔬 Frog &amp; Human Anatomy
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Interactive 3D surgical dissection suite. Rotate frog cervical neck or follow human midline guide to inspect internal organs.
                </p>

                <div className="mt-4 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-950 font-semibold space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-teal-700 font-bold">
                    🎯 Playable Challenges Inside:
                  </div>
                  <div>✂️ Guided 3D Neck &amp; Midline Dissection</div>
                  <div>🐸 3-Chambered vs ❤️ 4-Chambered Heart</div>
                  <div>🫁 Buccal Pump vs Diaphragm Breathing</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-teal-600">
                <span>Explore Anatomy Lab</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create a 3D Model with AI Callout Banner */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50/50 via-white to-sky-50/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-100/80 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Model Generator
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">Structured Science Pipeline</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Want to visualize something else? Create a 3D model with AI.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Describe any scientific concept in natural language — from a simple electric motor or lever to the human respiratory system or magnetic dipole lines. Tech-Anatomix builds a fully interactive 3D model with parts, labels, adjustable parameters, and a Learn-Through-Play discovery loop.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                <span className="text-slate-400 font-medium">Try:</span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">“Simple electric motor”</span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">“Class 1 lever”</span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">“Human respiratory system”</span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">“Magnetic field lines”</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ai-generator')}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs shrink-0 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Create 3D Model with AI →</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

