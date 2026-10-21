/**
 * Centralized AI Error Classification utility
 * Follows strict error categorization rules:
 * - 404: "AI endpoint not found"
 * - 401: "Gemini authentication failed"
 * - 403: "Gemini permission denied"
 * - 429: "Gemini rate limit reached"
 * - 500: "Internal AI server error"
 * - 502/503/504: "Gemini service temporarily unavailable"
 * - Network failure: "Network connection failed"
 */

export function classifyAiError(errOrStatus: any, defaultFallback = 'Internal AI server error'): string {
  if (typeof errOrStatus === 'number') {
    return getStatusMessage(errOrStatus, defaultFallback);
  }

  // Handle Response objects
  if (errOrStatus && typeof errOrStatus.status === 'number') {
    return getStatusMessage(errOrStatus.status, defaultFallback);
  }

  // Handle Error instances and objects
  if (errOrStatus instanceof Error || (errOrStatus && typeof errOrStatus === 'object')) {
    const msg = errOrStatus.message || '';
    const name = errOrStatus.name || '';

    // Check for HTTP status embedded in message
    const match = msg.match(/HTTP\s*(\d{3})/i) || msg.match(/status\s*(\d{3})/i);
    if (match && match[1]) {
      const code = parseInt(match[1], 10);
      return getStatusMessage(code, msg);
    }

    if (name === 'AbortError') {
      return 'AI request was cancelled.';
    }

    if (
      name === 'TypeError' ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('network')
    ) {
      return 'Network connection failed';
    }

    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      return 'AI endpoint not found';
    }
    if (
      msg.includes('401') ||
      msg.toLowerCase().includes('unauthenticated') ||
      msg.toLowerCase().includes('api key not valid')
    ) {
      return 'Gemini authentication failed';
    }
    if (msg.includes('403') || msg.toLowerCase().includes('permission denied')) {
      return 'Gemini permission denied';
    }
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
      return 'Gemini rate limit reached';
    }
    if (
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.toLowerCase().includes('unavailable')
    ) {
      return 'Gemini service temporarily unavailable';
    }
    if (msg.includes('500')) {
      return 'Internal AI server error';
    }

    if (msg) return msg;
  }

  return defaultFallback;
}

function getStatusMessage(status: number, fallback: string): string {
  switch (status) {
    case 404:
      return 'AI endpoint not found';
    case 401:
      return 'Gemini authentication failed';
    case 403:
      return 'Gemini permission denied';
    case 429:
      return 'Gemini rate limit reached';
    case 500:
      return 'Internal AI server error';
    case 502:
    case 503:
    case 504:
      return 'Gemini service temporarily unavailable';
    default:
      return `Server returned HTTP ${status}: ${fallback}`;
  }
}
