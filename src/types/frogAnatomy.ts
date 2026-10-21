export type FrogOrganId =
  | 'heart'
  | 'liver'
  | 'lungs'
  | 'stomach'
  | 'small_intestine'
  | 'large_intestine_cloaca';

export type FrogBodyWallMode = 'cutaway' | 'opaque' | 'hidden';

export interface FrogOrganInfo {
  id: FrogOrganId;
  name: string;
  scientificName: string;
  system: string;
  color: string;
  threeColorHex: number;
  location: string;
  educationalDescription: string;
  function: string;
  /**
   * Explicitly discloses procedural approximations and scientific simplifications
   * to satisfy academic integrity standards.
   */
  simplificationNotice: string;
  /**
   * Approximate relative cranial-caudal (Y) and ventral-dorsal (Z) spatial reference.
   */
  relativeCoordinates: {
    x: number;
    y: number;
    z: number;
  };
}

export interface FrogAnatomyLayerVisibility {
  bodyWall: FrogBodyWallMode;
  heart: boolean;
  liver: boolean;
  lungs: boolean;
  stomach: boolean;
  small_intestine: boolean;
  large_intestine_cloaca: boolean;
}

export type FrogRenderMode = 'default' | 'epidermis' | 'wireframe' | 'xray';
export type FrogViewPreset = 'dorsal' | 'ventral' | 'lateral' | 'cranial';

export interface FrogGlbSpecimenMetadata {
  filename: string;
  filesizeBytes: number;
  format: string;
  meshName: string;
  vertexCount: number;
  dimensionsMm: {
    widthX: number;
    heightY: number;
    depthZ: number;
  };
  hasInternalOrganMeshes: boolean;
  materialName: string;
  disclosure: string;
}

export type FrogSpecimenView = 'external' | 'internal';

export type DissectionTool = 'magnifier' | 'pins' | 'scalpel' | 'scissors' | 'forceps' | 'probe';

export interface DissectionStep {
  id: string;
  stepNumber: number;
  title: string;
  phase: string;
  tool: DissectionTool;
  toolName: string;
  instructions: string[];
  anatomicalTarget: string;
  clinicalSafetyNotes: string;
  specimenView: FrogSpecimenView;
}

