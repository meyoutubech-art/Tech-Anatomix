import { ScientificModelSpec } from './aiModel';

export interface DiagramLabelPin {
  id: string;
  name: string;
  componentId: string; // Matched ID in 3D model
  xPercent: number; // 0-100% on image
  yPercent: number; // 0-100% on image
  confidence: number; // 0.0 - 1.0
  isProbable?: boolean; // If confidence is borderline
  whatIsIt?: string;
  whatDoesItDo?: string;
  realLifeExample?: string;
  description?: string;
}

export interface DiagramScanResult {
  concept: string;
  subject: 'Physics' | 'Chemistry' | 'Biology';
  diagramType: string;
  educationalLevel: string;
  confidence: number;
  confidenceLabel: 'Verified match' | 'High confidence' | 'Possible identification';
  isConfident: boolean;
  userConfirmed?: boolean;
  verified3DModelId?: string | null; // key in CURATED_AI_MODELS or special scene if matched
  modelSpec?: ScientificModelSpec; // Custom dynamic 3D model generated for this diagram
  modelTitle: string;
  relationships: string[];
  labels: DiagramLabelPin[];
  whatIsIt: string;
  howDoesItWork: string;
  realLifeExample: string;
  whyExplanation: string;
  examConnection: string;
  imageUrl: string;
  activeModel?: string;
  rawAnalysis?: string;
}
