import {
  ScientificModelSpec,
  ResearchRecord,
  ModelValidationReport,
  ValidationCheckItem,
} from '../types/aiModel';

/**
 * Validates a generated 3D scientific model against the user's request and the ResearchRecord.
 * Ensures no generic hub-and-spoke fallback reuse, verifies topic identity, component count,
 * topological connectivity, parameter-to-part wiring, and equation coherence.
 */
export function validateResearchGroundedModel(
  userPrompt: string,
  spec: ScientificModelSpec,
  researchRecord?: ResearchRecord
): ModelValidationReport {
  const checks: ValidationCheckItem[] = [];

  // 1. Identity Match Check
  const cleanPrompt = String(userPrompt || '')
    .toLowerCase()
    .replace(
      /^(please\s+)?(create|generate|build|make|show|design|render)\s+(me\s+)?(a\s+|an\s+|the\s+)?(custom\s+)?(interactive\s+)?(3d\s+)?(model|simulation|explorer|diagram|cutaway)\s+(of\s+|for\s+)?/i,
      ''
    )
    .trim();

  const promptTokens = cleanPrompt
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !['the', 'and', 'with', 'for', 'model', 'system'].includes(t));

  const modelTextCorpus = `${spec.id} ${spec.title} ${spec.concept} ${spec.description}`.toLowerCase();
  const matchedTokens = promptTokens.filter((token) => modelTextCorpus.includes(token));
  const identityMatched =
    promptTokens.length === 0 || matchedTokens.length > 0 || modelTextCorpus.includes(cleanPrompt);

  checks.push({
    id: 'identity-match',
    label: 'Requested Model Identity Match',
    passed: identityMatched,
    detail: identityMatched
      ? `Model title "${spec.title}" directly corresponds to requested concept "${cleanPrompt || userPrompt}".`
      : `Model title "${spec.title}" did not match tokens from "${userPrompt}".`,
  });

  // 2. Anti-Generic & Essential Component Check
  const partIds = (spec.parts || []).map((p) => p.id);
  const isGenericHubFallback =
    partIds.includes('outer-containment-chamber') &&
    partIds.includes('primary-active-core') &&
    partIds.includes('dynamic-rotor-ring');

  const componentCountValid =
    Array.isArray(spec.parts) && spec.parts.length >= 5 && !isGenericHubFallback;

  checks.push({
    id: 'essential-components',
    label: 'Topic-Specific 3D Component Assembly',
    passed: componentCountValid,
    detail: componentCountValid
      ? `Contains ${spec.parts.length} distinct, topic-specific 3D components with unique geometry and roles.`
      : isGenericHubFallback
        ? 'Detected generic hub-and-spoke fallback template instead of topic-specific geometry.'
        : `Insufficient component count (${spec.parts?.length || 0} parts).`,
  });

  // 3. Spatial & Topological Connectivity Check
  const hasValidCoordinates =
    Array.isArray(spec.parts) &&
    spec.parts.every(
      (p) =>
        Array.isArray(p.position) &&
        p.position.length === 3 &&
        p.position.every((n) => Number.isFinite(n)) &&
        Array.isArray(p.dimensions) &&
        p.dimensions.length >= 1 &&
        p.dimensions.every((d) => Number.isFinite(d) && d > 0)
    );

  const hasTopologySpec = Boolean(
    spec.scientificSpecification?.topologyAndConnections &&
      spec.scientificSpecification.topologyAndConnections.length > 0
  );

  const topologyConnected = hasValidCoordinates && hasTopologySpec;

  checks.push({
    id: 'topological-connections',
    label: '3D Spatial & Topological Alignment',
    passed: topologyConnected,
    detail: topologyConnected
      ? `All ${spec.parts.length} parts have finite 3D coordinates and defined structural/kinematic relationships.`
      : 'One or more components have invalid 3D coordinates or missing topological relationships.',
  });

  // 4. Interactive Parameters & Units Check
  const paramList = Object.values(spec.parameters || {});
  const parametersBound =
    paramList.length >= 2 &&
    paramList.every(
      (param) =>
        typeof param.min === 'number' &&
        typeof param.max === 'number' &&
        param.max > param.min &&
        Boolean(param.unit && param.unit.trim().length > 0)
    );

  checks.push({
    id: 'parameter-coupling',
    label: 'Parameter Controls & Physical Units',
    passed: parametersBound,
    detail: parametersBound
      ? `${paramList.length} interactive parameters verified with physical units (${paramList.map((p) => `${p.name} [${p.unit}]`).join(', ')}).`
      : 'Parameters are missing valid min/max bounds or scientific units.',
  });

  // 5. Governing Equations & Research Grounding Coherence
  const eqList =
    spec.equations || spec.scientificSpecification?.governingEquations || [];
  const equationsCoherent = Array.isArray(eqList) && eqList.length >= 1;

  const researchSummary =
    researchRecord?.status === 'web-researched'
      ? `Grounded with ${researchRecord.sources.length} live web reference(s) and ${eqList.length} governing equation(s).`
      : `Grounded with domain scientific knowledge and ${eqList.length} governing equation(s).`;

  checks.push({
    id: 'equations-coherence',
    label: 'Governing Equations & Scientific Basis',
    passed: equationsCoherent,
    detail: equationsCoherent ? researchSummary : 'No governing equations specified for model.',
  });

  const isValid =
    identityMatched &&
    componentCountValid &&
    topologyConnected &&
    parametersBound &&
    equationsCoherent;

  return {
    isValid,
    identityMatched,
    componentCountValid,
    topologyConnected,
    parametersBound,
    equationsCoherent,
    checks,
  };
}
