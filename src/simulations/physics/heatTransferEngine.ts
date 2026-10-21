/**
 * TECH-ANATOMIX — HEAT TRANSFER SIMULATION ENGINE
 * 
 * Scientifically consistent, parameter-dependent simulation of thermal physics:
 * 1. Solid Conduction: 1D Transient Heat Diffusion with finite difference discretization
 *    governed by Fourier's Law (dQ/dt = -k·A·dT/dx).
 * 2. Fluid Convection: Density-driven buoyant circulation loops (Boussinesq approximation,
 *    Rayleigh buoyancy drive, rising warm plume, descending cool walls).
 * 3. Electromagnetic Radiation: Non-contact infrared radiation through vacuum/space
 *    governed by the Stefan-Boltzmann Law (P = ε·σ·A·(T₁⁴ - T₂⁴)) without requiring matter.
 */

export interface HeatTransferMaterial {
  id: string;
  name: string;
  conductivity: number; // k in W/(m·K)
  density: number; // kg/m³
  specificHeat: number; // J/(kg·K)
  color: string;
  description: string;
}

export const HEAT_MATERIALS: Record<string, HeatTransferMaterial> = {
  copper: {
    id: 'copper',
    name: 'Pure Copper (Cu)',
    conductivity: 390,
    density: 8960,
    specificHeat: 385,
    color: '#B45309', // Natural warm copper bronze
    description: 'Outstanding conductor; high free-electron mobility accelerates thermal phonon transfer.',
  },
  aluminum: {
    id: 'aluminum',
    name: 'Aluminum Alloy (Al)',
    conductivity: 205,
    density: 2700,
    specificHeat: 900,
    color: '#CBD5E1', // Polished alloy silver
    description: 'High conductivity with lightweight lattice structure; widespread in heat sinks.',
  },
  steel: {
    id: 'steel',
    name: 'Structural Carbon Steel (Fe-C)',
    conductivity: 50,
    density: 7850,
    specificHeat: 490,
    color: '#94A3B8', // Structural steel grey
    description: 'Moderate conductor; iron crystal lattice and interstitial carbon scatter phonons.',
  },
  glass: {
    id: 'glass',
    name: 'Borosilicate Glass (Insulator)',
    conductivity: 1.2,
    density: 2230,
    specificHeat: 750,
    color: '#E2E8F0', // Neutral silica glass
    description: 'Thermal insulator; lack of free electrons and amorphous structure sharply impede heat flow.',
  },
};

/**
 * 1D Transient Heat Conduction State
 */
export interface ConductionState {
  nodeCount: number;
  temperatures: number[]; // Celsius at each spatial node along rod
  initialTempC: number;
  simulatedTimeSec: number;
}

export function createConductionState(nodeCount = 12, initialTempC = 20): ConductionState {
  return {
    nodeCount,
    temperatures: new Array(nodeCount).fill(initialTempC),
    initialTempC,
    simulatedTimeSec: 0,
  };
}

/**
 * Steps the 1D transient heat diffusion forward in time using semi-implicit/explicit finite differences:
 * dT_i/dt = alpha * d²T/dx² - h_loss*(T_i - T_ambient)
 * 
 * alpha = k / (rho * c_p)
 */
export function stepConduction(
  state: ConductionState,
  dt: number,
  heatSourceTempC: number,
  conductivityK: number,
  ambientTempC = 20,
  speedScale = 6.0 // Educational timescale acceleration
): ConductionState {
  const { nodeCount, temperatures } = state;
  const newTemps = [...temperatures];

  // Fixed hot boundary at node 0 in direct contact with ceramic heat source
  newTemps[0] = heatSourceTempC;

  // Normalized spatial step dx (meters equivalent across 1.0 m rod)
  const dx = 1.0 / (nodeCount - 1);
  const dx2 = dx * dx;

  // Effective thermal diffusivity scaled for intuitive interactive feedback
  // Real alpha ranges from ~1.1e-4 m²/s (copper) to ~6e-7 m²/s (glass)
  // Scaled linearly by (conductivityK / 200) * speedScale for responsive visual learning
  const alphaEff = (conductivityK / 200) * 0.08 * speedScale;
  const hLoss = 0.04 * speedScale;

  // Implicit Euler tridiagonal formulation (unconditionally stable for any dt, guaranteed monotonic)
  // -r * T_{i-1}^{n+1} + (1 + 2r + gamma) * T_i^{n+1} - r * T_{i+1}^{n+1} = T_i^n + gamma * T_amb
  const r = (alphaEff * dt) / dx2;
  const gamma = hLoss * dt;
  const gammaTip = hLoss * 1.5 * dt;

  const M = nodeCount - 1; // Unknown interior & tip nodes: indices 1 to M
  const a = new Float64Array(M);
  const b = new Float64Array(M);
  const c = new Float64Array(M);
  const d = new Float64Array(M);

  for (let k = 0; k < M - 1; k++) {
    const node = k + 1;
    a[k] = -r;
    b[k] = 1.0 + 2.0 * r + gamma;
    c[k] = -r;
    d[k] = newTemps[node] + gamma * ambientTempC;
  }
  // Boundary injection from node 0 (heat source) into first interior equation
  d[0] += r * heatSourceTempC;

  // Far tip equation (node M): convective loss to ambient air
  a[M - 1] = -r;
  b[M - 1] = 1.0 + r + gammaTip;
  c[M - 1] = 0;
  d[M - 1] = newTemps[M] + gammaTip * ambientTempC;

  // Thomas algorithm forward elimination sweep
  for (let k = 1; k < M; k++) {
    const m = a[k] / b[k - 1];
    b[k] -= m * c[k - 1];
    d[k] -= m * d[k - 1];
  }

  // Back substitution sweep
  const sol = new Float64Array(M);
  sol[M - 1] = d[M - 1] / b[M - 1];
  for (let k = M - 2; k >= 0; k--) {
    sol[k] = (d[k] - c[k] * sol[k + 1]) / b[k];
  }

  // Assign updated temperatures
  for (let k = 0; k < M; k++) {
    const node = k + 1;
    newTemps[node] = Math.max(ambientTempC, Math.min(heatSourceTempC, sol[k]));
  }

  return {
    nodeCount,
    temperatures: newTemps,
    initialTempC: state.initialTempC,
    simulatedTimeSec: state.simulatedTimeSec + dt,
  };
}

/**
 * Convective Buoyancy Calculation (Boussinesq Approximation)
 */
export interface ConvectionMetrics {
  deltaTempC: number;
  buoyancyForceNorm: number; // 0.0 to 1.0
  fluidVelocityMs: number; // Circulation speed
  risingPlumeTempC: number;
  topSurfaceTempC: number;
  sinkingReturnTempC: number;
  rayleighFactor: string; // Qualitative regime: 'Stagnant' | 'Laminar Buoyancy' | 'Vigorous Convection'
}

export function calculateConvectionMetrics(
  heatSourceTempC: number,
  ambientTempC = 20
): ConvectionMetrics {
  const deltaTempC = Math.max(0, heatSourceTempC - ambientTempC);
  const maxDelta = 480; // (500 - 20)
  const normDrive = Math.min(1.0, deltaTempC / maxDelta);

  // Velocity scales with square root of buoyancy acceleration: v ~ sqrt(g * beta * deltaT * H)
  const fluidVelocityMs = deltaTempC <= 0 ? 0 : parseFloat((0.25 * Math.sqrt(normDrive)).toFixed(3));

  // Temperature gradient around convective circulation loop
  const risingPlumeTempC = parseFloat((ambientTempC + 0.65 * deltaTempC).toFixed(1));
  const topSurfaceTempC = parseFloat((ambientTempC + 0.35 * deltaTempC).toFixed(1));
  const sinkingReturnTempC = parseFloat((ambientTempC + 0.12 * deltaTempC).toFixed(1));

  let rayleighFactor: string;
  if (deltaTempC < 5) {
    rayleighFactor = 'Stagnant / Conduction Only';
  } else if (deltaTempC < 150) {
    rayleighFactor = 'Laminar Buoyancy Loop';
  } else {
    rayleighFactor = 'Vigorous Convective Plume';
  }

  return {
    deltaTempC,
    buoyancyForceNorm: normDrive,
    fluidVelocityMs,
    risingPlumeTempC,
    topSurfaceTempC,
    sinkingReturnTempC,
    rayleighFactor,
  };
}

/**
 * Thermal Radiation State & Stefan-Boltzmann Law
 * P = epsilon * sigma * A * (T₁⁴ - T_ambient⁴)
 * sigma = 5.670374419e-8 W/(m²·K⁴)
 */
export interface RadiationMetrics {
  emitterTempK: number;
  ambientTempK: number;
  emitterPowerWatts: number;
  fluxDensityWm2: number;
  absorbedReceiverTempC: number;
  gapDistanceM: number;
  medium: string;
}

export const STEFAN_BOLTZMANN_SIGMA = 5.670374e-8; // W/(m²·K⁴)

export function calculateRadiationMetrics(
  heatSourceTempC: number,
  emissivity: number,
  simulatedTimeSec: number,
  ambientTempC = 20,
  plateAreaM2 = 0.04, // 20cm x 20cm demonstration plate
  gapDistanceM = 0.35 // 35cm empty gap
): RadiationMetrics {
  const emitterTempK = heatSourceTempC + 273.15;
  const ambientTempK = ambientTempC + 273.15;

  const eps = Math.max(0.05, Math.min(1.0, emissivity));
  // Stefan-Boltzmann net emitted flux density E = eps * sigma * (T^4 - T_amb^4)
  const netFlux = eps * STEFAN_BOLTZMANN_SIGMA * (Math.pow(emitterTempK, 4) - Math.pow(ambientTempK, 4));
  const fluxDensityWm2 = Math.max(0, netFlux);
  const emitterPowerWatts = fluxDensityWm2 * plateAreaM2;

  // View factor between parallel plates with gap d
  const viewFactor = 0.45;
  // Receiver plate thermal mass: gradual temperature rise governed by absorbed flux
  // Equilibrium temperature: T_eq^4 = T_amb^4 + viewFactor * eps * (T1^4 - T_amb^4)
  const T_eq_K = Math.pow(Math.pow(ambientTempK, 4) + viewFactor * eps * (Math.pow(emitterTempK, 4) - Math.pow(ambientTempK, 4)), 0.25);
  const T_eq_C = T_eq_K - 273.15;

  // First-order thermal time constant tau = (m * c_p) / (h_eff * A) ~ 15 seconds
  const tau = 15.0;
  const fraction = 1.0 - Math.exp(-simulatedTimeSec / tau);
  const absorbedReceiverTempC = parseFloat((ambientTempC + (T_eq_C - ambientTempC) * fraction).toFixed(1));

  return {
    emitterTempK: parseFloat(emitterTempK.toFixed(1)),
    ambientTempK: parseFloat(ambientTempK.toFixed(1)),
    emitterPowerWatts: parseFloat(emitterPowerWatts.toFixed(2)),
    fluxDensityWm2: parseFloat(fluxDensityWm2.toFixed(1)),
    absorbedReceiverTempC,
    gapDistanceM,
    medium: 'Vacuum / Transparent Air (No matter required)',
  };
}

/**
 * Restrained, scientifically consistent color palette for temperature rendering.
 * Does NOT use electric blue for cold solids (reserving blue for UI selection).
 * Transitions smoothly from neutral cool structural slate/metal to glowing thermal crimson.
 */
export function getTemperatureHexColor(tempC: number, ambientC = 20, maxC = 500): string {
  const norm = Math.max(0, Math.min(1.0, (tempC - ambientC) / Math.max(1, maxC - ambientC)));

  if (norm < 0.08) {
    // Ambient / Unheated: Neutral cool structural slate
    return '#94A3B8';
  } else if (norm < 0.25) {
    // Mild heat (30°C - 90°C): Warm amber
    return '#D97706';
  } else if (norm < 0.50) {
    // Moderate heat (90°C - 220°C): Thermal orange
    return '#EA580C';
  } else if (norm < 0.75) {
    // High heat (220°C - 380°C): Hot crimson
    return '#DC2626';
  } else {
    // Extreme heat (380°C - 500°C): Intense incandescent red-orange with incandescent highlights
    return '#EF4444';
  }
}

/**
 * Smooth RGB interpolation for shaders and materials
 */
export function getTemperatureColorRgb(tempC: number, ambientC = 20, maxC = 500): { r: number; g: number; b: number } {
  const t = Math.max(0, Math.min(1.0, (tempC - ambientC) / Math.max(1, maxC - ambientC)));

  // Keyframe color stops (Restrained thermal palette):
  // 0.0: #94a3b8 (148, 163, 184) - Cool slate alloy
  // 0.2: #d97706 (217, 119, 6)   - Amber warmth
  // 0.5: #ea580c (234, 88, 12)   - Thermal orange
  // 0.8: #dc2626 (220, 38, 38)   - Hot crimson
  // 1.0: #fde047 (253, 224, 71)  - Incandescent core

  if (t <= 0.2) {
    const f = t / 0.2;
    return {
      r: (148 + f * (217 - 148)) / 255,
      g: (163 + f * (119 - 163)) / 255,
      b: (184 + f * (6 - 184)) / 255,
    };
  } else if (t <= 0.5) {
    const f = (t - 0.2) / 0.3;
    return {
      r: (217 + f * (234 - 217)) / 255,
      g: (119 + f * (88 - 119)) / 255,
      b: (6 + f * (12 - 6)) / 255,
    };
  } else if (t <= 0.8) {
    const f = (t - 0.5) / 0.3;
    return {
      r: (234 + f * (220 - 234)) / 255,
      g: (88 + f * (38 - 88)) / 255,
      b: (12 + f * (38 - 12)) / 255,
    };
  } else {
    const f = (t - 0.8) / 0.2;
    return {
      r: (220 + f * (253 - 220)) / 255,
      g: (38 + f * (224 - 38)) / 255,
      b: (38 + f * (71 - 38)) / 255,
    };
  }
}
