export interface ProjectileParams {
  velocity: number; // m/s (5 to 50)
  angle: number; // degrees (5 to 85)
  mass: number; // kg (0.1 to 10)
  gravity: number; // m/s^2 (e.g. 9.81 Earth, 1.62 Moon, 3.72 Mars)
  launchHeight: number; // m (0 to 20)
  airResistance: boolean;
  windSpeed: number; // m/s (-10 to 10)
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  t: number;
  vx: number;
  vy: number;
}

export interface ProjectileResults {
  flightTime: number; // s
  maxHeight: number; // m
  range: number; // m
  impactVelocity: number; // m/s
  kineticEnergyInitial: number; // J
  trajectory: TrajectoryPoint[];
}

export function calculateProjectileMotion(params: ProjectileParams): ProjectileResults {
  const { velocity, angle, mass, gravity, launchHeight, airResistance, windSpeed } = params;
  
  const rad = (angle * Math.PI) / 180;
  let vx = velocity * Math.cos(rad);
  let vy = velocity * Math.sin(rad);
  let vz = 0; // along z, wind could push along z or x
  
  let x = 0;
  let y = launchHeight;
  let z = 0;
  let t = 0;
  
  const dt = 0.01; // fine time step
  const trajectory: TrajectoryPoint[] = [{ x, y, z, t, vx, vy }];
  
  // Drag parameters for a spherical projectile
  // F_drag = 0.5 * C_d * rho * A * v^2
  const Cd = 0.47; // sphere
  const rho = 1.225; // kg/m^3 air density at sea level
  const radius = Math.cbrt((3 * mass) / (4 * Math.PI * 2700)); // aluminum density ~2700 kg/m^3
  const A = Math.PI * radius * radius;
  const k = airResistance ? (0.5 * Cd * rho * A) / mass : 0;
  
  let maxHeight = y;
  
  while (y >= 0 && t < 30) { // cap at 30 seconds
    const vrelX = vx - (airResistance ? windSpeed : 0);
    const vrelY = vy;
    const vrelZ = vz;
    const vrel = Math.hypot(vrelX, vrelY, vrelZ);
    
    // Accelerations
    const ax = -k * vrel * vrelX;
    const ay = -gravity - k * vrel * vrelY;
    const az = -k * vrel * vrelZ;
    
    // Euler-Cromer update
    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;
    
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
    t += dt;
    
    if (y > maxHeight) {
      maxHeight = y;
    }
    
    if (y >= 0) {
      trajectory.push({ x, y, z, t, vx, vy });
    }
  }
  
  // Interpolate last impact ground position
  const last = trajectory[trajectory.length - 1] || { x: 0, y: 0, z: 0, t: 0, vx, vy };
  const impactVelocity = Math.hypot(vx, vy, vz);
  const kineticEnergyInitial = 0.5 * mass * velocity * velocity;
  
  return {
    flightTime: parseFloat(t.toFixed(2)),
    maxHeight: parseFloat(maxHeight.toFixed(2)),
    range: parseFloat(x.toFixed(2)),
    impactVelocity: parseFloat(impactVelocity.toFixed(2)),
    kineticEnergyInitial: parseFloat(kineticEnergyInitial.toFixed(2)),
    trajectory,
  };
}
