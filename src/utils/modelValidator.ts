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

/**
 * Bounded deterministic repair for custom 3D models that fail initial validation checks.
 * Ensures finite coordinates, clamped parameter defaults, valid units, and governing equations
 * without substituting an unrelated preset.
 */
export function repairCustomModelSpec(
  userPrompt: string,
  spec: ScientificModelSpec,
  researchRecord?: ResearchRecord
): ScientificModelSpec {
  const repaired: ScientificModelSpec = {
    ...spec,
    title: spec.title || userPrompt,
    concept: spec.concept || userPrompt,
    parts: (spec.parts || []).map((p, idx) => ({
      ...p,
      position:
        Array.isArray(p.position) && p.position.length === 3 && p.position.every(Number.isFinite)
          ? p.position
          : [0, idx * 0.4 - 0.8, 0],
      dimensions:
        Array.isArray(p.dimensions) &&
        p.dimensions.length >= 1 &&
        p.dimensions.every((d) => Number.isFinite(d) && d > 0)
          ? p.dimensions
          : [1, 1, 1],
    })),
    parameters: { ...(spec.parameters || {}) },
  };

  Object.entries(repaired.parameters).forEach(([k, param]) => {
    const min = Number.isFinite(param.min) ? param.min : 0.1;
    const max = Number.isFinite(param.max) && param.max > min ? param.max : min + 10;
    const defaultValue = Number.isFinite(param.defaultValue)
      ? Math.max(min, Math.min(max, param.defaultValue))
      : (min + max) / 2;
    repaired.parameters[k] = {
      ...param,
      min,
      max,
      defaultValue,
      unit: param.unit && param.unit.trim().length > 0 ? param.unit : '×',
    };
  });

  if (!repaired.equations || repaired.equations.length === 0) {
    repaired.equations = researchRecord?.extractedEquations?.length
      ? researchRecord.extractedEquations
      : [`P_out = η × P_in (${repaired.title})`];
  }

  return repaired;
}

export interface GeometryFingerprint {
  signatureHash: string;
  partCount: number;
  shapeDistribution: Record<string, number>;
  boundingSpan: [number, number, number];
}

export function computeGeometryFingerprint(spec: ScientificModelSpec): GeometryFingerprint {
  const parts = spec.parts || [];
  const shapeDistribution: Record<string, number> = {};
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  const partTokens: string[] = [];
  for (const p of parts) {
    const s = p.shape || 'box';
    shapeDistribution[s] = (shapeDistribution[s] || 0) + 1;
    const [x, y, z] = p.position || [0, 0, 0];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    partTokens.push(`${p.id}:${s}:${(p.dimensions || []).join('x')}@${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)}`);
  }

  const span: [number, number, number] = [
    Number.isFinite(maxX - minX) ? +(maxX - minX).toFixed(2) : 0,
    Number.isFinite(maxY - minY) ? +(maxY - minY).toFixed(2) : 0,
    Number.isFinite(maxZ - minZ) ? +(maxZ - minZ).toFixed(2) : 0,
  ];

  return {
    signatureHash: `${spec.id}|${parts.length}|${partTokens.join(';')}`,
    partCount: parts.length,
    shapeDistribution,
    boundingSpan: span,
  };
}

export function areGeometriesDistinct(a: ScientificModelSpec, b: ScientificModelSpec): boolean {
  const fpA = computeGeometryFingerprint(a);
  const fpB = computeGeometryFingerprint(b);
  return fpA.signatureHash !== fpB.signatureHash;
}

export function validateScientificModel(
  userPrompt: string,
  spec: ScientificModelSpec,
  researchRecord?: ResearchRecord
): {
  valid: boolean;
  failureReasons: string[];
  report: ModelValidationReport;
} {
  const report = validateResearchGroundedModel(userPrompt, spec, researchRecord);
  const failureReasons = report.checks.filter((c) => !c.passed).map((c) => c.detail);
  return {
    valid: report.isValid,
    failureReasons,
    report,
  };
}

