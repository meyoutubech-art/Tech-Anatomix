import { ScientificModelSpec } from '../types/aiModel';

/**
 * TECH-ANATOMIX / VIZLAB — PHYSICS BATCH 3: MODELS 55–61 (PREMIUM SCIENTIFIC 3D EXPLORERS)
 *
 * Models included:
 * 55. Doppler Effect & Sonic Boom Explorer ('doppler-effect-sonic-boom-explorer')
 * 56. Seismic Waves & Earthquake Wave Propagation Lab ('seismic-waves-earthquake-lab')
 * 57. Gyroscope, Torque & Angular Momentum Laboratory ('gyroscope-torque-angular-momentum-lab')
 * 58. Simple Harmonic Motion & Coupled Oscillators Lab ('shm-coupled-oscillators-lab')
 * 59. Thermodynamics: Heat Engine & Carnot Cycle Explorer ('thermodynamics-carnot-heat-engine')
 * 60. Photoelectric Effect & Quantum Energy Explorer ('photoelectric-effect-quantum-explorer')
 * 61. Special Relativity: Time Dilation & Length Contraction Lab ('special-relativity-time-length-lab')
 */
export const ADVANCED_PHYSICS_BATCH_3_MODELS: Record<string, ScientificModelSpec> = {
  // =========================================================================
  // 55. DOPPLER EFFECT & SONIC BOOM EXPLORER
  // =========================================================================
  dopplerEffectSonicBoom: {
    id: 'doppler-effect-sonic-boom-explorer',
    title: 'Doppler Effect & Sonic Boom Explorer',
    concept: 'Acoustic Wavefront Compression, Relative Motion Frequency Shift & Supersonic Mach Cone',
    description:
      'Interactive 3D acoustic propagation laboratory featuring a moving acoustic emitter aircraft/vehicle, a calibrated observer station, expanding spherical sound wavefront rings showing ahead-of-source compression and behind-source expansion, velocity vectors, and a conditional supersonic Mach shock-wave cone.',
    whatIsIt:
      'A 3D wave-propagation simulator demonstrating how relative motion between a sound source and an observer shifts the observed frequency and wavelength (the Doppler Effect), and how supersonic travel (Mach M > 1) forms a conical shock wave.',
    howDoesItWork:
      'Each acoustic crest expands spherically at the medium sound speed v relative to the air, while the source advances at speed v_source. For a 1D approaching source and observer, the observed frequency is f_obs = f_source · (v + v_observer) / (v - v_source), where v_source > 0 toward the observer and v_observer > 0 toward the source. Ahead of a subsonic moving source (v_source < v), wavefronts bunch together (shorter wavelength λ_front = (v - v_source)/f_source, higher pitch); behind it, wavefronts spread apart (longer wavelength λ_rear = (v + v_source)/f_source, lower pitch). Only when the source speed exceeds the speed of sound (Mach number M = v_source / v > 1) do the expanding wavefronts overlap constructively along a conical envelope of half-angle sin(μ) = v / v_source = 1 / M, creating a supersonic sonic boom.',
    realLifeExample:
      'Ambulance siren pitch rising as it approaches and dropping as it passes; weather Doppler radar measuring raindrop velocity; supersonic jet aircraft generating a sonic boom shock cone; astrophysical redshift and blueshift.',
    examConnection:
      '1D Approaching Doppler formula: f_obs = f_source · (v + v_observer)/(v - v_source). Remember that sound speed v depends only on the medium (e.g., ~343 m/s in 20°C dry air), not on source speed. Shock-wave Mach angle: sin(μ) = 1/M = v / v_source (valid only for M ≥ 1).',
    scaleNote:
      'Educational Wave Visualization: Sound waves are pressure oscillations in a medium and are not visible to the human eye; expanding rings and the supersonic Mach cone (shown only when M ≥ 1.0) represent surfaces of constant acoustic phase (wavefronts).',
    simulationModel: 'predictive',
    functionalType: 'doppler-effect-sonic-boom-explorer',
    prompt:
      'Create a 3D model of the Doppler effect and sonic boom explorer with moving sound source, observer, wavefront compression, and Mach shock-wave cone',
    camera: {
      position: [0.4, 3.2, 7.4],
      target: [0, 0.2, 0],
    },
    parameters: {
      sourceSpeed: {
        id: 'sourceSpeed',
        name: 'Source Speed (v_source)',
        min: 0,
        max: 680,
        step: 10,
        defaultValue: 180,
        unit: 'm/s',
        description:
          'Speed of the acoustic source relative to the air medium. Compare stationary (0 m/s), subsonic (< v), and supersonic (> v) motion.',
        affects: 'custom',
      },
      observerSpeed: {
        id: 'observerSpeed',
        name: 'Observer Speed (v_observer)',
        min: -120,
        max: 120,
        step: 10,
        defaultValue: 0,
        unit: 'm/s',
        description:
          'Speed of the observer along the propagation axis (+ toward source, - away from source).',
        affects: 'custom',
      },
      soundSpeed: {
        id: 'soundSpeed',
        name: 'Sound Speed in Medium (v)',
        min: 240,
        max: 500,
        step: 5,
        defaultValue: 340,
        unit: 'm/s',
        description:
          'Acoustic propagation velocity v in the surrounding medium (e.g., 340 m/s in standard air).',
        affects: 'custom',
      },
      sourceFrequencyHz: {
        id: 'sourceFrequencyHz',
        name: 'Emitted Frequency (f_source)',
        min: 100,
        max: 900,
        step: 20,
        defaultValue: 440,
        unit: 'Hz',
        description: 'Rest-frame acoustic frequency emitted by the sound source.',
        affects: 'custom',
      },
    },
    conditions: {
      motionRegimePreset: {
        id: 'motionRegimePreset',
        name: 'Source Motion Preset',
        type: 'select',
        defaultValue: 'custom',
        options: [
          { value: 'custom', label: 'Custom Slider Speeds' },
          { value: 'stationary', label: 'Stationary Source (M = 0.00)' },
          { value: 'subsonic', label: 'Subsonic Source (M = 0.55)' },
          { value: 'supersonic', label: 'Supersonic Source (M = 1.45 — Sonic Boom)' },
        ],
        description:
          'Quickly compare a stationary source, a subsonic Doppler-shifted source, and a supersonic shock-cone source.',
      },
      sourceDirection: {
        id: 'sourceDirection',
        name: 'Source Travel Direction',
        type: 'select',
        defaultValue: 'approaching',
        options: [
          { value: 'approaching', label: 'Approaching Observer (+x →)' },
          { value: 'receding', label: 'Receding from Observer (← -x)' },
        ],
        description: 'Reverses the travel direction of the sound source relative to the observer.',
      },
      showWavefronts: {
        id: 'showWavefronts',
        name: 'Wavefront Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the emitted spherical acoustic wavefront rings.',
      },
      showShockCone: {
        id: 'showShockCone',
        name: 'Shock-Wave Visualization (When M ≥ 1)',
        type: 'boolean',
        defaultValue: true,
        description:
          'Displays the conical Mach envelope when the source speed equals or exceeds the speed of sound (M ≥ 1).',
      },
    },
    parts: [
      {
        id: 'sound-source',
        name: 'Acoustic Emitter Aircraft / Sound Source',
        shape: 'cone',
        dimensions: [0.35, 1.3],
        position: [-0.8, 0.35, 0],
        rotation: [0, 0, -Math.PI / 2],
        color: '#38BDF8',
        material: 'metal',
        label: 'Sound Source',
        description:
          'Streamlined acoustic emitter vehicle travelling through the medium at speed v_source while radiating periodic sound crests at frequency f_source.',
        whatIsIt: 'The moving wave source that generates periodic acoustic compressions at frequency f_source.',
        whatDoesItDo:
          'Because it moves between successive wave emissions, each new wavefront is centered closer to its direction of travel, compressing wavefronts ahead and stretching them behind.',
      },
      {
        id: 'observer-receiver',
        name: 'Observer Acoustic Receiver Station',
        shape: 'cylinder',
        dimensions: [0.32, 0.9],
        position: [2.6, 0.1, 0.7],
        color: '#F59E0B',
        material: 'metal',
        label: 'Observer',
        description:
          'Calibrated acoustic receiver station equipped with a parabolic microphone dish measuring the arriving wavefront frequency f_obs.',
        whatIsIt: 'The reference observer / detector that intercepts incoming sound wavefronts.',
        whatDoesItDo:
          'Records a higher frequency (blueshift/higher pitch) when wavefronts arrive more rapidly during approach, and a lower frequency when receding.',
      },
      {
        id: 'acoustic-wavefronts',
        name: 'Emitted Acoustic Wavefronts (Compressed & Expanded)',
        shape: 'torus',
        dimensions: [1.6, 0.04],
        position: [-1.2, 0.35, 0],
        color: '#22D3EE',
        material: 'glow',
        label: 'Wavefronts',
        description:
          'Concentric expanding spherical wave crests emitted at equal time intervals, illustrating shortened wavelength λ_front ahead and elongated wavelength λ_rear behind.',
        whatIsIt: 'Visualized surfaces of constant acoustic phase (pressure crests) expanding at speed v.',
        whatDoesItDo:
          'Reveals how source motion crowds wavefronts in the forward direction and spreads them out in the wake.',
      },
      {
        id: 'shock-wave-cone',
        name: 'Supersonic Mach Shock-Wave Cone (M ≥ 1)',
        shape: 'cone',
        dimensions: [1.45, 3.2],
        position: [-1.8, 0.35, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#F43F5E',
        material: 'glass',
        opacity: 0.42,
        label: 'Shock-Wave Cone',
        description:
          'Conical Mach wavefront envelope formed by constructive interference of overlapping wavefronts when v_source ≥ v (sin μ = 1/M). Strictly absent in subsonic motion.',
        whatIsIt: 'The 3D conical shock front (sonic boom envelope) formed only during supersonic flight (M ≥ 1).',
        whatDoesItDo:
          'Concentrates acoustic pressure along a cone of half-angle μ = arcsin(v / v_source), producing a sudden sonic boom when the cone sweeps past an observer.',
      },
      {
        id: 'motion-path-guide',
        name: 'Ground Reference & Propagation Motion Path',
        shape: 'box',
        dimensions: [7.6, 0.12, 1.6],
        position: [0, -0.65, 0],
        color: '#475569',
        material: 'metal',
        label: 'Motion Path',
        description:
          'Calibrated ground reference track and linear acoustic propagation axis showing rest-frame distance markers.',
        whatIsIt: 'The stationary medium reference track and trajectory guide along which the source and observer move.',
        whatDoesItDo:
          'Provides a fixed reference frame tied to the propagation medium so relative velocities v_source and v_observer can be measured.',
      },
      {
        id: 'velocity-direction-indicators',
        name: 'Source & Observer Velocity Vectors (v_s, v_o)',
        shape: 'cylinder',
        dimensions: [0.08, 1.2],
        position: [0.1, 0.85, 0],
        rotation: [0, 0, -Math.PI / 2],
        color: '#10B981',
        material: 'glow',
        label: 'Direction & Velocity Indicators',
        description:
          '3D directional velocity arrows indicating the magnitude and sign of the source velocity v_source and observer velocity v_observer.',
        whatIsIt: 'Scaled 3D vector arrows representing source and observer motion vectors.',
        whatDoesItDo:
          'Shows whether the source and observer are approaching or receding, directly governing the sign of the Doppler shift.',
      },
    ],
    equations: [
      'f_{\\text{obs}} = f_{\\text{source}}\\left(\\frac{v + v_{\\text{observer}}}{v - v_{\\text{source}}}\\right) \\quad (\\text{1D Approaching})',
      '\\lambda_{\\text{front}} = \\frac{v - v_{\\text{source}}}{f_{\\text{source}}}, \\quad \\lambda_{\\text{rear}} = \\frac{v + v_{\\text{source}}}{f_{\\text{source}}}',
      'M = \\frac{v_{\\text{source}}}{v}, \\quad \\sin\\mu = \\frac{v}{v_{\\text{source}}} = \\frac{1}{M} \\quad (M \\ge 1)',
    ],
    curiosityPrompts: [
      'Why does the shock-wave cone only appear when the source speed exceeds the speed of sound (Mach > 1)?',
      'How does moving the observer toward the source differ physically from moving the source toward the observer?',
      'What happens to the Mach cone half-angle μ as the aircraft accelerates from Mach 1.2 to Mach 2.0?',
    ],
  },

  // =========================================================================
  // 56. SEISMIC WAVES & EARTHQUAKE WAVE PROPAGATION LAB
  // =========================================================================
  seismicWavesEarthquake: {
    id: 'seismic-waves-earthquake-lab',
    title: 'Seismic Waves & Earthquake Wave Propagation Lab',
    concept: 'Earth Interior Layers, P-Wave Compression, S-Wave Liquid Core Shadow Zone & Surface Waves',
    description:
      'Interactive 3D cutaway geophysical globe featuring distinct 3D spherical shells for Earth’s crust, silicate mantle, liquid iron-nickel outer core, and solid inner core, an adjustable-depth earthquake focus (hypocenter), surface epicentre, compressional P-wave rays, shear S-wave paths blocked by the liquid outer core, surface waves, and seismograph stations.',
    whatIsIt:
      'A 3D geophysical wave-propagation laboratory illustrating how earthquakes radiate P-waves, S-waves, and surface waves from a subsurface focus through Earth’s layered interior to surface seismic stations.',
    howDoesItWork:
      'When tectonic stress ruptures rock at the subsurface Earthquake Focus (hypocenter), seismic energy radiates outward. Primary (P) waves are longitudinal compressional waves (v_P ≈ 8 km/s) that travel through both solids and liquids, refracting through the molten Outer Core. Secondary (S) waves are transverse shear waves (v_S ≈ 4.5 km/s); because liquids have zero shear modulus, S-waves cannot propagate through the liquid Outer Core, creating an S-wave shadow zone beyond ~103° from the epicentre. Surface waves travel slowest along the Crust from the Epicentre (the point on the surface directly above the focus) and cause the strongest ground shaking.',
    realLifeExample:
      'Global seismographic networks locating earthquake epicentres using the S–P arrival-time delay (Δt = t_S - t_P), and Richard Oldham / Inge Lehmann discovering Earth’s liquid outer core and solid inner core from seismic shadow zones.',
    examConnection:
      'P-waves: longitudinal/compressional, fastest, travel through solids & liquids. S-waves: transverse/shear, slower than P-waves, blocked by liquids (proving the outer core is liquid). Focus = underground rupture origin; Epicentre = surface point directly above the focus.',
    scaleNote:
      'Educational Geophysical Approximation: Layer thicknesses, focus depth, and wave speeds are scaled for clear 3D visual inspection; travel-time calculations use documented illustrative mantle-average speeds (v_P, v_S) to demonstrate S–P lag times and the liquid outer-core S-wave shadow zone.',
    simulationModel: 'predictive',
    functionalType: 'seismic-waves-earthquake-lab',
    prompt:
      'Create a 3D cutaway Earth model of seismic waves and earthquake propagation showing crust, mantle, outer core, inner core, focus, epicentre, P-waves, S-waves, surface waves, and seismic stations',
    camera: {
      position: [0.4, 2.5, 6.8],
      target: [0, 0.1, 0],
    },
    parameters: {
      focusDepthKm: {
        id: 'focusDepthKm',
        name: 'Earthquake Focus Depth (d)',
        min: 15,
        max: 600,
        step: 15,
        defaultValue: 85,
        unit: 'km',
        description:
          'Subsurface depth of the earthquake focus (hypocenter) beneath the epicentre (shallow < 70 km, intermediate 70–300 km, deep > 300 km).',
        affects: 'custom',
      },
      pWaveSpeedKms: {
        id: 'pWaveSpeedKms',
        name: 'Illustrative P-Wave Speed (v_P)',
        min: 6.0,
        max: 11.0,
        step: 0.2,
        defaultValue: 8.0,
        unit: 'km/s',
        description:
          'Average compressional P-wave speed through the interior (always faster than S-waves).',
        affects: 'custom',
      },
      sWaveSpeedKms: {
        id: 'sWaveSpeedKms',
        name: 'Illustrative S-Wave Speed (v_S)',
        min: 3.2,
        max: 6.2,
        step: 0.2,
        defaultValue: 4.5,
        unit: 'km/s',
        description:
          'Average shear S-wave speed through solid crust and mantle (cannot traverse the liquid outer core).',
        affects: 'custom',
      },
      seismicStationAngleDeg: {
        id: 'seismicStationAngleDeg',
        name: 'Selected Seismic Station Angle (θ)',
        min: 20,
        max: 160,
        step: 5,
        defaultValue: 65,
        unit: '°',
        description:
          'Epicentral angular distance θ of the primary inspection seismograph station (angles > 103° enter the S-wave shadow zone!).',
        affects: 'custom',
      },
    },
    conditions: {
      waveVisibilityMode: {
        id: 'waveVisibilityMode',
        name: 'Wave Type Visibility Filter',
        type: 'select',
        defaultValue: 'all_waves',
        options: [
          { value: 'all_waves', label: 'All Waves (P, S & Surface Waves)' },
          { value: 'p_waves_only', label: 'P-Waves Only (Compressional — Enters Core)' },
          { value: 's_waves_only', label: 'S-Waves Only (Shear — Blocked by Outer Core)' },
          { value: 'surface_waves_only', label: 'Surface Waves Only (Crustal Propagation)' },
        ],
        description: 'Isolate individual seismic wave families to compare their propagation paths and speeds.',
      },
      internalView: {
        id: 'internalView',
        name: 'Crust & Interior Cutaway View',
        type: 'boolean',
        defaultValue: true,
        description: 'Toggles the 3D cross-sectional wedge cutaway revealing the mantle, outer core, and inner core.',
      },
      cameraViewPreset: {
        id: 'cameraViewPreset',
        name: 'View Orientation Preset',
        type: 'select',
        defaultValue: 'cutaway_view',
        options: [
          { value: 'cutaway_view', label: 'Interior Cutaway Cross-Section' },
          { value: 'surface_epicentre', label: 'Epicentre & Surface Wave Focus' },
          { value: 'shadow_zone_view', label: 'Core Shadow Zone Inspection' },
        ],
        description: 'Adjusts visual emphasis between the deep interior cross-section and surface epicentral zone.',
      },
    },
    parts: [
      {
        id: 'earth-crust',
        name: "Earth's Lithospheric Crust",
        shape: 'sphere',
        dimensions: [2.35],
        position: [0, 0.1, 0],
        color: '#3B82F6',
        material: 'standard',
        label: 'Crust',
        description:
          'Outermost rocky shell of the Earth (5–70 km thick) where shallow earthquake foci originate and along which destructive surface waves travel.',
        whatIsIt: 'The thin, brittle outer silicate rock layer of the Earth.',
        whatDoesItDo:
          'Supports surface seismic stations and guides slower, high-amplitude Love and Rayleigh surface waves.',
      },
      {
        id: 'earth-mantle',
        name: 'Solid Silicate Mantle Layer',
        shape: 'sphere',
        dimensions: [2.18],
        position: [0, 0.1, 0],
        color: '#EA580C',
        material: 'standard',
        label: 'Mantle',
        description:
          'Thick solid magnesium-iron silicate shell (~2,900 km thick) capable of transmitting both compressional P-waves and shear S-waves.',
        whatIsIt: 'The massive solid rocky shell between the crust and the core-mantle boundary.',
        whatDoesItDo:
          'Transmits both P-waves and S-waves along curved paths due to increasing stiffness and density with depth.',
      },
      {
        id: 'earth-outer-core',
        name: 'Liquid Iron-Nickel Outer Core',
        shape: 'sphere',
        dimensions: [1.22],
        position: [0, 0.1, 0],
        color: '#F59E0B',
        material: 'liquid',
        label: 'Outer Core',
        description:
          'Molten metallic layer (2,890–5,150 km depth) with zero shear rigidity. Refracts P-waves inward and completely blocks transverse S-waves.',
        whatIsIt: 'The molten liquid iron-nickel shell surrounding the inner core.',
        whatDoesItDo:
          'Absorbs/blocks all shear S-waves (creating the S-wave shadow zone beyond 103°) and slows down P-waves.',
      },
      {
        id: 'earth-inner-core',
        name: 'Solid Metallic Inner Core',
        shape: 'sphere',
        dimensions: [0.55],
        position: [0, 0.1, 0],
        color: '#FEF08A',
        material: 'metal',
        label: 'Inner Core',
        description:
          'Extremely dense solid iron-nickel sphere at Earth’s center (radius ~1,220 km) solidified by immense overburden pressure.',
        whatIsIt: 'The solid metallic sphere at the very center of the Earth.',
        whatDoesItDo:
          'Speeds up and reflects deep core-traversing PKIKP P-waves, proving the central core is solid.',
      },
      {
        id: 'earthquake-focus',
        name: 'Earthquake Focus (Subsurface Hypocenter)',
        shape: 'sphere',
        dimensions: [0.16],
        position: [0, 2.12, 0.25],
        color: '#EF4444',
        material: 'glow',
        label: 'Earthquake Focus',
        description:
          'Subsurface point of initial fault rupture where stored elastic strain energy is released as radiating P-waves and S-waves.',
        whatIsIt: 'The underground origin point (hypocenter) where the earthquake rupture begins.',
        whatDoesItDo:
          'Acts as the 3D point source inside the lithosphere from which body waves (P and S) radiate in all directions.',
      },
      {
        id: 'earthquake-epicentre',
        name: 'Surface Epicentre Marker',
        shape: 'ring',
        dimensions: [0.12, 0.28],
        position: [0, 2.46, 0.25],
        rotation: [Math.PI / 2, 0, 0],
        color: '#F43F5E',
        material: 'glow',
        label: 'Epicentre',
        description:
          'Geographic location on Earth’s outer surface situated directly vertically above the subsurface earthquake focus.',
        whatIsIt: 'The point on Earth’s surface directly above the subsurface focus.',
        whatDoesItDo:
          'Marks the surface origin from which outward-spreading crustal surface waves radiate and where shaking is often strongest.',
      },
      {
        id: 'p-waves-propagation',
        name: 'Primary (P) Compressional Wave Paths',
        shape: 'torus',
        dimensions: [1.4, 0.035],
        position: [-0.7, 0.55, 0.35],
        color: '#38BDF8',
        material: 'glow',
        label: 'P-Waves',
        description:
          'Fastest seismic body waves (longitudinal push-pull compression) propagating through solid mantle and refracting through the liquid outer core.',
        whatIsIt: 'Primary compressional body waves that oscillate particles parallel to the direction of wave travel.',
        whatDoesItDo:
          'Arrives first at seismograph stations and penetrates both solid mantle and liquid outer core.',
      },
      {
        id: 's-waves-propagation',
        name: 'Secondary (S) Shear Wave Paths',
        shape: 'torus',
        dimensions: [1.2, 0.035],
        position: [0.75, 0.85, 0.35],
        color: '#A855F7',
        material: 'glow',
        label: 'S-Waves',
        description:
          'Transverse shear body waves oscillating perpendicular to travel direction; propagate through the solid mantle but terminate at the liquid outer core boundary.',
        whatIsIt: 'Secondary transverse shear waves that require a rigid solid medium to propagate.',
        whatDoesItDo:
          'Arrives after P-waves at angles < 103° and is completely blocked by the liquid outer core at angles > 103°.',
      },
      {
        id: 'surface-waves-propagation',
        name: 'Crustal Surface Waves (Love & Rayleigh)',
        shape: 'torus',
        dimensions: [2.38, 0.04],
        position: [0, 1.65, 0.4],
        color: '#10B981',
        material: 'glow',
        label: 'Surface Waves',
        description:
          'High-amplitude seismic waves guided along Earth’s outer crust from the epicentre, travelling slower than body waves.',
        whatIsIt: 'Seismic waves trapped near Earth’s surface that travel along the circumference of the crust.',
        whatDoesItDo:
          'Arrives after P and S body waves but produces the largest ground displacement and structural shaking.',
      },
      {
        id: 'seismic-stations',
        name: 'Seismograph Observation Stations',
        shape: 'cone',
        dimensions: [0.14, 0.34],
        position: [1.95, 1.25, 0.35],
        color: '#FBBF24',
        material: 'metal',
        label: 'Seismic Stations',
        description:
          'Surface seismometer observatories positioned at different epicentral angles θ to record P, S, and Surface wave arrival times.',
        whatIsIt: 'Surface geophysical monitoring stations equipped with seismometers.',
        whatDoesItDo:
          'Measures the arrival times of P, S, and surface waves so scientists can triangulate the epicentre and probe Earth’s core.',
      },
    ],
    equations: [
      '\\Delta t_{S-P} = t_S - t_P = d\\left(\\frac{1}{v_S} - \\frac{1}{v_P}\\right) \\quad (v_P > v_S > v_{\\text{surface}})',
      'v_P = \\sqrt{\\frac{K + \\frac{4}{3}\\mu}{\\rho}}, \\quad v_S = \\sqrt{\\frac{\\mu}{\\rho}} \\quad (\\mu_{\\text{liquid}} = 0 \\implies v_S = 0 \\text{ in Outer Core})',
      '\\frac{\\sin\\theta_1}{v_1} = \\frac{\\sin\\theta_2}{v_2} \\quad (\\text{Seismic Ray Refraction \\& S-Wave Shadow Zone } \\Delta > 103^\\circ)',
    ],
    curiosityPrompts: [
      'Why do S-waves disappear completely in the shadow zone beyond 103° from the epicentre while P-waves still reach the far side of Earth?',
      'How does increasing the earthquake focus depth change the distance between the focus and the epicentre?',
      'How do seismologists calculate the distance to an earthquake using the time lag Δt between P-wave and S-wave arrivals?',
    ],
  },

  // =========================================================================
  // 57. GYROSCOPE, TORQUE & ANGULAR MOMENTUM LABORATORY
  // =========================================================================
  gyroscopeTorqueAngularMomentum: {
    id: 'gyroscope-torque-angular-momentum-lab',
    title: 'Gyroscope, Torque & Angular Momentum Laboratory',
    concept: 'Rotational Inertia, Spin Angular Momentum L = Iω, Applied Torque τ = dL/dt & Precession',
    description:
      'Interactive 3D mechanical gyroscope apparatus featuring a spoked brass flywheel rotor with central hub and rim markers, stainless-steel spin axle, precision gimbal mounting ring, pivot support tower, spin axis guide, 3D Angular Momentum vector (L), Torque vector (τ), and azimuthal Precession trajectory ring.',
    whatIsIt:
      'A 3D rotational-dynamics laboratory demonstrating how a rapidly spinning flywheel generates angular momentum L = Iω and precesses orthogonally around a pivot when subjected to an external torque τ = dL/dt.',
    howDoesItWork:
      'When the flywheel rotor spins at angular speed ω_s around its axle, its rotational inertia I produces a large spin angular momentum vector L = I·ω_s directed along the spin axis (by the right-hand rule). Gravity (or an applied force on the axle at lever arm r) exerts a torque τ = r × F perpendicular to both the vertical support axis and the spin axis. Because τ = dL/dt, the change dL is horizontal and perpendicular to L, causing the axle to sweep around in a horizontal circle (gyroscopic precession) at angular rate Ω_p = τ / (L · sin θ) rather than tipping straight down. Spinning the rotor faster increases L and slows down the precession rate Ω_p; increasing torque τ speeds up precession.',
    realLifeExample:
      'Spacecraft reaction wheels and control moment gyroscopes (Hubble & ISS attitude control), inertial navigation systems in aircraft and submarines, spinning bicycle wheels, and rifled projectiles.',
    examConnection:
      'Rotational Newton’s Second Law: τ = dL/dt, where L = Iω. Precession angular speed: Ω_p = τ / (I ω_s sin θ). Faster spin speed ω_s yields a slower, more stable precession rate Ω_p.',
    scaleNote:
      'Steady-State Precession Model: Uses the standard high-spin gyroscopic approximation Ω_p = τ / (I·ω_s·sin θ), clearly distinguishing the rapid spin of the rotor ω_s about its axle from the slower azimuthal precession Ω_p of the axle about the vertical support.',
    simulationModel: 'predictive',
    functionalType: 'gyroscope-torque-angular-momentum-lab',
    prompt:
      'Create a 3D mechanical gyroscope laboratory showing rotor flywheel, axle, gimbal frame, support pivot, spin axis, torque vector, angular momentum vector, and precession path',
    camera: {
      position: [0.5, 2.8, 6.4],
      target: [0, 0.2, 0],
    },
    parameters: {
      rotorSpinSpeedRpm: {
        id: 'rotorSpinSpeedRpm',
        name: 'Rotor Spin Speed (ω_spin)',
        min: 150,
        max: 2400,
        step: 50,
        defaultValue: 1200,
        unit: 'RPM',
        description:
          'Rotational speed of the flywheel about its axle. Higher spin speed increases angular momentum L and reduces precession speed Ω_p.',
        affects: 'custom',
      },
      appliedTorqueNm: {
        id: 'appliedTorqueNm',
        name: 'Applied Gravitational Torque (τ)',
        min: 0.0,
        max: 4.0,
        step: 0.2,
        defaultValue: 1.6,
        unit: 'N·m',
        description:
          'External torque τ = r × F acting on the gyroscope axle. Setting τ = 0 N·m stops precession while the rotor keeps spinning.',
        affects: 'custom',
      },
      rotorTiltAngleDeg: {
        id: 'rotorTiltAngleDeg',
        name: 'Axle Tilt Orientation (θ)',
        min: 25,
        max: 125,
        step: 5,
        defaultValue: 75,
        unit: '°',
        description: 'Polar tilt angle θ of the gyroscope spin axis measured from the vertical support axis.',
        affects: 'custom',
      },
      rotorInertiaKgm2: {
        id: 'rotorInertiaKgm2',
        name: 'Flywheel Moment of Inertia (I)',
        min: 0.02,
        max: 0.10,
        step: 0.01,
        defaultValue: 0.04,
        unit: 'kg·m²',
        description: 'Rotational inertia I of the heavy rimmed flywheel rotor.',
        affects: 'custom',
      },
    },
    conditions: {
      showPrecessionPath: {
        id: 'showPrecessionPath',
        name: 'Precession Path Visualization',
        type: 'boolean',
        defaultValue: true,
        description: 'Displays the circular trajectory traced by the precessing spin axis.',
      },
      showAngularMomentumVector: {
        id: 'showAngularMomentumVector',
        name: 'Angular Momentum Vector (L) Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows the 3D Angular Momentum vector L = Iω aligned with the spin axis.',
      },
      showTorqueVector: {
        id: 'showTorqueVector',
        name: 'Torque Vector (τ) Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows the 3D Torque vector τ = dL/dt tangent to the precession circle.',
      },
      spinDirection: {
        id: 'spinDirection',
        name: 'Rotor Spin Handedness',
        type: 'select',
        defaultValue: 'ccw_positive',
        options: [
          { value: 'ccw_positive', label: 'Counter-Clockwise (+L Outward along Axle)' },
          { value: 'cw_negative', label: 'Clockwise (-L Inward — Reverses Precession!)' },
        ],
        description: 'Reverses rotor spin direction, inverting L and reversing the precession direction.',
      },
    },
    parts: [
      {
        id: 'gyro-rotor',
        name: 'Machined Brass Flywheel Rotor',
        shape: 'cylinder',
        dimensions: [1.15, 0.28],
        position: [1.2, 0.55, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#F59E0B',
        material: 'metal',
        label: 'Rotor',
        description:
          'Heavy rim-weighted brass flywheel with machined radial spokes and central hub designed to maximize rotational inertia I.',
        whatIsIt: 'The rapidly spinning high-inertia flywheel disc at the heart of the gyroscope.',
        whatDoesItDo:
          'Stores large rotational kinetic energy and generates spin angular momentum L = Iω along the axle.',
      },
      {
        id: 'gyro-axle',
        name: 'Precision Stainless-Steel Spin Axle',
        shape: 'cylinder',
        dimensions: [0.08, 2.6],
        position: [1.1, 0.55, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#E2E8F0',
        material: 'metal',
        label: 'Axle',
        description:
          'Rigid low-friction steel shaft connecting the pivot joint to the spinning flywheel hub and counterweight.',
        whatIsIt: 'The central mechanical shaft around which the flywheel rotates.',
        whatDoesItDo:
          'Transmits the lever-arm support force from the pivot while defining the mechanical axis of rotation.',
      },
      {
        id: 'gyro-gimbal-frame',
        name: 'Protective Gimbal Ring & Bearing Frame',
        shape: 'torus',
        dimensions: [1.35, 0.06],
        position: [1.2, 0.55, 0],
        color: '#94A3B8',
        material: 'metal',
        label: 'Gimbal/Frame',
        description:
          'Circular outer gimbal cage and precision end-bearings holding the rotor axle in alignment as the assembly precesses.',
        whatIsIt: 'The rigid structural ring and bearing housing framing the spinning rotor.',
        whatDoesItDo:
          'Supports both ends of the spinning rotor shaft while pivoting smoothly around the vertical tower.',
      },
      {
        id: 'gyro-support',
        name: 'Pedestal Support Tower & Pivot Base',
        shape: 'cylinder',
        dimensions: [0.22, 2.1],
        position: [0, -0.35, 0],
        color: '#475569',
        material: 'metal',
        label: 'Support',
        description:
          'Heavy cast-metal pedestal column and spherical pivot socket anchoring the gyroscope at the origin.',
        whatIsIt: 'The stationary vertical support column and low-friction pivot socket.',
        whatDoesItDo:
          'Provides the upward normal force at the pivot point around which gravitational torque τ = r × mg acts.',
      },
      {
        id: 'gyro-spin-axis',
        name: 'Spin Axis Alignment Line',
        shape: 'cylinder',
        dimensions: [0.025, 3.6],
        position: [1.2, 0.55, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#38BDF8',
        material: 'glow',
        label: 'Spin Axis',
        description:
          'Reference geometric axis passing through the pivot and rotor center along which spin angular velocity ω_s is directed.',
        whatIsIt: 'The instantaneous line of rotational symmetry of the spinning rotor.',
        whatDoesItDo:
          'Shows the orientation angle θ of the gyroscope and sweeps around the precession cone.',
      },
      {
        id: 'torque-vector',
        name: 'Applied Torque Vector (τ = r × F)',
        shape: 'cylinder',
        dimensions: [0.06, 1.3],
        position: [1.2, 0.55, 0.9],
        color: '#F43F5E',
        material: 'glow',
        label: 'Torque Vector',
        description:
          'Horizontal 3D vector arrow representing external torque τ = r × F = dL/dt perpendicular to both the lever arm r and gravity.',
        whatIsIt: 'The 3D vector representation of the external rotational twisting action τ.',
        whatDoesItDo:
          'Points in the instantaneous direction of dL/dt, pulling the tip of the angular momentum vector L around the precession circle.',
      },
      {
        id: 'angular-momentum-vector',
        name: 'Spin Angular Momentum Vector (L = Iω)',
        shape: 'cylinder',
        dimensions: [0.07, 1.6],
        position: [2.4, 0.75, 0],
        rotation: [0, 0, -Math.PI / 2],
        color: '#10B981',
        material: 'glow',
        label: 'Angular Momentum Vector',
        description:
          '3D vector arrow L = Iω aligned with the spin axis (right-hand rule), whose magnitude scales with rotor spin speed and inertia.',
        whatIsIt: 'The vector measure of the rotor’s rotational momentum L = Iω.',
        whatDoesItDo:
          'Chases the torque vector τ according to dL = τ dt, causing steady horizontal precession.',
      },
      {
        id: 'precession-path',
        name: 'Azimuthal Precession Trajectory Ring',
        shape: 'torus',
        dimensions: [2.2, 0.03],
        position: [0, 0.75, 0],
        rotation: [Math.PI / 2, 0, 0],
        color: '#A855F7',
        material: 'glow',
        label: 'Precession Path',
        description:
          'Horizontal circular trajectory traced by the outer tip of the gyroscope axle as it precesses around the vertical support axis.',
        whatIsIt: 'The circular path followed by the spin axis during gyroscopic precession.',
        whatDoesItDo:
          'Makes it easy to distinguish the slow azimuthal precession Ω_p of the axis from the rapid spin ω_s of the flywheel.',
      },
    ],
    equations: [
      '\\vec{\\tau} = \\frac{d\\vec{L}}{dt} = \\vec{r} \\times \\vec{F}, \\quad \\vec{L} = I\\vec{\\omega}_{\\text{spin}}',
      '\\Omega_{\\text{precession}} = \\frac{\\tau}{L\\sin\\theta} = \\frac{Mgr}{I\\omega_{\\text{spin}}}',
    ],
    curiosityPrompts: [
      'Why does a spinning gyroscope move sideways in a horizontal circle (precess) instead of falling straight down under gravity?',
      'What happens to the precession speed Ω_p when you double the flywheel spin speed ω_spin?',
      'Why does reversing the spin direction of the rotor reverse the direction of precession?',
    ],
  },

  // =========================================================================
  // 58. SIMPLE HARMONIC MOTION & COUPLED OSCILLATORS LAB
  // =========================================================================
  shmCoupledOscillators: {
    id: 'shm-coupled-oscillators-lab',
    title: 'Simple Harmonic Motion & Coupled Oscillators Lab',
    concept: "Hooke's Law F = -kx, Natural Frequency ω = √(k/m), Normal Modes & Beat Energy Transfer",
    description:
      'Interactive 3D mechanical oscillation laboratory featuring two precision sliding masses (Mass 1 & Mass 2) mounted on a low-friction linear guide frame, three dynamic helical coil springs (left wall spring k, central coupling spring k_c, right wall spring k), equilibrium reference markers, restoring force/displacement vectors, scrolling motion trails, and live kinetic/potential energy bars.',
    whatIsIt:
      'A 3D mechanical oscillator workbench for investigating both single-mass Simple Harmonic Motion (SHM) and two-mass coupled spring oscillations, normal modes, damping, and periodic energy exchange.',
    howDoesItWork:
      'By Hooke’s Law (F = -kx), a displaced mass experiences a restoring force proportional and opposite to its displacement x from equilibrium. For a single ideal undamped oscillator, the angular frequency is ω = √(k/m), giving period T = 2π√(m/k) — increasing mass m lowers frequency, while increasing spring stiffness k raises frequency. When Mass 1 and Mass 2 are connected by a coupling spring k_c, the system has two collective normal modes: an in-phase mode ω_+ = √(k/m) and an out-of-phase mode ω_- = √((k + 2k_c)/m). Displacing Mass 1 alone excites both modes simultaneously, causing rhythmic beat energy transfer back and forth between Mass 1 and Mass 2 at beat frequency f_beat = (ω_- - ω_+)/(2π). Viscous damping b gradually dissipates mechanical energy, reducing amplitude over time.',
    realLifeExample:
      'Molecular bond vibrations in diatomic and polyatomic molecules (symmetric vs antisymmetric stretching), tuned mass dampers in skyscrapers, automotive suspension springs, and coupled quartz crystal resonators.',
    examConnection:
      'Ideal SHM: ω = √(k/m), T = 2π/ω = 2π√(m/k), f = 1/T. Total mechanical energy E = K + U = ½mv² + ½kx² is constant when damping b = 0. Coupled oscillators exchange energy at the beat frequency f_beat = |f_- - f_+|.',
    scaleNote:
      'Analytical & Symplectic Coupled Solver: Evaluates exact damped normal-mode equations of motion x₁(t), x₂(t) independent of frame rate, ensuring rock-solid stability across all parameter changes.',
    simulationModel: 'predictive',
    functionalType: 'shm-coupled-oscillators-lab',
    prompt:
      'Create a 3D model of simple harmonic motion and coupled oscillators lab with two masses, helical springs, support frame, equilibrium markers, motion trails, displacement indicators, and energy visualization',
    camera: {
      position: [0, 3.0, 7.2],
      target: [0, 0.1, 0],
    },
    parameters: {
      massKg: {
        id: 'massKg',
        name: 'Oscillator Mass (m)',
        min: 0.25,
        max: 4.0,
        step: 0.25,
        defaultValue: 1.0,
        unit: 'kg',
        description:
          'Mass m of the oscillating blocks. Increasing mass while keeping stiffness k fixed reduces angular frequency ω = √(k/m).',
        affects: 'custom',
      },
      springStiffnessNm: {
        id: 'springStiffnessNm',
        name: 'Primary Spring Stiffness (k)',
        min: 4.0,
        max: 48.0,
        step: 2.0,
        defaultValue: 16.0,
        unit: 'N/m',
        description:
          'Hooke’s law stiffness k of the outer restoring springs. Increasing k while keeping mass fixed increases angular frequency ω = √(k/m).',
        affects: 'custom',
      },
      couplingStiffnessNm: {
        id: 'couplingStiffnessNm',
        name: 'Coupling Spring Stiffness (k_c)',
        min: 0.0,
        max: 24.0,
        step: 1.0,
        defaultValue: 4.0,
        unit: 'N/m',
        description:
          'Stiffness k_c of the central spring linking Mass 1 and Mass 2 (set k_c = 0 N/m for uncoupled independent motion).',
        affects: 'custom',
      },
      initialDisplacementM: {
        id: 'initialDisplacementM',
        name: 'Initial Displacement (x₁₀)',
        min: 0.2,
        max: 1.2,
        step: 0.1,
        defaultValue: 0.8,
        unit: 'm',
        description: 'Initial displacement amplitude of Mass 1 from its equilibrium rest position.',
        affects: 'custom',
      },
      initialPhaseOrVel: {
        id: 'initialPhaseOrVel',
        name: 'Mass 2 Initial State Ratio (x₂₀ / x₁₀)',
        min: -1.0,
        max: 1.0,
        step: 0.25,
        defaultValue: 0.0,
        unit: 'ratio',
        description:
          'Initial displacement ratio of Mass 2 relative to Mass 1 (0 = beat transfer, +1 = in-phase mode, -1 = out-of-phase mode).',
        affects: 'custom',
      },
      dampingCoefficient: {
        id: 'dampingCoefficient',
        name: 'Viscous Damping (b)',
        min: 0.0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.0,
        unit: 'N·s/m',
        description:
          'Damping coefficient b. When b > 0, mechanical energy dissipates and oscillation amplitude decays exponentially over time.',
        affects: 'custom',
      },
    },
    conditions: {
      oscillatorPreset: {
        id: 'oscillatorPreset',
        name: 'Oscillator Configuration Preset',
        type: 'select',
        defaultValue: 'weakly_coupled',
        options: [
          { value: 'weakly_coupled', label: 'Two Weakly Coupled Oscillators (Beat Transfer)' },
          { value: 'single_oscillator', label: 'Single Oscillator Mode (Mass 1 SHM Only)' },
          { value: 'strongly_coupled', label: 'Two Strongly Coupled Oscillators (Fast Exchange)' },
          { value: 'in_phase_normal', label: 'Symmetric In-Phase Normal Mode (ω₊)' },
          { value: 'out_of_phase_normal', label: 'Antisymmetric Out-of-Phase Normal Mode (ω₋)' },
        ],
        description:
          'Selects between a single spring-mass oscillator, weakly coupled beat exchange, strongly coupled oscillators, or pure normal modes.',
      },
      showMotionTrails: {
        id: 'showMotionTrails',
        name: 'Motion-Trail Wave Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Displays scrolling time-displacement waveform trails x₁(t) and x₂(t) behind the masses.',
      },
      showEnergyVisualization: {
        id: 'showEnergyVisualization',
        name: 'Energy & Phase Visualization',
        type: 'boolean',
        defaultValue: true,
        description: 'Displays real-time 3D Kinetic Energy (K), Potential Energy (U), and Total Energy columns.',
      },
    },
    parts: [
      {
        id: 'oscillator-mass-1',
        name: 'Oscillator Mass 1 (m₁)',
        shape: 'box',
        dimensions: [0.85, 0.85, 0.85],
        position: [-1.45, 0.0, 0],
        color: '#38BDF8',
        material: 'metal',
        label: 'Mass 1',
        description:
          'Primary anodized sliding block m₁ moving along the linear guide rail under Hooke’s law restoring forces.',
        whatIsIt: 'The primary inertial mass block m₁ in the spring-mass system.',
        whatDoesItDo:
          'Accelerates toward equilibrium according to m₁ a₁ = -k x₁ - k_c (x₁ - x₂) - b v₁.',
      },
      {
        id: 'oscillator-mass-2',
        name: 'Oscillator Mass 2 (m₂)',
        shape: 'box',
        dimensions: [0.85, 0.85, 0.85],
        position: [1.45, 0.0, 0],
        color: '#10B981',
        material: 'metal',
        label: 'Mass 2',
        description:
          'Secondary coupled sliding block m₂ that exchanges mechanical energy with Mass 1 through the coupling spring.',
        whatIsIt: 'The second coupled inertial mass block m₂ on the guide track.',
        whatDoesItDo:
          'Receives energy from Mass 1 via the coupling spring k_c, oscillating out of phase or in beats.',
      },
      {
        id: 'helical-springs',
        name: 'Helical Restoring & Coupling Springs (k, k_c)',
        shape: 'cylinder',
        dimensions: [0.28, 2.2],
        position: [0, 0.0, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#CBD5E1',
        material: 'metal',
        label: 'Springs',
        description:
          'Elastic steel helical coil springs (outer wall springs k and central coupling spring k_c) storing elastic potential energy U = ½kx².',
        whatIsIt: 'Elastic helical coils that exert linear restoring forces F = -k Δx when stretched or compressed.',
        whatDoesItDo:
          'Converts kinetic energy into elastic potential energy at turning points and transfers energy between coupled masses.',
      },
      {
        id: 'support-frame',
        name: 'Rigid Laboratory Frame & Linear Guide Rails',
        shape: 'box',
        dimensions: [7.6, 0.35, 1.4],
        position: [0, -0.65, 0],
        color: '#475569',
        material: 'metal',
        label: 'Frame/Support',
        description:
          'Heavy machined basebed with rigid left and right anchor bulkheads and twin polished guide rods.',
        whatIsIt: 'The rigid stationary mounting frame and low-friction linear guideway.',
        whatDoesItDo:
          'Anchors the outer ends of the springs and constrains the masses to 1D horizontal motion.',
      },
      {
        id: 'equilibrium-markers',
        name: 'Equilibrium Reference Lines (x = 0)',
        shape: 'cylinder',
        dimensions: [0.03, 2.2],
        position: [-1.45, 0.25, -0.55],
        color: '#F59E0B',
        material: 'glow',
        label: 'Equilibrium Markers',
        description:
          'Vertical fiducial reference markers indicating the unstretched rest positions (x₁ = 0, x₂ = 0) where net spring force is zero.',
        whatIsIt: 'Fixed reference lines marking the zero-force equilibrium positions of Mass 1 and Mass 2.',
        whatDoesItDo:
          'Allows direct visual comparison between instantaneous position x(t), equilibrium (x = 0), and maximum amplitude.',
      },
      {
        id: 'motion-trails',
        name: 'Time-Displacement Motion Trails x₁(t), x₂(t)',
        shape: 'box',
        dimensions: [3.2, 0.08, 1.8],
        position: [0, 0.05, -1.6],
        color: '#38BDF8',
        material: 'glow',
        label: 'Motion Trails',
        description:
          'Real-time scrolling sinusoidal wave traces plotting displacement x₁(t) and x₂(t) over time.',
        whatIsIt: 'Dynamic waveform traces recording the history of each oscillator’s displacement.',
        whatDoesItDo:
          'Visualizes period T, wavelength/frequency changes, beat envelopes, and exponential damping decay.',
      },
      {
        id: 'displacement-indicators',
        name: 'Displacement & Restoring Force Indicators',
        shape: 'cylinder',
        dimensions: [0.06, 1.1],
        position: [-1.45, 0.72, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#F43F5E',
        material: 'glow',
        label: 'Displacement Indicators',
        description:
          '3D vector arrows above each mass showing instantaneous displacement x(t) from equilibrium and opposing restoring force F = -kx.',
        whatIsIt: 'Dynamic vector arrows showing displacement x and restoring force direction.',
        whatDoesItDo:
          'Demonstrates that the restoring force always points back toward the equilibrium line opposite to displacement.',
      },
      {
        id: 'energy-phase-visualization',
        name: 'Mechanical Energy Columns (K, U, E_total)',
        shape: 'box',
        dimensions: [1.4, 1.3, 0.4],
        position: [0, 1.35, -1.1],
        color: '#A855F7',
        material: 'glow',
        label: 'Energy & Phase Visualization',
        description:
          'Integrated 3D gauge displaying instantaneous Kinetic Energy (K), Elastic Potential Energy (U), and Total Mechanical Energy (E_total = K + U).',
        whatIsIt: 'Real-time 3D bar indicator of kinetic, potential, and total mechanical energy.',
        whatDoesItDo:
          'Shows energy oscillating between K and U twice per cycle while E_total remains constant (undamped) or decays (damped).',
      },
    ],
    equations: [
      '\\omega_0 = \\sqrt{\\frac{k}{m}}, \\quad T = \\frac{2\\pi}{\\omega_0} = 2\\pi\\sqrt{\\frac{m}{k}}, \\quad F_{\\text{restore}} = -kx',
      '\\omega_+ = \\sqrt{\\frac{k}{m}} \\;(\\text{In-Phase}), \\quad \\omega_- = \\sqrt{\\frac{k + 2k_c}{m}} \\;(\\text{Out-of-Phase})',
      'E_{\\text{total}} = K + U = \\tfrac{1}{2}m(v_1^2 + v_2^2) + \\tfrac{1}{2}k(x_1^2 + x_2^2) + \\tfrac{1}{2}k_c(x_1 - x_2)^2',
    ],
    curiosityPrompts: [
      'Why does increasing the mass m slow down the oscillation while increasing the spring stiffness k speeds it up?',
      'How do two weakly coupled oscillators transfer 100% of their oscillation energy back and forth in beats?',
      'What is the difference between the in-phase normal mode (ω₊) and the out-of-phase normal mode (ω₋)?',
    ],
  },

  // =========================================================================
  // 59. THERMODYNAMICS: HEAT ENGINE & CARNOT CYCLE EXPLORER
  // =========================================================================
  thermodynamicsCarnotEngine: {
    id: 'thermodynamics-carnot-heat-engine',
    title: 'Thermodynamics: Heat Engine & Carnot Cycle Explorer',
    concept: 'First & Second Laws of Thermodynamics, Carnot Efficiency η = 1 - T_C/T_H & P–V Cycle',
    description:
      'Interactive 3D thermodynamic heat-engine apparatus featuring a high-temperature Hot Reservoir (T_H), a low-temperature Cold Reservoir (T_C), a cutaway working-substance cylinder and reciprocating piston, Heat-Input (Q_H) and Heat-Rejection (Q_C) energy-flow arrows, a rotating mechanical Work-Output flywheel shaft (W), and a synchronized 3D Pressure–Volume (P–V) cycle diagram.',
    whatIsIt:
      'A 3D thermodynamic heat-engine laboratory demonstrating how a cyclic engine absorbs heat Q_H from a hot reservoir, converts part of it into mechanical work W, rejects waste heat Q_C to a cold reservoir, and obeys the Carnot efficiency limit.',
    howDoesItWork:
      'A heat engine operates cyclically between a Hot Reservoir at absolute temperature T_H (in Kelvin) and a Cold Reservoir at T_C (where T_H > T_C). Across four reversible Carnot stages—(1→2) Isothermal Expansion at T_H absorbing heat Q_H, (2→3) Adiabatic Expansion cooling from T_H to T_C, (3→4) Isothermal Compression at T_C rejecting heat Q_C, and (4→1) Adiabatic Compression heating back to T_H—the working gas returns to its initial state (ΔU_cycle = 0). By the First Law of Thermodynamics, W = Q_H - Q_C. By the Second Law of Thermodynamics, some heat Q_C > 0 must always be rejected to a colder reservoir, limiting the maximum possible efficiency to the Carnot efficiency η_Carnot = 1 - T_C / T_H.',
    realLifeExample:
      'Steam turbines in thermal and nuclear power stations, internal combustion and Stirling engines, geothermal power plants, and concentrated solar thermal generators.',
    examConnection:
      'First Law for a full cycle: ΔU = 0 ⇒ W = Q_H - Q_C. Actual efficiency: η = W / Q_H = 1 - Q_C / Q_H. Maximum theoretical (Carnot) efficiency: η_Carnot = 1 - T_C / T_H (temperatures MUST be in Kelvin, with T_H > T_C). No practical engine can reach 100% efficiency.',
    scaleNote:
      'Thermodynamic Energy Visualization: Arrows represent energy transfer rates (heat input Q_H, rejected heat Q_C, and mechanical work W), not a physical fluid stored in pipes. The P–V diagram traces the exact 4-stage isothermal and adiabatic cycle path.',
    simulationModel: 'predictive',
    functionalType: 'thermodynamics-carnot-heat-engine',
    prompt:
      'Create a 3D model of a thermodynamics heat engine and Carnot cycle explorer with hot reservoir, cold reservoir, cylinder and piston, heat input and rejection arrows, work output flywheel, and P-V diagram',
    camera: {
      position: [0.2, 2.7, 7.0],
      target: [0, 0.2, 0],
    },
    parameters: {
      hotReservoirTempK: {
        id: 'hotReservoirTempK',
        name: 'Hot Reservoir Temperature (T_H)',
        min: 350,
        max: 1200,
        step: 25,
        defaultValue: 600,
        unit: 'K',
        description:
          'Absolute temperature T_H of the high-temperature heat source in Kelvin (must be greater than T_C for normal heat-engine operation).',
        affects: 'custom',
      },
      coldReservoirTempK: {
        id: 'coldReservoirTempK',
        name: 'Cold Reservoir Temperature (T_C)',
        min: 200,
        max: 600,
        step: 25,
        defaultValue: 300,
        unit: 'K',
        description:
          'Absolute temperature T_C of the low-temperature heat sink in Kelvin. Lowering T_C or raising T_H increases Carnot efficiency.',
        affects: 'custom',
      },
      heatInputQhKj: {
        id: 'heatInputQhKj',
        name: 'Heat Supplied per Cycle (Q_H)',
        min: 2.0,
        max: 20.0,
        step: 1.0,
        defaultValue: 10.0,
        unit: 'kJ',
        description:
          'Thermal energy Q_H transferred from the hot reservoir into the working gas during each cycle.',
        affects: 'custom',
      },
      cycleSpeedRpm: {
        id: 'cycleSpeedRpm',
        name: 'Cycle Animation Speed',
        min: 6,
        max: 48,
        step: 2,
        defaultValue: 18,
        unit: 'cyc/min',
        description: 'Visual speed at which the piston, flywheel, and P–V state tracer traverse the 4-stage cycle.',
        affects: 'custom',
      },
    },
    conditions: {
      engineCycleMode: {
        id: 'engineCycleMode',
        name: 'Thermodynamic Engine Model',
        type: 'select',
        defaultValue: 'ideal_carnot',
        options: [
          { value: 'ideal_carnot', label: 'Ideal Reversible Carnot Cycle (η_max = 1 - T_C/T_H)' },
          { value: 'practical_irreversible', label: 'Practical Engine with Thermal & Friction Losses' },
        ],
        description:
          'Compare the upper-limit reversible Carnot cycle against a practical irreversible heat engine with lower efficiency and higher rejected heat Q_C.',
      },
      showEnergyFlow: {
        id: 'showEnergyFlow',
        name: 'Energy-Flow Arrows Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the Q_H heat-input, Q_C heat-rejection, and W work-output energy arrows.',
      },
      showPvDiagram: {
        id: 'showPvDiagram',
        name: 'P–V Diagram Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the synchronized 3D Pressure–Volume (P–V) cycle loop and state tracer.',
      },
    },
    parts: [
      {
        id: 'hot-reservoir',
        name: 'High-Temperature Hot Reservoir (T_H)',
        shape: 'box',
        dimensions: [1.6, 1.1, 1.3],
        position: [-2.6, 1.05, 0],
        color: '#EF4444',
        material: 'glow',
        label: 'Hot Reservoir',
        description:
          'High-temperature thermal energy source maintained at absolute temperature T_H (Kelvin), supplying heat Q_H during isothermal expansion.',
        whatIsIt: 'The high-temperature thermal reservoir (heat source) at temperature T_H.',
        whatDoesItDo:
          'Transfers thermal energy Q_H into the working gas when the gas expands isothermally at T_H.',
      },
      {
        id: 'cold-reservoir',
        name: 'Low-Temperature Cold Reservoir (T_C)',
        shape: 'box',
        dimensions: [1.6, 1.1, 1.3],
        position: [-2.6, -0.85, 0],
        color: '#3B82F6',
        material: 'metal',
        label: 'Cold Reservoir',
        description:
          'Low-temperature thermal sink maintained at absolute temperature T_C (Kelvin), absorbing rejected heat Q_C during isothermal compression.',
        whatIsIt: 'The low-temperature thermal reservoir (heat sink) at temperature T_C.',
        whatDoesItDo:
          'Absorbs waste heat Q_C = Q_H - W during isothermal compression so the piston can reset to complete the cycle.',
      },
      {
        id: 'working-substance-cylinder',
        name: 'Working Substance & Cutaway Cylinder',
        shape: 'cylinder',
        dimensions: [0.82, 2.2],
        position: [-0.25, 0.1, 0],
        color: '#F59E0B',
        material: 'glass',
        opacity: 0.45,
        label: 'Working Substance/Cylinder',
        description:
          'Precision glass-walled cylinder enclosing the ideal gas working substance as it cycles through isothermal and adiabatic expansion and compression.',
        whatIsIt: 'The containment cylinder and ideal-gas working substance that undergoes the thermodynamic cycle.',
        whatDoesItDo:
          'Expands at high pressure to perform work W on the piston and compresses at lower pressure to close the cycle.',
      },
      {
        id: 'engine-piston',
        name: 'Reciprocating Engine Piston & Connecting Rod',
        shape: 'cylinder',
        dimensions: [0.76, 0.36],
        position: [-0.25, 0.55, 0],
        color: '#CBD5E1',
        material: 'metal',
        label: 'Piston',
        description:
          'Machined alloy piston head and linkage rod translating gas pressure P dV into mechanical stroke motion.',
        whatIsIt: 'The movable cylindrical boundary inside the working cylinder.',
        whatDoesItDo:
          'Transmits the net expansion work W = ∮ P dV of the working gas to the output crankshaft.',
      },
      {
        id: 'heat-input-flow',
        name: 'Heat-Input Energy Flow (Q_H)',
        shape: 'cylinder',
        dimensions: [0.09, 1.4],
        position: [-1.45, 0.85, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#F97316',
        material: 'glow',
        label: 'Heat-Input Flow',
        description:
          'Directional energy-transfer arrows illustrating thermal energy Q_H flowing from the Hot Reservoir into the working substance.',
        whatIsIt: 'Visualized energy-transfer stream representing heat input Q_H per cycle.',
        whatDoesItDo:
          'Shows thermal energy entering the engine during Stage 1→2 (Isothermal Expansion at T_H).',
      },
      {
        id: 'heat-rejection-flow',
        name: 'Heat-Rejection Energy Flow (Q_C)',
        shape: 'cylinder',
        dimensions: [0.09, 1.4],
        position: [-1.45, -0.65, 0],
        rotation: [0, 0, Math.PI / 2],
        color: '#38BDF8',
        material: 'glow',
        label: 'Heat-Rejection Flow',
        description:
          'Directional energy-transfer arrows illustrating entropy-carrying waste heat Q_C = Q_H - W rejected to the Cold Reservoir.',
        whatIsIt: 'Visualized energy-transfer stream representing rejected heat Q_C per cycle.',
        whatDoesItDo:
          'Shows unavoidable heat rejection to the cold sink during Stage 3→4 (Isothermal Compression at T_C), required by the Second Law.',
      },
      {
        id: 'work-output-shaft',
        name: 'Mechanical Work-Output Shaft & Flywheel (W)',
        shape: 'torus',
        dimensions: [0.75, 0.12],
        position: [1.35, 0.85, 0],
        color: '#10B981',
        material: 'metal',
        label: 'Work-Output Shaft',
        description:
          'Rotating mechanical flywheel, crank journal, and work-output vector arrow delivering net useful work W = Q_H - Q_C.',
        whatIsIt: 'The rotating output shaft and flywheel driven by the reciprocating piston.',
        whatDoesItDo:
          'Delivers the net mechanical work W = η · Q_H extracted from each thermodynamic cycle.',
      },
      {
        id: 'pv-diagram-display',
        name: 'Synchronized P–V Cycle Diagram',
        shape: 'box',
        dimensions: [2.1, 1.75, 0.14],
        position: [2.45, 0.05, -0.35],
        color: '#1E293B',
        material: 'standard',
        label: 'P–V Diagram',
        description:
          '3D Pressure–Volume (P–V) indicator chart displaying the two isotherms (T_H, T_C), two adiabats, enclosed work area ∮ P dV, and live cycle state tracer.',
        whatIsIt: 'An integrated Pressure vs. Volume thermodynamic state graph.',
        whatDoesItDo:
          'Plots instantaneous gas pressure P against volume V; the area enclosed by the loop equals the net work W done per cycle.',
      },
    ],
    equations: [
      'Q_H = W + Q_C \\implies W = Q_H - Q_C \\quad (\\text{First Law for Cycle})',
      '\\eta_{\\text{Carnot}} = 1 - \\frac{T_C}{T_H} \\quad (T_H, T_C \\text{ in Kelvin, } T_H > T_C)',
      '\\eta_{\\text{actual}} = \\frac{W}{Q_H} = 1 - \\frac{Q_C}{Q_H} \\le \\eta_{\\text{Carnot}} < 100\\%',
    ],
    curiosityPrompts: [
      'Why does the Second Law of Thermodynamics forbid any cyclic heat engine from converting 100% of heat Q_H into work W (why is a cold reservoir necessary)?',
      'Why must temperatures T_H and T_C be converted to absolute Kelvin when calculating Carnot efficiency η = 1 - T_C/T_H?',
      'What does the area enclosed inside the 4-stage Carnot loop on the P–V diagram physically represent?',
    ],
  },

  // =========================================================================
  // 60. PHOTOELECTRIC EFFECT & QUANTUM ENERGY EXPLORER
  // =========================================================================
  photoelectricQuantumExplorer: {
    id: 'photoelectric-effect-quantum-explorer',
    title: 'Photoelectric Effect & Quantum Energy Explorer',
    concept: "Einstein's Photon Quantum E = hf, Work Function φ, Threshold Frequency f₀ & Stopping Potential",
    description:
      'Interactive 3D quantum photoelectric apparatus featuring a tunable monochromatic light source, quantized photon wave-packets, an evacuated quartz tube with a photosensitive metal target cathode, collector anode, emitted photoelectrons (strictly gated by hf ≥ φ), external ammeter/voltmeter circuit, stopping-potential indicator, and a 3D quantum energy-level diagram.',
    whatIsIt:
      'A 3D quantum-physics laboratory demonstrating Einstein’s photoelectric effect: individual photons of energy E = hf eject electrons from a metal surface only when the photon frequency exceeds the metal’s threshold frequency (hf ≥ φ).',
    howDoesItWork:
      'Light consists of discrete energy quanta (photons) each carrying energy E_photon = hf, where h is Planck’s constant and f is light frequency. A metal binds conduction electrons with a minimum escape energy called the work function φ. In the standard one-photon photoelectric effect, if hf < φ (below threshold frequency f₀ = φ/h), NO electrons are emitted regardless of how bright (intense) the light is. When hf ≥ φ (above threshold), electrons are ejected immediately with maximum kinetic energy K_max = hf - φ. Increasing light frequency f increases K_max and the stopping potential V_stop = K_max / e; increasing light intensity at fixed frequency above threshold increases the photon flux (number of photons per second) and photoelectron emission rate (photocurrent), without changing K_max.',
    realLifeExample:
      'Solar photovoltaic cells, digital camera CMOS/CCD image sensors, night-vision photomultiplier tubes, automatic doors, and photoelectron spectroscopy (XPS).',
    examConnection:
      'Einstein’s Photoelectric Equation: E_photon = hf = hc/λ, and K_max = hf - φ = e·V_stop (for hf ≥ φ). Threshold frequency: f₀ = φ/h. Below f₀, zero emission at any intensity. Above f₀, frequency controls K_max while intensity controls photocurrent.',
    scaleNote:
      'Conceptual Quantum Visualization: Wave-packet spheres for incoming photons and emitted electrons are educational representations illustrating quantum energy packets and flux rates, not literal depictions of particles at their subatomic physical scale.',
    simulationModel: 'predictive',
    functionalType: 'photoelectric-effect-quantum-explorer',
    prompt:
      'Create a 3D model of the photoelectric effect and quantum energy explorer with light source, incoming photons, metal target cathode, emitted electrons, collector anode, circuit, energy-level diagram, and stopping-potential indicator',
    camera: {
      position: [0.1, 2.7, 7.0],
      target: [0, 0.15, 0],
    },
    parameters: {
      lightFrequencyThz: {
        id: 'lightFrequencyThz',
        name: 'Incident Light Frequency (f)',
        min: 350,
        max: 1400,
        step: 25,
        defaultValue: 750,
        unit: 'THz',
        description:
          'Frequency f of incident monochromatic light (350 THz infrared/red to 1400 THz deep UV). Determines photon energy E = hf.',
        affects: 'custom',
      },
      lightIntensityPct: {
        id: 'lightIntensityPct',
        name: 'Light Intensity (Photon Flux)',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 65,
        unit: '%',
        description:
          'Controls the number of photons arriving per second. Above threshold, higher intensity increases electron emission rate without increasing K_max.',
        affects: 'custom',
      },
      workFunctionEv: {
        id: 'workFunctionEv',
        name: 'Metal Work Function (φ)',
        min: 1.8,
        max: 5.2,
        step: 0.1,
        defaultValue: 2.1,
        unit: 'eV',
        description:
          'Minimum binding energy φ required to liberate an electron from the metal cathode (sets threshold frequency f₀ = φ/h).',
        affects: 'custom',
      },
      retardingVoltageV: {
        id: 'retardingVoltageV',
        name: 'Retarding / Stopping Potential (V_ret)',
        min: 0.0,
        max: 3.5,
        step: 0.1,
        defaultValue: 0.0,
        unit: 'V',
        description:
          'Opposing voltage applied to the collector anode. When e·V_ret exceeds K_max (V_ret ≥ V_stop), even the fastest photoelectrons are turned back.',
        affects: 'custom',
      },
    },
    conditions: {
      metalPreset: {
        id: 'metalPreset',
        name: 'Cathode Target Material Preset',
        type: 'select',
        defaultValue: 'custom',
        options: [
          { value: 'custom', label: 'Custom Work Function Slider (φ)' },
          { value: 'cesium', label: 'Cesium (Cs) — φ = 2.1 eV (f₀ = 508 THz)' },
          { value: 'sodium', label: 'Sodium (Na) — φ = 2.3 eV (f₀ = 556 THz)' },
          { value: 'zinc', label: 'Zinc (Zn) — φ = 4.3 eV (f₀ = 1040 THz UV)' },
          { value: 'platinum', label: 'Platinum (Pt) — φ = 5.1 eV (f₀ = 1233 THz Deep UV)' },
        ],
        description: 'Selects a calibrated metallic target work function φ or uses the manual slider.',
      },
      showPhotons: {
        id: 'showPhotons',
        name: 'Incoming Photon Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the incoming quantized photon wave-packets.',
      },
      showElectrons: {
        id: 'showElectrons',
        name: 'Emitted Electron Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the ejected photoelectrons when hf ≥ φ.',
      },
      showEnergyDiagram: {
        id: 'showEnergyDiagram',
        name: 'Energy-Level Diagram Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Displays the 3D quantum energy diagram comparing photon energy hf, work function φ, and K_max.',
      },
    },
    parts: [
      {
        id: 'monochromatic-light-source',
        name: 'Tunable Monochromatic Light Source',
        shape: 'cylinder',
        dimensions: [0.42, 1.2],
        position: [-2.6, 1.55, 0],
        rotation: [0, 0, -Math.PI / 4],
        color: '#8B5CF6',
        material: 'metal',
        label: 'Light Source',
        description:
          'Precision optical emitter and collimator projecting monochromatic light of frequency f and adjustable intensity onto the metal target.',
        whatIsIt: 'The tunable optical source emitting photons of frequency f.',
        whatDoesItDo:
          'Controls both photon energy E = hf (via frequency) and photon arrival rate (via intensity).',
      },
      {
        id: 'incoming-photons',
        name: 'Incoming Quantized Photon Stream (E = hf)',
        shape: 'sphere',
        dimensions: [0.14],
        position: [-1.7, 0.85, 0],
        color: '#A855F7',
        material: 'glow',
        label: 'Incoming Photons',
        description:
          'Conceptual wave-packet representations of incident photons travelling from the lamp to the cathode plate.',
        whatIsIt: 'Quantized packets of electromagnetic radiation each carrying energy E_photon = hf.',
        whatDoesItDo:
          'Transfers its entire energy hf to a single electron in the metal target upon absorption.',
      },
      {
        id: 'metal-target-cathode',
        name: 'Photosensitive Metal Target (Cathode)',
        shape: 'cylinder',
        dimensions: [0.68, 1.35],
        position: [-1.25, 0.05, 0],
        color: '#F59E0B',
        material: 'metal',
        label: 'Metal Target',
        description:
          'Curved metallic cathode plate characterized by work function φ inside an evacuated quartz phototube.',
        whatIsIt: 'The illuminated metal surface from which photoelectrons are liberated.',
        whatDoesItDo:
          'Releases photoelectrons if and only if the incident photon energy hf equals or exceeds its work function φ.',
      },
      {
        id: 'emitted-photoelectrons',
        name: 'Ejected Photoelectrons (K_max = hf - φ)',
        shape: 'sphere',
        dimensions: [0.11],
        position: [-0.05, 0.05, 0],
        color: '#38BDF8',
        material: 'glow',
        label: 'Emitted Electrons',
        description:
          'Conceptual representations of liberated photoelectrons crossing the vacuum gap toward the collector when hf ≥ φ.',
        whatIsIt: 'Electrons ejected from the metal cathode with kinetic energy up to K_max = hf - φ.',
        whatDoesItDo:
          'Travels to the collector anode to produce a measurable photocurrent unless repelled by a retarding voltage V_ret ≥ V_stop.',
      },
      {
        id: 'collector-anode',
        name: 'Collector Electrode (Anode)',
        shape: 'cylinder',
        dimensions: [0.16, 1.25],
        position: [1.15, 0.05, 0],
        color: '#CBD5E1',
        material: 'metal',
        label: 'Collector/Anode',
        description:
          'Metallic collector electrode facing the cathode inside the vacuum tube, biased at retarding potential V_ret.',
        whatIsIt: 'The receiving electrode that collects emitted photoelectrons.',
        whatDoesItDo:
          'Captures arriving photoelectrons to complete the circuit, or repels them when biased beyond the stopping potential V_stop.',
      },
      {
        id: 'external-measurement-circuit',
        name: 'External Circuit & Microammeter',
        shape: 'box',
        dimensions: [2.8, 0.45, 0.9],
        position: [-0.05, -1.05, 0],
        color: '#475569',
        material: 'metal',
        label: 'Circuit',
        description:
          'External conducting loop connecting cathode and anode through a sensitive microammeter and variable voltage supply.',
        whatIsIt: 'The external electrical measurement loop and photocurrent ammeter.',
        whatDoesItDo:
          'Measures the photoelectric current I_photo, which is proportional to light intensity when above threshold and V_ret < V_stop.',
      },
      {
        id: 'energy-level-diagram',
        name: 'Quantum Energy-Level & Threshold Reference Diagram',
        shape: 'box',
        dimensions: [1.75, 1.85, 0.14],
        position: [2.55, 0.35, -0.3],
        color: '#1E293B',
        material: 'standard',
        label: 'Energy-Level Diagram',
        description:
          '3D quantum energy comparison board showing the threshold frequency line (φ = hf₀), photon energy column (hf), work function barrier (φ), and kinetic energy (K_max).',
        whatIsIt: 'A visual energy-balance diagram comparing E_photon = hf against work function φ.',
        whatDoesItDo:
          'Clearly marks the threshold reference φ and shows why electrons are emitted only when the hf bar rises above φ.',
      },
      {
        id: 'stopping-potential-indicator',
        name: 'Stopping-Potential & Retarding Field Indicator',
        shape: 'box',
        dimensions: [1.4, 0.65, 0.5],
        position: [1.25, -0.95, 0.45],
        color: '#10B981',
        material: 'metal',
        label: 'Stopping-Potential Indicator',
        description:
          'Calibrated voltage readout and electric-field indicator comparing applied retarding potential V_ret with stopping potential V_stop = K_max / e.',
        whatIsIt: 'The potential-barrier gauge measuring stopping voltage V_stop = (hf - φ)/e.',
        whatDoesItDo:
          'Indicates the exact retarding voltage needed to stop the most energetic photoelectrons and reduce photocurrent to zero.',
      },
    ],
    equations: [
      'E_{\\text{photon}} = hf = \\frac{hc}{\\lambda}, \\quad f_0 = \\frac{\\phi}{h}',
      'K_{\\max} = hf - \\phi \\quad (\\text{when } hf \\ge \\phi; \\text{ zero emission for } hf < \\phi)',
      'e V_{\\text{stop}} = K_{\\max} = hf - \\phi \\implies V_{\\text{stop}} = \\frac{hf - \\phi}{e}',
    ],
    curiosityPrompts: [
      'Why does shining an extremely bright red light below the threshold frequency f₀ eject zero electrons, while a dim ultraviolet light above f₀ ejects electrons immediately?',
      'Why does increasing light intensity above threshold increase the photocurrent without increasing the stopping potential V_stop?',
      'How did Einstein’s photon explanation of the photoelectric effect overturn the classical wave theory of light?',
    ],
  },

  // =========================================================================
  // 61. SPECIAL RELATIVITY: TIME DILATION & LENGTH CONTRACTION LAB
  // =========================================================================
  specialRelativityTimeLength: {
    id: 'special-relativity-time-length-lab',
    title: 'Special Relativity: Time Dilation & Length Contraction Lab',
    concept: 'Inertial Reference Frames, Lorentz Factor γ = 1/√(1 - v²/c²), Time Dilation & Length Contraction',
    description:
      'Interactive 3D relativistic physics laboratory comparing a Stationary Reference Frame with a high-speed Relativistic Spacecraft carrying an onboard photon Light-Clock, featuring proper-length vs contracted-length caliper markers (L = L₀/γ along the motion axis only), velocity vector β = v/c, and a side-by-side Proper Time (Δτ) vs Coordinate Time (Δt = γΔτ) comparison display.',
    whatIsIt:
      'A 3D special-relativity comparator showing how relative motion at a significant fraction of the speed of light c produces time dilation (Δt = γΔτ) and length contraction along the direction of motion (L = L₀/γ) between inertial reference frames.',
    howDoesItWork:
      'Einstein’s postulates state that the laws of physics are identical in all inertial frames and the speed of light in vacuum c is constant for all observers. In the spacecraft’s own rest frame, a photon in a vertical light-clock bounces straight up and down over distance 2h, defining proper time Δτ = 2h/c (the astronaut aboard experiences completely normal time and uncontracted proper length L₀). Relative to the stationary laboratory frame, as the ship moves at speed v = βc, the photon follows a longer diagonal path at the same speed c, so one tick takes a longer coordinate time Δt = γ·Δτ, where γ = 1 / √(1 - v²/c²) is the Lorentz factor. Simultaneously, the spacecraft’s length measured in the stationary frame along the direction of motion contracts to L = L₀ / γ, while its height and width perpendicular to motion remain unchanged.',
    realLifeExample:
      'GPS satellite atomic clock corrections, cosmic-ray muons reaching Earth’s surface due to relativistic time dilation (γ ≈ 8.8 at v = 0.994c), and relativistic heavy-ion collisions at CERN and RHIC.',
    examConnection:
      'Lorentz factor: γ = 1 / √(1 - v²/c²). At v = 0, γ = 1 (classical limit). As v → c, γ → ∞. Time dilation: Δt = γ Δτ (moving clocks tick slower relative to the stationary frame). Length contraction: L = L₀ / γ (occurs ONLY parallel to the direction of relative motion).',
    scaleNote:
      'Relativistic Frame Separation: Visual animation speed controls the playback rate on screen and is distinct from the physical relativistic speed ratio β = v/c used to compute γ, Δt = γΔτ, and L = L₀/γ.',
    simulationModel: 'predictive',
    functionalType: 'special-relativity-time-length-lab',
    prompt:
      'Create a 3D model of special relativity time dilation and length contraction lab with moving spacecraft, stationary reference frame, onboard light clock, velocity vector, reference length markers, contracted length indicator, and time comparison visualization',
    camera: {
      position: [0.0, 2.8, 7.2],
      target: [0, 0.2, 0],
    },
    parameters: {
      velocityFractionC: {
        id: 'velocityFractionC',
        name: 'Relative Speed Ratio (β = v/c)',
        min: 0.0,
        max: 0.98,
        step: 0.02,
        defaultValue: 0.80,
        unit: 'c',
        description:
          'Relative speed v as a safe fraction of the speed of light c (0.00c to 0.98c). At v = 0.80c, Lorentz factor γ = 1.667.',
        affects: 'custom',
      },
      properLengthMeters: {
        id: 'properLengthMeters',
        name: 'Rest-Frame Proper Length (L₀)',
        min: 6.0,
        max: 20.0,
        step: 1.0,
        defaultValue: 12.0,
        unit: 'm',
        description:
          'Proper length L₀ of the spacecraft measured in its own rest frame. Measured in the stationary frame, L = L₀ / γ.',
        affects: 'custom',
      },
      properTimeIntervalNs: {
        id: 'properTimeIntervalNs',
        name: 'Proper Time Interval (Δτ)',
        min: 1.0,
        max: 20.0,
        step: 1.0,
        defaultValue: 10.0,
        unit: 'ns',
        description:
          'Reference proper time interval Δτ elapsed on the spacecraft’s onboard clock (dilated to Δt = γ·Δτ in the stationary frame).',
        affects: 'custom',
      },
      visualPlaybackSpeed: {
        id: 'visualPlaybackSpeed',
        name: 'Visual Presentation Speed',
        min: 0.25,
        max: 2.5,
        step: 0.25,
        defaultValue: 1.0,
        unit: 'x',
        description:
          'Adjusts the visual animation playback speed in the 3D viewer without altering the physical relativistic speed v/c.',
        affects: 'custom',
      },
    },
    conditions: {
      referenceFrameMode: {
        id: 'referenceFrameMode',
        name: 'Observer Inertial Reference Frame',
        type: 'select',
        defaultValue: 'stationary_lab_frame',
        options: [
          { value: 'stationary_lab_frame', label: 'Stationary Lab Frame (Ship Moves at v, Contracts to L₀/γ)' },
          { value: 'spacecraft_rest_frame', label: 'Spacecraft Rest Frame (Ship at Rest L₀, Lab Frame Moves at -v)' },
        ],
        description:
          'Switch between the Stationary Lab Frame and the Spacecraft Rest Frame to verify symmetry and proper quantities.',
      },
      comparisonFocusMode: {
        id: 'comparisonFocusMode',
        name: 'Relativistic Comparison Focus',
        type: 'select',
        defaultValue: 'both_time_and_length',
        options: [
          { value: 'both_time_and_length', label: 'Combined Time Dilation & Length Contraction' },
          { value: 'clock_comparison', label: 'Clock Comparison & Photon Light-Clock Mode' },
          { value: 'length_contraction', label: 'Length Contraction Caliper Comparison Mode' },
        ],
        description: 'Highlights either both relativistic effects together, time dilation, or length contraction.',
      },
      showLightClock: {
        id: 'showLightClock',
        name: 'Light-Clock Photon Visualization',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows the bouncing photon pulse and diagonal light-clock trajectory.',
      },
      showVelocityVector: {
        id: 'showVelocityVector',
        name: 'Velocity Vector (v/c) Visibility',
        type: 'boolean',
        defaultValue: true,
        description: 'Shows or hides the 3D relative velocity vector arrow.',
      },
    },
    parts: [
      {
        id: 'relativistic-spacecraft',
        name: 'Relativistic Test Spacecraft (L = L₀/γ along x)',
        shape: 'cylinder',
        dimensions: [0.68, 3.2],
        position: [0, 0.25, 0],
        rotation: [0, 0, -Math.PI / 2],
        color: '#E2E8F0',
        material: 'metal',
        label: 'Spacecraft',
        description:
          'Streamlined relativistic test vessel with transparent observation bay whose axial length contracts as L = L₀/γ in the stationary frame while transverse width/height stay constant.',
        whatIsIt: 'The moving relativistic test vehicle carrying the onboard light-clock.',
        whatDoesItDo:
          'Demonstrates Lorentz length contraction L = L₀/γ exclusively parallel to the direction of relative velocity.',
      },
      {
        id: 'stationary-reference-frame',
        name: 'Stationary Laboratory Reference Frame Grid',
        shape: 'box',
        dimensions: [7.6, 0.2, 2.2],
        position: [0, -1.0, 0],
        color: '#475569',
        material: 'metal',
        label: 'Stationary Reference Frame',
        description:
          'Inertial laboratory coordinate bench with synchronized reference pylons and rest-frame metric ruler.',
        whatIsIt: 'The stationary inertial observer’s coordinate system and synchronized marker posts.',
        whatDoesItDo:
          'Defines coordinate position x and coordinate time t against which the moving spacecraft is measured.',
      },
      {
        id: 'onboard-clock',
        name: 'Spacecraft Onboard Proper-Time Clock (Δτ)',
        shape: 'cylinder',
        dimensions: [0.35, 0.14],
        position: [-0.3, 0.25, 0.55],
        color: '#10B981',
        material: 'metal',
        label: 'Onboard Clock',
        description:
          'Co-moving clock assembly mounted inside the spacecraft measuring proper time Δτ in the ship’s rest frame.',
        whatIsIt: 'The clock travelling with the spacecraft that measures proper time Δτ.',
        whatDoesItDo:
          'Ticks at a normal rate for an astronaut aboard the spacecraft, while appearing slowed by factor 1/γ to the stationary observer.',
      },
      {
        id: 'light-clock-pulses',
        name: 'Photon Light-Clock Mirrors & Pulse Trajectory',
        shape: 'sphere',
        dimensions: [0.15],
        position: [0.1, 0.25, 0],
        color: '#38BDF8',
        material: 'glow',
        label: 'Light-Clock Components',
        description:
          'Upper and lower parallel mirrors inside the spacecraft with a bouncing photon pulse and diagonal stationary-frame trajectory.',
        whatIsIt: 'An Einstein photon light-clock bouncing a light pulse vertically between two mirrors.',
        whatDoesItDo:
          'Illustrates geometrically why time dilates: the diagonal photon path in the lab frame is longer than the vertical path in the ship frame, yet light travels at the same speed c in both.',
      },
      {
        id: 'velocity-vector',
        name: 'Relative Velocity Vector (v = βc)',
        shape: 'cylinder',
        dimensions: [0.07, 1.4],
        position: [1.9, 0.25, 0],
        rotation: [0, 0, -Math.PI / 2],
        color: '#F59E0B',
        material: 'glow',
        label: 'Velocity Vector',
        description:
          '3D directional arrow indicating the magnitude and axis of relative motion v = βc.',
        whatIsIt: 'The relative velocity vector v between the spacecraft and stationary reference frame.',
        whatDoesItDo:
          'Defines the unique spatial axis along which Lorentz length contraction occurs.',
      },
      {
        id: 'reference-length-markers',
        name: 'Rest-Frame Proper Length Caliper (L₀)',
        shape: 'box',
        dimensions: [3.2, 0.12, 0.12],
        position: [0, -0.62, 0.65],
        color: '#94A3B8',
        material: 'metal',
        label: 'Reference Length Markers',
        description:
          'Fixed baseline caliper bar displaying the spacecraft’s uncontracted rest-frame proper length L₀ (at v = 0, γ = 1).',
        whatIsIt: 'Reference measurement markers spanning the uncontracted proper length L₀.',
        whatDoesItDo:
          'Provides a direct side-by-side baseline against which the contracted length L = L₀/γ can be compared.',
      },
      {
        id: 'contracted-length-indicator',
        name: 'Contracted-Length Caliper Indicator (L = L₀/γ)',
        shape: 'box',
        dimensions: [2.1, 0.14, 0.14],
        position: [0, 1.12, 0],
        color: '#F43F5E',
        material: 'glow',
        label: 'Contracted-Length Indicator',
        description:
          'Dynamic caliper bridge above the spacecraft that contracts in real time according to L = L₀ / γ = L₀ √(1 - v²/c²).',
        whatIsIt: 'The active measurement bar tracking the relativistic length L in the observer’s frame.',
        whatDoesItDo:
          'Matches L₀ when v = 0 (γ = 1) and shortens progressively as v approaches the speed of light c.',
      },
      {
        id: 'time-comparison-visualization',
        name: 'Proper Time (Δτ) vs Coordinate Time (Δt) Dials',
        shape: 'box',
        dimensions: [2.4, 1.25, 0.16],
        position: [0, 1.75, -1.05],
        color: '#1E293B',
        material: 'standard',
        label: 'Time-Comparison Visualization',
        description:
          'Side-by-side relativistic clock comparator displaying Stationary Coordinate Time (Δt = γΔτ) alongside Moving Proper Time (Δτ) and Lorentz factor γ.',
        whatIsIt: 'Dual synchronized comparison dials for Coordinate Time Δt and Proper Time Δτ.',
        whatDoesItDo:
          'Shows that both clocks tick identically at v = 0 (γ = 1), while Δt accumulates γ times faster than Δτ as v increases toward c.',
      },
    ],
    equations: [
      '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}} = \\frac{1}{\\sqrt{1 - \\beta^2}} \\quad (0 \\le v < c \\implies \\gamma \\ge 1)',
      '\\Delta t = \\gamma \\Delta\\tau \\quad (\\text{Time Dilation: } \\Delta\\tau = \\text{Proper Time})',
      'L = \\frac{L_0}{\\gamma} = L_0\\sqrt{1 - \\frac{v^2}{c^2}} \\quad (\\text{Length Contraction along } \\vec{v} \\text{ only})',
    ],
    curiosityPrompts: [
      'Why does an astronaut inside the moving spacecraft feel completely normal and see their own onboard clock ticking at a normal rate?',
      'Why does length contraction only shrink the spacecraft along the direction of motion (x-axis) and not its height or width?',
      'At v = 0.80c (80% of the speed of light), what is the exact value of the Lorentz factor γ, and how long does a 12 m spacecraft appear from the stationary lab frame?',
    ],
  },
};
