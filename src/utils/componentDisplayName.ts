import { ModelPartSpec } from '../types/aiModel';

/**
 * Canonical Shared Display-Name Resolver for VIZLAB 3D Models.
 *
 * Ensures "One Component, One Consistent Display Name" across:
 * 1. The 3D Viewer screen callout labels (`ExternalCalloutOverlay`, etc.)
 * 2. The Details / Educational Information section (`EducationalExplanationBox`)
 * 3. The Parameter Panel's component list, selectable component buttons, and selected-component headings
 * 4. Diagram split-screen views, AI assistant context, and presentation exports.
 *
 * The existing short, readable viewer label (`part.label`) is the source of truth.
 */
export function getComponentDisplayName(
  part?: Pick<ModelPartSpec, 'id' | 'name' | 'label'> | { id?: string; name?: string; label?: string; shortLabel?: string } | null
): string {
  if (!part) return '';
  if ('shortLabel' in part && typeof part.shortLabel === 'string' && part.shortLabel.trim().length > 0) {
    return part.shortLabel.trim();
  }
  if (typeof part.label === 'string' && part.label.trim().length > 0) {
    return part.label.trim();
  }
  if (typeof part.name === 'string' && part.name.trim().length > 0) {
    return part.name.trim();
  }
  return part.id || '';
}
