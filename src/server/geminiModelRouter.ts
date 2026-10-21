import { GoogleGenAI } from '@google/genai';

export type AiCapability =
  | 'structured_3d_model'
  | 'multimodal_diagram'
  | 'parameter_interpretation'
  | 'educational_explanation'
  | 'chat_assistant';

export interface ModelCandidateConfig {
  id: string;
  displayName: string;
  priority: number; // 1 is highest priority
  supportedCapabilities: AiCapability[];
  maxTokens?: number;
}

export interface ModelRuntimeStatus {
  id: string;
  displayName: string;
  priority: number;
  supportedCapabilities: AiCapability[];
  status: 'active' | 'available' | 'cooldown' | 'unsupported';
  failureCount: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastFailureReason: string | null;
  cooldownUntil: number | null;
}

// Centralized candidate model configuration
// Verified active Gemini models matching current API availability and guidelines
export const CANDIDATE_GEMINI_MODELS: ModelCandidateConfig[] = [
  {
    id: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite (High Reliability & Ultra Fast)',
    priority: 1,
    supportedCapabilities: [
      'structured_3d_model',
      'multimodal_diagram',
      'parameter_interpretation',
      'educational_explanation',
      'chat_assistant',
    ],
  },
  {
    id: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash (High Performance Science Engine)',
    priority: 2,
    supportedCapabilities: [
      'structured_3d_model',
      'multimodal_diagram',
      'parameter_interpretation',
      'educational_explanation',
      'chat_assistant',
    ],
  },
  {
    id: 'gemini-flash-lite-latest',
    displayName: 'Gemini Flash Lite Latest (Adaptive Alias)',
    priority: 3,
    supportedCapabilities: [
      'structured_3d_model',
      'multimodal_diagram',
      'parameter_interpretation',
      'educational_explanation',
      'chat_assistant',
    ],
  },
  {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash (Comprehensive STEM Reasoning)',
    priority: 4,
    supportedCapabilities: [
      'structured_3d_model',
      'multimodal_diagram',
      'parameter_interpretation',
      'educational_explanation',
      'chat_assistant',
    ],
  },
  {
    id: 'gemini-flash-latest',
    displayName: 'Gemini Flash Latest (Official Fallback Alias)',
    priority: 5,
    supportedCapabilities: [
      'structured_3d_model',
      'multimodal_diagram',
      'parameter_interpretation',
      'educational_explanation',
      'chat_assistant',
    ],
  },
];

export class GeminiModelRouter {
  private runtimeStatus: Map<string, ModelRuntimeStatus> = new Map();
  private activeModelByCapability: Map<AiCapability, string> = new Map();
  private lastErrorByCapability: Map<AiCapability, string> = new Map();
  private aiInstance: GoogleGenAI | null = null;
  private cooldownDurationMs = 60000; // 60 seconds cooldown for 503/429
  private unsupportedDurationMs = 300000; // 5 minutes for unsupported/404

  constructor(ai: GoogleGenAI | null) {
    this.aiInstance = ai;
    this.initializeStatus();
  }

  public setAiInstance(ai: GoogleGenAI | null) {
    this.aiInstance = ai;
  }

  private initializeStatus() {
    CANDIDATE_GEMINI_MODELS.forEach((model) => {
      this.runtimeStatus.set(model.id, {
        id: model.id,
        displayName: model.displayName,
        priority: model.priority,
        supportedCapabilities: [...model.supportedCapabilities],
        status: model.priority === 1 ? 'active' : 'available',
        failureCount: 0,
        lastSuccessAt: null,
        lastFailureAt: null,
        lastFailureReason: null,
        cooldownUntil: null,
      });

      // Initially assign top priority model to all capabilities
      model.supportedCapabilities.forEach((cap) => {
        if (!this.activeModelByCapability.has(cap)) {
          this.activeModelByCapability.set(cap, model.id);
        }
      });
    });
  }

  /**
   * Returns current active models and candidate health status
   */
  public getStatus() {
    const now = Date.now();
    const candidateList = CANDIDATE_GEMINI_MODELS.map((config) => {
      const status = this.runtimeStatus.get(config.id);
      let effectiveStatus = status?.status || 'available';

      // Check if cooldown has expired
      if (status?.cooldownUntil && now >= status.cooldownUntil) {
        effectiveStatus = 'available';
      }

      return {
        id: config.id,
        displayName: config.displayName,
        priority: config.priority,
        status: effectiveStatus,
        failureCount: status?.failureCount || 0,
        lastSuccessAt: status?.lastSuccessAt,
        lastFailureReason: status?.lastFailureReason,
      };
    });

    const activeModels: Record<string, string> = {};
    this.activeModelByCapability.forEach((modelId, cap) => {
      activeModels[cap] = modelId;
    });

    return {
      activeModels,
      primaryModel: this.activeModelByCapability.get('structured_3d_model') || 'gemini-3.1-flash-lite',
      candidates: candidateList,
    };
  }

  /**
   * Returns the last recorded error reason for a given capability or generally
   */
  public getLastError(capability?: AiCapability): string | null {
    if (capability) {
      return this.lastErrorByCapability.get(capability) || null;
    }
    const errors = Array.from(this.lastErrorByCapability.values());
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }

  /**
   * Retrieves ordered candidate models for a given capability, prioritizing
   * the currently active working model followed by priority order.
   */
  public getCandidatesForCapability(capability: AiCapability): ModelCandidateConfig[] {
    const now = Date.now();
    const activeModelId = this.activeModelByCapability.get(capability);

    // Filter to models supporting this specific capability
    const compatible = CANDIDATE_GEMINI_MODELS.filter((m) =>
      m.supportedCapabilities.includes(capability)
    );

    // Sort: active working model first (if not in cooldown), then by priority
    return [...compatible].sort((a, b) => {
      const statusA = this.runtimeStatus.get(a.id);
      const statusB = this.runtimeStatus.get(b.id);

      const aInCooldown = statusA?.cooldownUntil && now < statusA.cooldownUntil;
      const bInCooldown = statusB?.cooldownUntil && now < statusB.cooldownUntil;

      // Penalize models currently in cooldown
      if (aInCooldown && !bInCooldown) return 1;
      if (!aInCooldown && bInCooldown) return -1;

      // Give preference to currently working active model if healthy
      if (a.id === activeModelId && !aInCooldown) return -1;
      if (b.id === activeModelId && !bInCooldown) return 1;

      return a.priority - b.priority;
    });
  }

  /**
   * Mark a model as successfully verified and working.
   */
  public recordSuccess(modelId: string, capability: AiCapability) {
    const status = this.runtimeStatus.get(modelId);
    if (status) {
      status.status = 'active';
      status.lastSuccessAt = Date.now();
      status.cooldownUntil = null;
      status.lastFailureReason = null;
      // Reset failure counter on verified success
      status.failureCount = 0;
    }

    // Set this model as current active model for this capability
    const previous = this.activeModelByCapability.get(capability);
    this.lastErrorByCapability.delete(capability);
    if (previous !== modelId) {
      console.log(
        `[VIZLAB Model Router] Updated active model for "${capability}": ${previous || 'none'} -> ${modelId}`
      );
    }
    this.activeModelByCapability.set(capability, modelId);
  }

  /**
   * Mark a model as failed, classifying error type and setting cooldown or invalidation.
   */
  public recordFailure(modelId: string, error: any, capability: AiCapability) {
    const now = Date.now();
    const status = this.runtimeStatus.get(modelId);
    const errCode = error?.status || error?.statusCode || error?.code || error?.error?.code || 'UNKNOWN';
    const errMsg = (error?.message || error?.toString() || '').toLowerCase();

    // Check error type
    const isUnsupported =
      errCode === 404 ||
      errMsg.includes('not found') ||
      errMsg.includes('unsupported') ||
      errMsg.includes('is not a valid model') ||
      errMsg.includes('invalid argument');

    const isHighDemandOrQuota =
      errCode === 503 ||
      errCode === 429 ||
      errMsg.includes('503') ||
      errMsg.includes('unavailable') ||
      errMsg.includes('high demand') ||
      errMsg.includes('quota') ||
      errMsg.includes('rate limit');

    const cooldownMs = isUnsupported ? this.unsupportedDurationMs : this.cooldownDurationMs;

    if (status) {
      status.failureCount++;
      status.lastFailureAt = now;
      status.lastFailureReason = `HTTP ${errCode}: ${error?.message || 'Failure'}`;
      status.status = isUnsupported ? 'unsupported' : 'cooldown';
      status.cooldownUntil = now + cooldownMs;
    }

    this.lastErrorByCapability.set(
      capability,
      status?.lastFailureReason || `HTTP ${errCode}: ${error?.message || 'Failure'}`
    );

    console.warn(
      `[VIZLAB Model Router] Invalidated model "${modelId}" for capability "${capability}" [${status?.lastFailureReason}]. Cooldown: ${Math.round(cooldownMs / 1000)}s.`
    );

    // If this was the active model, find the next best available model for this capability
    const currentActive = this.activeModelByCapability.get(capability);
    if (currentActive === modelId) {
      const candidates = this.getCandidatesForCapability(capability);
      const nextCandidate = candidates.find((c) => c.id !== modelId);
      if (nextCandidate) {
        this.activeModelByCapability.set(capability, nextCandidate.id);
        console.log(
          `[VIZLAB Model Router] Auto-switched active model for "${capability}" to: "${nextCandidate.id}".`
        );
      }
    }
  }

  /**
   * Executes an operation with automatic model detection, capability-awareness,
   * bounded retries per model, and automatic fallback across candidate models.
   */
  public async executeWithModelFallback<T>(
    capability: AiCapability,
    operation: (modelId: string) => Promise<T>,
    timeoutMsPerModel = 15000,
    maxTotalBudgetMs = 30000
  ): Promise<{ result: T; modelId: string; attempts: number; switchedModel: boolean } | null> {
    if (!this.aiInstance) {
      return null;
    }

    const candidates = this.getCandidatesForCapability(capability);
    if (candidates.length === 0) {
      console.warn(`[VIZLAB Model Router] No compatible candidate models found for capability "${capability}".`);
      return null;
    }

    const initialActive = this.activeModelByCapability.get(capability);
    const globalStart = Date.now();
    let totalAttempts = 0;
    let switchedModel = false;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const modelId = candidate.id;

      // Check remaining time against budget
      const elapsed = Date.now() - globalStart;
      const remaining = maxTotalBudgetMs - elapsed;
      if (remaining < 2500 && i > 0) {
        console.warn(
          `[VIZLAB Model Router] Serverless time budget reached (${elapsed}ms). Breaking to safely return response.`
        );
        break;
      }

      const activeTimeout = Math.min(timeoutMsPerModel, remaining);

      if (i > 0) {
        switchedModel = true;
      }

      console.log(
        `[VIZLAB Model Router] Attempting capability "${capability}" with model: "${modelId}" (Candidate ${i + 1}/${candidates.length}, timeout: ${activeTimeout}ms)...`
      );

      // Execute with timeout wrapper
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Model "${modelId}" timed out after ${activeTimeout}ms`));
        }, activeTimeout);
      });

      totalAttempts++;

      try {
        const result = await Promise.race([operation(modelId), timeoutPromise]).finally(() => {
          clearTimeout(timer);
        });

        // Verification succeeded! Record success and cache working model
        this.recordSuccess(modelId, capability);
        console.log(
          `[VIZLAB Model Router] Succeeded with model "${modelId}" for "${capability}". Active model confirmed.`
        );

        return {
          result,
          modelId,
          attempts: totalAttempts,
          switchedModel: switchedModel || modelId !== initialActive,
        };
      } catch (err: any) {
        clearTimeout(timer!);
        console.warn(
          `[VIZLAB Model Router] Candidate "${modelId}" failed: ${err.message}. Evaluating fallback options...`
        );

        this.recordFailure(modelId, err, capability);

        const errCode = err?.status || err?.statusCode || err?.code || err?.error?.code;
        const errMsg = (err?.message || err?.toString() || '').toLowerCase();
        const isAuthError =
          errCode === 401 ||
          errCode === 403 ||
          errMsg.includes('api key not valid') ||
          errMsg.includes('unauthenticated') ||
          errMsg.includes('permission denied') ||
          errMsg.includes('invalid api key');

        if (isAuthError) {
          console.warn(
            `[VIZLAB Model Router] Authentication error encountered (${err?.message || errCode}). Stopping candidate retry loop early.`
          );
          break;
        }

        // If there is another candidate, continue to next candidate
        if (i < candidates.length - 1) {
          const nextModel = candidates[i + 1].id;
          console.log(
            `[VIZLAB Model Router] Auto-switching to next candidate: "${nextModel}"...`
          );
          // Brief jitter sleep before trying next model to allow network breath
          await new Promise((res) => setTimeout(res, 250 + Math.random() * 200));
          continue;
        }
      }
    }

    console.warn(
      `[VIZLAB Model Router] All ${candidates.length} candidate Gemini models failed for "${capability}". Activating deterministic VIZLAB fallback.`
    );
    return null;
  }
}
