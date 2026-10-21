export type Subject = 'physics' | 'chemistry' | 'biology';

export interface ParameterDefinition {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  description: string;
}

export interface ConditionDefinition {
  id: string;
  name: string;
  type: 'boolean' | 'select';
  defaultValue: boolean | string;
  options?: { value: string; label: string }[];
  description: string;
}

export interface CuriosityItem {
  id: string;
  prompt: string;
  description: string;
  suggestedChanges: Record<string, any>;
}

export interface SimulationDefinition {
  id: string;
  subject: Subject;
  title: string;
  subtitle: string;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  conditions: Record<string, ConditionDefinition>;
  curiosityItems: CuriosityItem[];
  equations: string[];
  initialState: Record<string, any>;
}

export interface ExperimentHistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  parameterChanged?: string;
  oldValue?: any;
  newValue?: any;
  unit?: string;
  parametersSnapshot: Record<string, any>;
  resultsSnapshot: Record<string, any>;
}

export interface PendingAiChange {
  parameter: string;
  oldValue: any;
  newValue: any;
  unit: string;
  explanation: string;
}

export interface PendingAiChangeBatch {
  userPrompt: string;
  changes: PendingAiChange[];
  summaryExplanation?: string;
}
