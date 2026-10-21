export interface CircuitParams {
  voltage: number; // Volts (1 to 24 V)
  resistance: number; // Ohms (1 to 50 Ω)
  switchClosed: boolean;
}

export interface CircuitResults {
  current: number; // Amperes (I = V/R)
  power: number; // Watts (P = V * I)
  bulbBrightnessPercent: number; // 0 to 100%
  wireState: string;
  filamentTempC: number;
}

export function calculateCircuitState(params: CircuitParams): CircuitResults {
  const { voltage, resistance, switchClosed } = params;

  if (!switchClosed) {
    return {
      current: 0,
      power: 0,
      bulbBrightnessPercent: 0,
      wireState: 'Open Circuit - Zero Current',
      filamentTempC: 22,
    };
  }

  const current = voltage / Math.max(resistance, 0.1);
  const power = voltage * current;
  
  // Normalized brightness calibrated against 12V / 10Ω (14.4W baseline)
  const brightness = Math.min(Math.round((power / 20) * 100), 100);
  const filamentTemp = Math.round(22 + 2200 * Math.pow(Math.min(power / 24, 1.2), 0.65));

  return {
    current: parseFloat(current.toFixed(2)),
    power: parseFloat(power.toFixed(2)),
    bulbBrightnessPercent: brightness,
    wireState: 'Closed Loop - Direct Current Flowing',
    filamentTempC: filamentTemp,
  };
}
