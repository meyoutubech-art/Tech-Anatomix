/**
 * TECH-ANATOMIX — ELECTRIC BELL SIMULATION ENGINE
 * 
 * Scientifically consistent electromechanical simulation of an electric bell with
 * an interrupter make-and-break circuit.
 * 
 * 9-Step Coordinated Cycle:
 * 1. Switch closes circuit
 * 2. Current flows through the coil
 * 3. Electromagnet attracts armature
 * 4. Striker moves toward and strikes gong
 * 5. Movement changes contact state and interrupts circuit
 * 6. Electromagnet loses attracting force
 * 7. Spring returns armature
 * 8. Contact is restored
 * 9. Cycle repeats while switch remains on
 */

export type BellCycleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface BellSimulationParams {
  operatingVoltage: number;    // V (3 to 24 V, default 12)
  springTension: number;       // N/m (100 to 800 N/m, default 380)
  bellRingingSpeed: number;    // Hz target rate (5 to 30 Hz, default 15)
  switchClosed: boolean;       // Master circuit switch
}

export interface BellSimulationState {
  // Mechanical state
  armatureAngle: number;       // radians: 0 = resting against contact screw, positive = deflected towards magnet/gong
  armatureVelocity: number;    // rad/s
  springDeformation: number;   // normalized 0..1 (0 at rest, 1 at full deflection)
  maxDeflection: number;       // maximum travel limit (rad, e.g. 0.16)
  contactBreakAngle: number;   // angle at which contact opens (rad, e.g. 0.035)
  strikeAngle: number;         // angle at which hammer contacts gong (rad, e.g. 0.14)
  
  // Electrical & Magnetic state
  switchClosed: boolean;
  contactClosed: boolean;      // true if armatureAngle <= contactBreakAngle
  circuitClosed: boolean;      // switchClosed && contactClosed
  circuitCurrent: number;      // Amperes
  electromagnetActive: boolean;// true when current > 0
  magneticFlux: number;        // Tesla approximation
  magneticForce: number;       // Newtons
  springRestoringForce: number;// Newtons
  
  // Visual Feedback & Counters
  sparkIntensity: number;      // 0..1 spark flash at contact separation
  gongStruck: boolean;         // true during impact frame
  gongVibration: number;       // 0..1 decaying acoustic ripple
  strikeCount: number;         // number of gong rings
  cycleCount: number;          // number of complete make-and-break cycles
  estimatedFrequency: number;  // calculated live frequency in Hz
  
  // Coordinated cycle phase
  currentStep: BellCycleStep;
  stepDescription: string;
  stepTitle: string;
  simTime: number;
}

export const CYCLE_STEP_DESCRIPTIONS: Record<BellCycleStep, { title: string; desc: string }> = {
  1: {
    title: 'Switch Closes Circuit',
    desc: 'The master control switch completes the primary circuit path from the DC power source.',
  },
  2: {
    title: 'Current Flows Through Coils',
    desc: 'Electric current flows through dual insulated copper bobbins around high-permeability soft iron cores.',
  },
  3: {
    title: 'Electromagnet Attracts Armature',
    desc: 'Concentrated magnetic flux exerts strong attractive Lorentz-Maxwell force on the soft-iron armature.',
  },
  4: {
    title: 'Striker Moves & Strikes Gong',
    desc: 'The armature swings forward, carrying the brass hammer clapper into resonant acoustic impact with the bronze gong.',
  },
  5: {
    title: 'Interrupter Contact Breaks',
    desc: 'Armature movement pulls the flexible contact leaf away from the adjustable screw, interrupting current.',
  },
  6: {
    title: 'Electromagnet De-energizes',
    desc: 'With circuit broken (I = 0), the low-retentivity soft-iron core rapidly demagnetizes and loses attractive force.',
  },
  7: {
    title: 'Return Spring Restores Armature',
    desc: 'The elastic restoring force of the phosphor bronze leaf spring pulls the armature back toward its resting position.',
  },
  8: {
    title: 'Contact Restored with Screw',
    desc: 'The contact rivet re-touches the contact breaker screw, re-establishing electrical continuity.',
  },
  9: {
    title: 'Cycle Repeats While Switch On',
    desc: 'Because the master switch remains closed, the self-interrupting cycle immediately restarts.',
  },
};

/**
 * Creates a clean resting state for the electric bell simulation.
 */
export function createElectricBellState(initialSwitchClosed: boolean = true): BellSimulationState {
  const contactBreakAngle = 0.032;
  const strikeAngle = 0.145;
  const maxDeflection = 0.160;

  return {
    armatureAngle: 0.0,
    armatureVelocity: 0.0,
    springDeformation: 0.0,
    maxDeflection,
    contactBreakAngle,
    strikeAngle,
    switchClosed: initialSwitchClosed,
    contactClosed: true,
    circuitClosed: initialSwitchClosed,
    circuitCurrent: initialSwitchClosed ? 3.0 : 0.0,
    electromagnetActive: initialSwitchClosed,
    magneticFlux: initialSwitchClosed ? 0.85 : 0.0,
    magneticForce: initialSwitchClosed ? 4.2 : 0.0,
    springRestoringForce: 0.0,
    sparkIntensity: 0.0,
    gongStruck: false,
    gongVibration: 0.0,
    strikeCount: 0,
    cycleCount: 0,
    estimatedFrequency: 15.0,
    currentStep: initialSwitchClosed ? 2 : 1,
    stepTitle: initialSwitchClosed ? CYCLE_STEP_DESCRIPTIONS[2].title : CYCLE_STEP_DESCRIPTIONS[1].title,
    stepDescription: initialSwitchClosed ? CYCLE_STEP_DESCRIPTIONS[2].desc : CYCLE_STEP_DESCRIPTIONS[1].desc,
    simTime: 0.0,
  };
}

/**
 * Advances the electromechanical state of the electric bell by dt seconds.
 * Implements deterministic physics with exact contact make-and-break logic.
 */
export function stepElectricBell(
  state: BellSimulationState,
  params: BellSimulationParams,
  dt: number
): BellSimulationState {
  // Cap dt to prevent numerical instability during frame hiccups
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.033);
  
  // Clone state for pure update
  const next: BellSimulationState = { ...state };
  next.simTime += clampedDt;
  next.switchClosed = params.switchClosed;

  // Electrical parameters
  const coilResistance = 4.0; // Ohms (internal coil winding resistance)
  const maxCurrent = params.operatingVoltage / coilResistance; // Amperes (e.g. 12V / 4 = 3A)
  
  // Mechanical constants
  const armatureMass = 0.045; // kg
  const armLength = 0.18; // m
  const momentOfInertia = (1 / 3) * armatureMass * armLength * armLength; // J = 1/3 * m * L^2 ≈ 0.000486 kg*m^2
  
  // Effective rotational spring stiffness (from linear springTension N/m)
  const rotationalStiffness = (params.springTension * 0.00085) * (params.bellRingingSpeed / 15);
  const dampingCoefficient = 0.00075; // Air and internal friction

  // 1. Interrupter Contact State
  // Contact closes when armature is near resting position (touching the contact screw)
  const isContactClosed = next.armatureAngle <= next.contactBreakAngle;
  next.contactClosed = isContactClosed;

  // 2. Circuit Continuity
  // Current only flows if BOTH master switch AND interrupter contact screw are closed
  next.circuitClosed = next.switchClosed && next.contactClosed;

  // 3. Electrical & Magnetic Fields
  if (next.circuitClosed) {
    // Current flows through coils
    next.circuitCurrent = maxCurrent;
    next.electromagnetActive = true;
    
    // Magnetic B-field in soft-iron cores B = mu * N * I
    next.magneticFlux = Math.min(1.6, (maxCurrent / 3.0) * 0.95);
    
    // Magnetic attractive force: F_mag ~ B^2 * A / (2 * mu0)
    // Decreases with air gap squared, but gap closes as armature moves forward:
    const gap = Math.max(0.002, (next.maxDeflection - next.armatureAngle) * 0.1);
    const pullScale = (params.operatingVoltage / 12) * (params.bellRingingSpeed / 15);
    next.magneticForce = (4.5 * pullScale) / Math.pow(1.0 + gap * 15, 1.2);
  } else {
    // Current broken: soft iron loses magnetism rapidly
    next.circuitCurrent = 0.0;
    next.electromagnetActive = false;
    next.magneticFlux = 0.0;
    next.magneticForce = 0.0;
  }

  // 4. Forces & Torques
  // Magnetic torque pulls armature forward (positive angle)
  const magneticTorque = next.electromagnetActive ? next.magneticForce * 0.08 : 0.0;
  
  // Spring restoring torque pulls armature backward toward rest (theta = 0)
  const springTorque = -rotationalStiffness * next.armatureAngle;
  next.springRestoringForce = Math.abs(springTorque / 0.08);

  // Damping torque
  const dampingTorque = -dampingCoefficient * next.armatureVelocity;

  // Net angular acceleration alpha = tau / J
  const netTorque = magneticTorque + springTorque + dampingTorque;
  const angularAcceleration = netTorque / momentOfInertia;

  // 5. Numerical Integration (Semi-implicit Euler)
  const prevAngle = next.armatureAngle;
  next.armatureVelocity += angularAcceleration * clampedDt;
  next.armatureAngle += next.armatureVelocity * clampedDt;

  // 6. Mechanical Boundary Conditions & Impacts
  next.gongStruck = false;

  // Contact Screw Rest Stop (Theta <= 0)
  if (next.armatureAngle <= 0.0) {
    next.armatureAngle = 0.0;
    if (next.armatureVelocity < 0.0) {
      // Inelastic rebound against contact screw
      next.armatureVelocity = -next.armatureVelocity * 0.25;
    }
  }

  // Gong / Pole Piece Forward Strike Limit (Theta >= strikeAngle)
  if (next.armatureAngle >= next.strikeAngle) {
    if (prevAngle < next.strikeAngle && next.armatureVelocity > 0.0) {
      // Clapper hammer strikes the gong dome!
      next.gongStruck = true;
      next.strikeCount += 1;
      next.gongVibration = 1.0;
    }
    
    // Constrain travel to prevent impossible mesh penetration
    if (next.armatureAngle > next.maxDeflection) {
      next.armatureAngle = next.maxDeflection;
    }
    // Elastic rebound off the resonant bronze gong
    if (next.armatureVelocity > 0.0) {
      next.armatureVelocity = -next.armatureVelocity * 0.35;
    }
  }

  // 7. Spark Dynamics at Contact Break
  // A transient spark occurs right as the contact breaks inductive current
  const wasContactClosed = prevAngle <= next.contactBreakAngle;
  const isNowContactOpen = next.armatureAngle > next.contactBreakAngle;
  if (next.switchClosed && wasContactClosed && isNowContactOpen) {
    next.sparkIntensity = 1.0;
  } else {
    // Rapidly decay spark
    next.sparkIntensity = Math.max(0.0, next.sparkIntensity - clampedDt * 18.0);
  }

  // Decay gong acoustic vibration
  next.gongVibration = Math.max(0.0, next.gongVibration - clampedDt * 8.0);

  // Spring deformation normalized
  next.springDeformation = Math.min(1.0, Math.max(0.0, next.armatureAngle / next.strikeAngle));

  // 8. Coordinated 9-Step State Machine Detection
  if (!next.switchClosed) {
    // Switch is OFF
    next.currentStep = 1;
  } else if (!next.contactClosed && next.armatureVelocity < -0.05) {
    // Armature is returning under spring action
    next.currentStep = 7;
  } else if (!next.contactClosed && !next.electromagnetActive && next.armatureAngle >= next.strikeAngle * 0.9) {
    // At gong strike or just bounced
    if (next.gongStruck || next.gongVibration > 0.6) {
      next.currentStep = 4;
    } else {
      next.currentStep = 6;
    }
  } else if (!next.contactClosed && prevAngle <= next.contactBreakAngle) {
    // Contact just broke
    next.currentStep = 5;
  } else if (next.contactClosed && next.electromagnetActive && next.armatureVelocity > 0.1) {
    // Armature advancing under attraction
    next.currentStep = 3;
  } else if (next.contactClosed && next.electromagnetActive) {
    // Current flowing, initiating pull
    next.currentStep = 2;
  } else if (next.contactClosed && prevAngle > next.contactBreakAngle) {
    // Contact restored
    next.currentStep = 8;
  } else {
    next.currentStep = 9;
  }

  next.stepTitle = CYCLE_STEP_DESCRIPTIONS[next.currentStep].title;
  next.stepDescription = CYCLE_STEP_DESCRIPTIONS[next.currentStep].desc;

  // Track frequency
  next.estimatedFrequency = Number(
    Math.min(30, Math.max(5, params.bellRingingSpeed * Math.sqrt(params.operatingVoltage / 12))).toFixed(1)
  );

  return next;
}

// Aliases for compatibility
export type ElectricBellState = BellSimulationState;
export type ElectricBellParams = BellSimulationParams;
export type BellCyclePhase = BellCycleStep;
export const createInitialBellState = createElectricBellState;

