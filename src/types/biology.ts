export interface OrganelleInfo {
  id: string;
  name: string;
  pronunciation?: string;
  dimensions?: string;
  function: string;
  structure: string;
  curiousFact: string;
  color: string;
}

export interface HeartStructureInfo {
  id: string;
  name: string;
  bloodType: 'oxygenated' | 'deoxygenated';
  role: string;
  pressures?: string;
  clinicalNote: string;
}

export interface DnaBasePairInfo {
  id: string;
  pairName: string;
  base1: { name: string; symbol: 'A' | 'T' | 'G' | 'C'; ringType: 'Purine' | 'Pyrimidine' };
  base2: { name: string; symbol: 'A' | 'T' | 'G' | 'C'; ringType: 'Purine' | 'Pyrimidine' };
  hydrogenBonds: number;
  bondDistance: string;
  description: string;
}
