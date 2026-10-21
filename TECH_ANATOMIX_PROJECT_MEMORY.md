# TECH-ANATOMIX — PERSISTENT PROJECT MEMORY & ARCHITECTURE SPECIFICATION

> **Notice to AI Studio Sessions & Engineering Agents**: This document is the primary, persistent engineering reference for Tech-Anatomix. It details verified application architecture, global development rules, model/viewer classifications, branding standards, anatomy dissection systems, model registers, and known constraints.

---

## A. PROJECT IDENTITY

- **Project Name**: Tech-Anatomix
- **Tagline**: Dissect Your Cell!
- **Educational Purpose**: Interactive 3D science and technology learning platform providing real-time physical simulations, anatomical virtual dissections, chemical reaction discovery, interactive molecular/cellular structures, AI-guided learning, and optical diagram scanning.
- **Technology Stack**:
  - **Framework & Build**: React 18, Vite, TypeScript
  - **3D Graphics Engine**: Three.js (`three` r160+), `@react-three/fiber` / `@react-three/drei` (where applicable), native GLTFLoader
  - **Styling**: Tailwind CSS (v4 standard with CSS variable imports), Lucide Icons (`lucide-react`)
  - **Testing**: Custom Node/TypeScript test runner (`tsx src/tests/runTests.ts`) executing 18 unit/integration test suites and 118 assertions.
- **Major Modules**:
  1. **Home Module**: High-impact portal and module launcher (`HomePage.tsx`).
  2. **Anatomy Explorers**: High-precision Human Body Virtual Dissection & Frog Anatomy Lab (`AnatomyPage.tsx`, `HumanAnatomyExplorer.tsx`, `FrogAnatomyExplorer.tsx`).
  3. **Biology Lab**: Cellular organelles, DNA transcription/translation, plant cell anatomy (`BiologyLabPage.tsx`).
  4. **Chemistry Lab**: Chemical Reaction Discovery Engine, compound library, interactive molecular geometry (`ChemistryLabPage.tsx`).
  5. **Physics Lab**: Real-time physical simulations including Electric Bell, Heat Transfer (Conduction, Convection, Radiation), Rutherford Alpha Scattering, Projectile Motion, Pendulum, and Electric Circuits (`PhysicsLabPage.tsx`).
  6. **AI Lab & Model Generator**: Context-aware AI Assistant and AI 3D Model Spec Generator (`AiAssistantPage.tsx`, `AiModelGeneratorPage.tsx`).
  7. **Diagram Scanner**: Optical diagram analysis and 3D concept conversion (`DiagramScanPage.tsx`).
  8. **About Page**: Mission, pedagogy, and technical breakdown (`AboutPage.tsx`).

---

## B. ARCHITECTURE MAP

```
src/
├── main.tsx                         # App entry point
├── App.tsx                          # Primary layout & state-based router (PageRoute)
├── components/
│   ├── ai/                          # AI Assistant & Chatbot components
│   │   ├── ExternalModelAiChat.tsx  # Dedicated AI chat panel for external 3D models
│   │   └── ModelAwareChatbot.tsx    # Context-aware chatbot for Three.js models
│   ├── biology/                     # Biology & Anatomy Explorer components
│   │   ├── HumanAnatomyExplorer.tsx # Human Body Dissection system & 3D model
│   │   └── FrogAnatomyExplorer.tsx  # Frog Dissection system & surgical tray
│   ├── chemistry/                   # Chemistry lab & reaction simulation components
│   ├── common/                      # Shared reusable UI & 3D viewer components
│   │   ├── Global3DViewer.tsx       # Standard 3D viewport wrapper for Three.js/GLB
│   │   ├── ModelPositionControls.tsx # Universal X/Y position sliders & nudge controls
│   │   ├── ExternalCalloutOverlay.tsx # Floating label/callout overlay system
│   │   └── EducationalExplanationBox.tsx # Full-width educational explanation card
│   ├── layout/                      # Navbar & Footer layout components
│   │   ├── Navbar.tsx               # Top header with brand logo (/logo.png) & nav
│   │   └── Footer.tsx               # Footer with links & branding
│   ├── models/                      # 3D Model renderers & workspace layouts
│   │   ├── Dynamic3DModelRenderer.tsx # Master renderer for native Three.js & GLB models
│   │   └── ExternalModelWorkspace.tsx # Split workspace layout for Sketchfab 3D embeds
│   ├── physics/                     # Physics lab components
│   └── diagram/                     # Diagram scanner components
├── data/                            # Curated model specs, reaction databases, & registries
│   ├── curatedAiModels.ts           # Batch 1 curated 3D model specifications
│   ├── curatedModelsBatch2.ts       # Batch 2 curated 3D model specifications
│   ├── curatedModelsBatch3.ts       # Batch 3 curated 3D model specifications
│   ├── curatedModelsBatch4.ts       # Batch 4 curated 3D model specifications
│   ├── curatedModelsBatch5.ts       # Batch 5 curated 3D model specifications
│   ├── humanAnatomyData.ts          # Human anatomical structure registry & annotations
│   ├── frogAnatomyData.ts           # Frog anatomical structure registry
│   └── chemicalLibraryData.ts       # Chemical compounds & reaction database
├── simulations/                     # Pure mathematical simulation engines
│   ├── orbitControls.ts             # Custom OrbitControls implementation
│   └── physics/                     # Heat transfer & electric bell math engines
├── tests/                           # Verification test suites executed via runTests.ts
└── types/                           # TypeScript interfaces for models & simulations
```

### Static Asset Structure (`/public`)
- `/logo.png`: Primary brand logo asset used in `Navbar.tsx` and overlay banners.
- `/models/human_base_mesh_01.glb`: Verified GLB 3D model for Human Anatomy Explorer.
- `/models/frog_dissection.glb`: Verified GLB 3D model for Frog Anatomy Explorer.

---

## C. GLOBAL IMPLEMENTATION RULES

1. **Inspect Before Modifying**: Always inspect the existing file and its imports/usages before editing.
2. **Component Reuse First**: Utilize `Global3DViewer`, `ExternalModelWorkspace`, `ModelPositionControls`, and `EducationalExplanationBox` rather than inventing parallel UI components.
3. **No Duplicate Viewers or Systems**: Maintain single-source routing and rendering. Do not build secondary/parallel dissection explorers or duplicated 3D canvases.
4. **Preserve Unrelated Functionality**: Edits to shared components (e.g., `Global3DViewer` or `Dynamic3DModelRenderer`) must be regression-tested against all dependent modules (Physics, Chemistry, Biology, Anatomy).
5. **Verify Behavior with Tests**: Validate code using `npx tsx src/tests/runTests.ts`, `compile_applet`, and `lint_applet` before reporting completion.
6. **No Fake / Simulation Cheats**: Do not move camera position to simulate model translation or mock interactive controls with static images.
7. **Accurate Reporting**: Report actual source changes, verified test outputs, and technical platform limitations honestly.

---

## D. MODEL AND VIEWER CLASSIFICATION

Tech-Anatomix utilizes three distinct categories of 3D models. Each has explicit capabilities and constraints:

### 1. Native Three.js Simulations
- **Examples**: Electric Bell, Heat Conduction/Convection/Radiation, Rutherford Alpha Scattering, Chemical Reactions, Molecular Bonding.
- **Rendering Component**: `Dynamic3DModelRenderer.tsx` + dedicated simulation step functions (`heatTransferEngine.ts`, `electricBellEngine.ts`).
- **Supported Controls**: `SimpleOrbitControls` (Orbit/Zoom/Pan), parameter sliders, play/pause, simulation speed, camera angle presets, and universal `ModelPositionControls`.
- **Overlays**: Integrated canvas labels, floating callouts via `ExternalCalloutOverlay.tsx`.
- **Allowed Modifications**: Physics math parameters, material properties, procedural particle systems, geometry updates.
- **Constraints**: Must NOT alter camera coordinates when adjusting model X/Y position offsets.

### 2. GLB / GLTF Models Rendered via Application Viewer
- **Examples**: Human Body GLB (`/models/human_base_mesh_01.glb`), Frog Anatomy GLB (`/models/frog_dissection.glb`), Cell Organelles.
- **Rendering Component**: `HumanAnatomyExplorer.tsx`, `FrogAnatomyExplorer.tsx`, `Dynamic3DModelRenderer.tsx` using Three.js `GLTFLoader`.
- **Supported Controls**: Native 3D scene camera rotation, zoom, clipping planes, anatomical mesh highlights, dissection sliders/step controls, and `ModelPositionControls`.
- **Overlays**: 3D sprite callout lines, HUD badges, anatomical info overlays.
- **Allowed Modifications**: Custom shaders, procedural dissection cuts, depth/polygon offsets, texture adjustments, mesh subgroup transformations.

### 3. External Embedded Viewers (Sketchfab)
- **Examples**: 7 verified Sketchfab models across Anatomy and 3D Model Explorer.
- **Rendering Component**: `ExternalModelWorkspace.tsx` wrapping cross-origin `<iframe>` embeds.
- **Workspace Layout**: Split desktop layout with AI Chat Assistant on the left (50%) and 3D Viewer on the right (50%). On mobile, 3D Viewer is on top and AI Chat is on bottom.
- **Brand Overlay**: Top extreme left brand logo overlay (`/logo.png`) rendered directly inside the viewer container (`absolute top-3 left-3 z-20 pointer-events-none`).
- **Constraints**: Cross-origin `<iframe>` sandboxing prevents direct internal DOM or shader modification. Viewer controls are restricted to official Sketchfab iframe URL params (`ui_controls`, `autostart`, etc.).

---

## E. GLOBAL VIEWER AND BRANDING RULES

- **Logo Asset Location**: `/logo.png` in the `/public` root directory.
- **Header Branding**: Displayed in `src/components/layout/Navbar.tsx` alongside "Tech-Anatomix" wordmark and "Dissect Your Cell!" tagline.
- **External Viewer Branding**:
  - `ExternalModelWorkspace.tsx` renders `/logo.png` at `absolute top-3 left-3 z-20` over Sketchfab 3D embed viewports.
  - Features backdrop blur, subtle shadow, and border styling for high contrast against dark viewer backgrounds.
- **Native 3D Viewers Exclusion**:
  - `Global3DViewer.tsx` handles native Three.js/GLB models with custom HUD cockpits (title badge, FPS indicator, camera reset, position sliders below viewer). It does NOT clutter the top-left canvas with duplicate floating logo overlays since the top bar already displays the active model badge.

---

## F. EXTERNAL VIEWER TEXT RULES

When managing text in 3D viewers:
1. **Application-Generated Text**: Fully controllable via React props (HUD badges, titles, instructions, callouts).
2. **Sketchfab / External Embed UI Text**:
  - Controlled via URL query parameters (`ui_infos=0`, `ui_controls=1`, `ui_stop=0`, `ui_watermark=0`).
  - Cross-origin security policies prevent arbitrary script injection into external iframe DOMs.
3. **Model-Embedded Text**: Text hardcoded into 3D geometry or baked into textures within external GLB assets cannot be removed at runtime without editing the GLB asset files.

---

## G. ANATOMY AND DISSECTION RULES

### Human Anatomy Explorer (`src/components/biology/HumanAnatomyExplorer.tsx`)
- **Base Model**: `/models/human_base_mesh_01.glb` (`Object_2` outer skin mesh, centered coordinates $Z \in [0, 1.936]$).
- **View Modes**: External Skin View vs. Internal Organs View.
- **Dissection Mechanics**:
  - **Incision Geometry** (`buildRefinedIncisionGeometries`): Midline abdominal cut along $Y \in [-0.12, 0.12]$.
  - **Fix 1 — Stomach Expansion**: `createAnatomicalStomach()` builds a 3D stomach model centered at local $(0,0,0)$. When dissection progress crosses the stomach threshold, `stomachGroup` expands radially ($0.05 \to 1.0$) and advances forward through the abdominal aperture ($Z: 0.130 \to 0.152$) without deforming the outer body.
  - **Fix 2 — Non-Graphic Visual Feedback**: Features a surface-conforming vascular red margin (`0x8b1a1a`, opacity $0.75$, `polygonOffset`) along incision edges and an active hemostasis halo ring (`activeHemoHalo`) tracking the scalpel's leading edge.
  - **Fix 3 — Refined Cut Geometry**: Features a wider superior entry notch ($0.026$ width) with a smooth semi-elliptical arc transition at the epigastrium.
  - **Reset Behavior**: `handleResetDemonstration` restores baseline geometry, hides vascular overlays, and resets stomach scale to $0.05$ at $Z=0.130$.

### Frog Anatomy Explorer (`src/components/biology/FrogAnatomyExplorer.tsx`)
- **Base Model**: `/models/frog_dissection.glb` positioned on a stainless steel surgical tray.
- **Dissection Controls**: Multi-step tissue pinning, skin incision, muscle layer retraction, and organ labeling.

---

## H. MODEL-SPECIFIC IMPLEMENTATION REGISTER

| Display Name | Model ID | Category | Source File | Loading Method | Special Requirements & Controls | Verified Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Human Body Dissection** | `human-anatomy` | GLB Model | `HumanAnatomyExplorer.tsx` | `GLTFLoader` (`/models/human_base_mesh_01.glb`) | Dissection slider, skin/internal toggle, stomach expansion, vascular feedback | Verified & Tested |
| **Frog Dissection Lab** | `frog-anatomy` | GLB Model | `FrogAnatomyExplorer.tsx` | `GLTFLoader` (`/models/frog_dissection.glb`) | Tray pinning, layer-by-layer retraction, organ inspection | Verified & Tested |
| **Electric Bell Simulation** | `electric-bell` | Native Three.js | `Dynamic3DModelRenderer.tsx` | Procedural Three.js Meshes | `stepElectricBell` physics loop, voltage/hammer controls | Verified & Tested |
| **Heat Conduction Lab** | `heat-conduction` | Native Three.js | `Dynamic3DModelRenderer.tsx` | Procedural Rod Mesh | Material selector, thermal conductivity solver | Verified & Tested |
| **Heat Convection Lab** | `heat-convection` | Native Three.js | `Dynamic3DModelRenderer.tsx` | Procedural Fluid Mesh | Thermal buoyancy particle system, flow velocity math | Verified & Tested |
| **Heat Radiation Lab** | `heat-radiation` | Native Three.js | `Dynamic3DModelRenderer.tsx` | Procedural Emitter Mesh | Stefan-Boltzmann radiation solver, emissivity slider | Verified & Tested |
| **Rutherford Scattering** | `rutherford-scattering` | Native Three.js | `Dynamic3DModelRenderer.tsx` | Procedural Particle System | Alpha particle trajectory deflection math | Verified & Tested |
| **Sketchfab 3D Models (7x)** | Various | External Embed | `ExternalModelWorkspace.tsx` | Cross-origin `<iframe>` | AI Chat Assistant (50% left), Top-left `/logo.png` overlay | Verified & Tested |

---

## I. FEATURE AND CHANGE HISTORY

- **Initial Release**: Core application framework, page routing, basic Three.js viewers, and model spec registry.
- **Anatomy Explorers**: Integrated Human Body GLB (`human_base_mesh_01.glb`) and Frog Anatomy GLB (`frog_dissection.glb`).
- **Universal Model Position Controller**: Added `ModelPositionControls.tsx` providing X/Y translation sliders and arrow keys across native Three.js and GLB viewers.
- **Dedicated AI Learning Workspace**: Introduced `ExternalModelWorkspace.tsx` and `ExternalModelAiChat.tsx` featuring a 50/50 split desktop layout for Sketchfab models.
- **Brand Logo Standard**: Updated website logo to `/logo.png` across `Navbar.tsx` and external viewer top-left overlays (`ExternalModelWorkspace.tsx`).
- **Human Dissection Interaction Fixes (Fix 1, Fix 2, Fix 3)**:
  - **Fix 1**: Re-engineered stomach geometry with central core origin $(0,0,0)$ and outward radial expansion ($Z: 0.130 \to 0.152$, scale $0.05 \to 1.0$) during abdominal dissection.
  - **Fix 2**: Implemented surface-conforming crimson margins (`0x8b1a1a`) and dynamic cutting tip hemostasis ring.
  - **Fix 3**: Refined incision aperture with wider upper opening ($0.026$) and smooth semi-elliptical fillet transition.
- **Persistent Project Memory**: Created central documentation system (`TECH_ANATOMIX_PROJECT_MEMORY.md`, `TECH_ANATOMIX_DEVELOPMENT_RULES.md`, `TECH_ANATOMIX_SESSION_START.md`) for cross-session continuity.
- **Anatomy Auto-Scroll Removal**: Replaced `element.scrollIntoView()` in `ExternalModelAiChat.tsx` with container-scoped `scrollTop` scrolling to prevent window-level auto-scrolling to the bottom when opening or viewing the Anatomy tab.
- **3D Model Studio Refinement**: Removed "Reflection & Refraction", "Hydro Power", and "Blood Microscope" option chips from `AiModelGeneratorPage.tsx`.
- **Blood Transport Viewer Cleanup**: Removed the overlay text box HUD from `Dynamic3DModelRenderer.tsx` for the Blood Transport model (`blood-transport`) so the 3D model is completely unobstructed on the viewer screen.
- **Automatic Organ System Opening**: Updated Human and Frog dissection workflows (`HumanAnatomyExplorer.tsx`, `FrogAnatomyExplorer.tsx`, and `FrogNeckDissectionScene.tsx`) so that completing the virtual dissection automatically transitions and opens the internal organ system view without requiring a manual button click.
- **Chemical Reactions Lab Audit & Repair**: Enhanced `evaluateReactionRecipe` and `ReactionAiChatbot.tsx` with explicit `structuredStatus` classification (`VALIDATED_SUPPORTED_REACTION`, `CONDITION_DEPENDENT`, `NO_REACTION_SUPPORTED_UNDER_SPECIFIED_CONDITIONS`, `UNSUPPORTED_REACTION`, `INSUFFICIENT_INFORMATION`). Disentangled general chemistry Q&A from current beaker state analysis, added reagent extraction to evaluate mentioned chemical pairs without claiming empty beaker, and guaranteed 3D beaker visual effects render solely for validated reactions. Added automated test suite `chemistryLabAuditAndRepair.test.ts` verifying 10 representative cases.
- **Advanced Physics Batch 1 (Models 1–7) — Premium Scientific 3D Studio Upgrade**: Implemented and upgraded the 7 Batch 1 Physics models in `src/data/curatedModelsAdvancedPhysicsBatch1.ts`, `src/simulations/physics/advancedPhysicsBatch1Engine.ts`, and `src/simulations/physics/advancedPhysicsBatch1Studio.ts`:
  1. **Electromagnetic Wave Propagation Explorer** (`electromagnetic-wave-propagation`) — Multi-sample 3D vector combs + continuous `TubeGeometry` wave ribbons for $\vec{E}(x,t)$ and $\vec{B}(x,t)$, precision waveguide rail, sliding wavefront phase frame, $\lambda$ caliper bridge, and Poynting vector $\vec{S}$ assembly.
  2. **Plasma Physics Explorer** (`plasma-physics-explorer`) — Glass vacuum torus with metallic copper toroidal field coils, central solenoid column, 8 helically gyrating positive ions with Larmor orbit wakes, 10 counter-gyrating free electrons, 3D magnetic flux cage, E-field plates, and Debye shielding sphere ($\lambda_D$).
  3. **Particle Accelerator Explorer** (`particle-accelerator-explorer`) — Multi-cell copper RF linac cavity with beam iris ports, precision ceramic/steel injection gun, streaming multi-bunch particle beam with continuous curved trajectory tube, C-yoke dipole bending electromagnet with copper coils, and segmented phosphor/Cherenkov detector array.
  4. **Magnetic Levitation Mechanism Explorer** (`magnetic-levitation-explorer`) — Ribbed steel guideway beam with laminated stator pole teeth, aerodynamic pearl-white/graphite maglev bogie with C-shaped wrap-around superconducting cryomodules, figure-8 levitation coils, laser gap caliper, and 3D $\vec{F}_{\text{mag}}$ / $m\vec{g}$ vector assemblies.
  5. **Superconductivity & Meissner Effect Explorer** (`superconductivity-meissner-explorer`) — Double-walled stainless-steel $\text{LN}_2$ cryostat dewar with boiling nitrogen surface, dark ceramic $\text{YBa}_2\text{Cu}_3\text{O}_{7-\delta}$ disc with copper electrode clamp ring, multi-turn gold Cooper-pair screening current loops, 8-meridian 3D magnetic flux cage that dynamically bows outward for $T < T_c$ or penetrates straight through for $T \ge T_c$, and a rotating silver-nickel $\text{NdFeB}$ magnet.
  6. **Black Hole & Gravitational Lensing Explorer** (`black-hole-gravitational-lensing`) — Pitch-black event horizon ($r_s$) with relativistic Doppler-shifted accretion disk, photon-sphere ($1.5\,r_s$) orbital rings, funnel-shaped 3D Flamm's paraboloid spacetime curvature mesh (14 radial rings + 24 meridians), stellar emitter with corona, 8 continuous hyperbolic geodesic light ray tubes ($b/r_s$), and an observer focal plane displaying the lensed Einstein ring and double-image arcs.
  7. **Quantum Tunnelling Explorer** (`quantum-tunnelling-explorer`) — Precision quantum waveguide bench with Region I/II/III dividers, semi-transparent glass potential energy barrier ($V_0, a$) with metallic end-frames, incident + reflected standing-wave ribbon & 3D complex helix ($\psi_{\text{I}}$), evanescent barrier decay ribbon & envelope ($\psi_{\text{II}} \propto e^{-\kappa x}$), transmitted propagating wave ($\psi_{\text{III}}$), particle energy reference bridge ($E$), and 3D Born probability density curve ($|\psi(x)|^2$).
  - **Restored Label Architecture**: Restored the original compact pill-shaped label badges (`bg-white/95 text-slate-900 rounded-full border-slate-300/90 shadow-sm`) matching Models 1–40 across all Batch 1 models.
  - **Scoped Studio Environment**: `setupBatch1StudioEnvironment` applies a multi-shade scientific studio backdrop (midnight-slate top, deep slate-teal center, warm dark-graphite floor), `RoomEnvironment` PBR reflections, a soft radial pedestal floor disc, and 3-point + hemisphere studio lighting strictly scoped to Batch 1 Models 1–7.
- **Advanced Physics Batch 2 (Models 48–54)**: Added 7 interactive 3D models (`faraday-law-induction-explorer`, `motor-generator-energy-explorer`, `ac-voltage-transformer-explorer`, `wave-interference-diffraction-lab`, `optical-interferometer-explorer`, `fluid-dynamics-bernoulli-vortex`, `tokamak-fusion-confinement-explorer`) in `curatedModelsAdvancedPhysicsBatch2.ts`, `advancedPhysicsBatch2Engine.ts`, and `advancedPhysicsBatch2Studio.ts`.
- **Pre-Batch-1 Visual Quality Upgrade (Models 1–40 & Standalone Scenes)**: Upgraded all pre-existing models and standalone 3D scenes (`preBatch1VisualUpgradeStudio.ts`) to the multi-shade studio gradient backdrop, `RoomEnvironment` PBR lighting, high-segment smooth geometries, and composite metallic/glass detailing while strictly preserving Models 41+.
- **Advanced Physics Batch 3 (Models 55–61)**: Implemented 7 interactive 3D physics laboratories in `src/data/curatedModelsAdvancedPhysicsBatch3.ts`, `src/simulations/physics/advancedPhysicsBatch3Engine.ts`, and `src/simulations/physics/advancedPhysicsBatch3Studio.ts`:
  - **55. Doppler Effect & Sonic Boom Explorer** (`doppler-effect-sonic-boom-explorer`) — Moving acoustic source jet, observer station, expanding spherical wavefront rings, subsonic/sonic/supersonic regimes, and conditional Mach shock cone ($\sin\mu = v/v_{\text{source}} = 1/M$ for $M \ge 1$).
  - **56. Seismic Waves & Earthquake Wave Propagation Lab** (`seismic-waves-earthquake-lab`) — 3D Earth cross-section (crust, mantle, liquid outer core, solid inner core), hypocentre/epicentre, curved P-wave and S-wave ray paths, liquid outer core S-wave shadow zone ($\Delta > 103^\circ$, $\mu = 0$), surface waves, and 3D seismogram trace.
  - **57. Gyroscope, Torque & Angular Momentum Laboratory** (`gyroscope-torque-angular-momentum-lab`) — Spinning metallic rotor in Cardan gimbal, orthogonal spin axis $\hat{\omega}$, angular momentum $\vec{L} = I\vec{\omega}$, gravitational torque $\vec{\tau} = \vec{r} \times m\vec{g}$, and horizontal precession $\Omega_p = \tau / (I\omega\sin\theta)$ vs non-spinning toppling.
  - **58. Simple Harmonic Motion & Coupled Oscillators Lab** (`shm-coupled-oscillators-lab`) — Dual spring-coupled masses ($k, k_c, k$) on precision guide rail, dynamic helical spring coils, in-phase ($\omega_1 = \sqrt{k/m}$) and anti-phase ($\omega_2 = \sqrt{(k+2k_c)/m}$) normal modes, weak-coupling beat envelope ($f_{\text{beat}}$), and real-time $K + U = E_{\text{total}}$ energy bars.
  - **59. Thermodynamics: Heat Engine & Carnot Cycle Explorer** (`thermodynamics-carnot-heat-engine`) — Hot ($T_H$) and cold ($T_C$) reservoirs, transparent cylinder with thermally glowing ideal-gas core, reciprocating piston, linkage rod, rotating flywheel, $Q_H/Q_C/W$ energy streams, and 3D $P\text{–}V$ Carnot cycle loop with live state tracer and $\eta_{\text{Carnot}} = 1 - T_C/T_H$ validation.
  - **60. Photoelectric Effect & Quantum Energy Explorer** (`photoelectric-effect-quantum-explorer`) — Monochromatic emitter with frequency-to-RGB mapping, streaming photon wave-packets ($E = hf$), selectable metal cathode ($\text{Cs}, \text{Na}, \text{Zn}, \text{Cu}, \text{Pt}$), threshold check ($f \ge f_0 = \Phi/h$), emitted photoelectrons ($K_{\max} = hf - \Phi$), stopping potential retarder ($eV_{\text{stop}} = K_{\max}$), microammeter, and 3D quantum energy bar comparison.
  - **61. Special Relativity: Time Dilation & Length Contraction Lab** (`special-relativity-time-length-lab`) — Dual-frame 3D laboratory comparing Proper Frame $S'$ (vertical light clock path $2h$, rest length $L_0$) and Stationary Observer Frame $S$ (diagonal zig-zag photon trajectory, Lorentz-contracted spacecraft $L = L_0/\gamma$, dilated clock $\Delta t = \gamma\Delta t_0$, where $\gamma = 1/\sqrt{1 - v^2/c^2}$ for $v < c$).

---

## J. KNOWN LIMITATIONS AND OPEN TASKS

### Confirmed Platform Restrictions
1. **Sketchfab Cross-Origin Restrictions**: Direct DOM/shader modifications inside Sketchfab iframes are blocked by browser cross-origin policy. All customizations must use official Sketchfab embed parameters.
2. **HMR Disabled in Dev Server**: Hot Module Replacement is intentionally disabled in the preview sandbox; browser reloads handle state resets cleanly.

### Open / Future Maintenance Tasks
1. Maintain alignment between `curatedAiModels.ts` model IDs and test assertion suites.
2. Ensure new Sketchfab integrations use `ExternalModelWorkspace` to preserve AI chat integration and logo overlay placement.
