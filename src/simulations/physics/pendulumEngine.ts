export interface PendulumParams {
  length: number; // meters (0.5 to 4.0)
  mass: number; // kg (0.1 to 5.0)
  initialAngle: number; // degrees (5 to 80)
  gravity: number; // m/s^2 (9.81 Earth, 1.62 Moon, 3.72 Mars)
  damping: boolean;
  dampingCoefficient?: number;
}

export interface PendulumResults {
  period: number; // seconds
  frequency: number; // Hz
  maxSpeed: number; // m/s
  maxTension: number; // Newtons
  theoreticalSmallAnglePeriod: number; // s
}

export function calculatePendulumMetrics(params: PendulumParams): PendulumResults {
  const { length, mass, initialAngle, gravity } = params;
  const theta0Rad = (initialAngle * Math.PI) / 180;
  
  // Theoretical small angle period T0 = 2*pi*sqrt(L/g)
  const T0 = 2 * Math.PI * Math.sqrt(length / gravity);
  
  // Borda correction for large angles: T ≈ T0 * (1 + 1/16 * theta0^2 + 11/3072 * theta0^4)
  const correction = 1 + (1 / 16) * Math.pow(theta0Rad, 2) + (11 / 3072) * Math.pow(theta0Rad, 4);
  const period = T0 * correction;
  const frequency = 1 / period;
  
  // Conservation of energy: v_max = sqrt(2 * g * L * (1 - cos(theta0)))
  const maxSpeed = Math.sqrt(Math.max(0, 2 * gravity * length * (1 - Math.cos(theta0Rad))));
  
  // Tension at bottom: T_tension = mg + m*(v^2)/L = mg(3 - 2*cos(theta0))
  const maxTension = mass * gravity * (3 - 2 * Math.cos(theta0Rad));
  
  return {
    period: parseFloat(period.toFixed(2)),
    frequency: parseFloat(frequency.toFixed(2)),
    maxSpeed: parseFloat(maxSpeed.toFixed(2)),
    maxTension: parseFloat(maxTension.toFixed(2)),
    theoreticalSmallAnglePeriod: parseFloat(T0.toFixed(2)),
  };
}

export class PendulumIntegrator {
  theta: number; // radians
  omega: number; // rad/s
  length: number;
  mass: number;
  gravity: number;
  damping: boolean;
  gamma: number;

  constructor(params: PendulumParams) {
    this.theta = (params.initialAngle * Math.PI) / 180;
    this.omega = 0;
    this.length = params.length;
    this.mass = params.mass;
    this.gravity = params.gravity;
    this.damping = params.damping;
    this.gamma = params.damping ? 0.08 : 0.0;
  }

  update(dt: number) {
    // Equation: d^2 theta / dt^2 = - (g/L)*sin(theta) - gamma * omega
    const alpha = -(this.gravity / this.length) * Math.sin(this.theta) - this.gamma * this.omega;
    this.omega += alpha * dt;
    this.theta += this.omega * dt;
  }

  reset(initialAngle: number) {
    this.theta = (initialAngle * Math.PI) / 180;
    this.omega = 0;
  }

  getBobPosition(): { x: number; y: number; z: number } {
    return {
      x: this.length * Math.sin(this.theta),
      y: -this.length * Math.cos(this.theta),
      z: 0,
    };
  }
}
