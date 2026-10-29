import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SimpleOrbitControls } from '../simulations/orbitControls';
import { PageRoute } from '../components/layout/Navbar';
import {
  ArrowRight,
  FlaskConical,
  Dna,
  Zap,
  ShieldCheck,
  Sparkles,
  Activity,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: PageRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const mountRef = useRef<HTMLDivElement>(null);

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

      atomGroup.add(ringGroup);
    });

    let lastTime = performance.now();
    let animId: number;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      controls.update();

      if (!controls.isPointerDown) {
        atomGroup.rotation.y += delta * 0.3;
        atomGroup.rotation.x += delta * 0.12;
      }

      // Animate electrons along orbital paths
      electronMeshes.forEach((el, idx) => {
        const speed = 1.6 + idx * 0.5;
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-10 pb-14 md:pt-16 md:pb-20 border-b border-slate-200 bg-linear-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
                <span>Interactive 3D Virtual Science &amp; Anatomy Laboratory</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
                  Tech-Anatomix
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
                  Dissect Your Cell!
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Explore authentic 3D scientific simulations, verified chemical reactions, cellular biology, and interactive surgical anatomy dissections built on deterministic mathematical and physiological models.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('physics')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Explore Physics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('chemistry')}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Virtual Chemistry Lab</span>
                </button>
                <button
                  onClick={() => onNavigate('anatomy')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>3D Dissection</span>
                </button>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Deterministic Math Engines</span>
                </div>
                <span>·</span>
                <div>Immersive 3D Environments</div>
                <span>·</span>
                <div>122+ Interactive 3D Models</div>
              </div>
            </div>

            {/* Right Column: Live Interactive 3D Model Hero Viewport */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="absolute top-4 left-4 z-10 bg-white/95 px-3 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
                  Live 3D Carbon-14 Atom · Drag to Rotate
                </div>
                <div ref={mountRef} className="w-full h-[380px] sm:h-[430px] rounded-xl overflow-hidden" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Subject Workstations Section */}
      <section className="py-16 md:py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Four Specialized Virtual Laboratories.
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Every workstation is powered by genuine WebGL 3D renderers and real-time scientific calculation engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Physics Card */}
            <div
              onClick={() => onNavigate('physics')}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  Physics Lab
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Real-time projectile kinematics with aerodynamic drag, non-linear simple pendulums, and direct current circuits obeying Ohm&apos;s Law.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-sky-600">
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
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Chemistry Lab
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  3D virtual reaction bench with beakers, reagent pouring, dynamic color shifts, effervescent bubbling, precipitate clouds, and 3D molecules.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-emerald-600">
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
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Dna className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  Biology Lab
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Interactive cutaway 3D cell explorer with selectable organelles, anatomical 4-chambered heart with blood flow, and Watson-Crick DNA helix.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-rose-600">
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
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Frog &amp; Human Anatomy
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Interactive 3D surgical dissection suite. Rotate frog cervical neck or follow human midline guide to inspect internal organs.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-teal-600">
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
                Describe any scientific concept in natural language — from a simple electric motor or lever to the human respiratory system or magnetic dipole lines. Tech-Anatomix builds a fully interactive 3D model with parts, labels, and adjustable parameters.
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
