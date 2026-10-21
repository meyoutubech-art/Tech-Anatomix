import { useState, useEffect, useRef } from 'react';

export interface AutomaticExplanationState {
  observation: string | null;
  why: string | null;
  formula: string | null;
  isExplaining: boolean;
  lastChangedParam: {
    parameter: string;
    oldValue: any;
    newValue: any;
    unit?: string;
  } | null;
}

export function useAutomaticExplanation(
  simulationTitle: string,
  modelId: string,
  parameters: Record<string, any>,
  results: Record<string, any> = {},
  activeReaction: any = null
): AutomaticExplanationState {
  const [state, setState] = useState<AutomaticExplanationState>({
    observation: null,
    why: null,
    formula: null,
    isExplaining: false,
    lastChangedParam: null,
  });

  const prevParamsRef = useRef<Record<string, any>>({ ...parameters });
  const prevResultsRef = useRef<Record<string, any>>({ ...results });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevParamsRef.current = { ...parameters };
      prevResultsRef.current = { ...results };
      return;
    }

    const prevParams = prevParamsRef.current;
    let changedKey: string | null = null;
    let oldVal: any = null;
    let newVal: any = null;

    // Detect first changed parameter
    for (const key of Object.keys(parameters)) {
      if (parameters[key] !== prevParams[key]) {
        changedKey = key;
        oldVal = prevParams[key];
        newVal = parameters[key];
        break;
      }
    }

    // If no parameter changed, update refs and return
    if (!changedKey) {
      prevResultsRef.current = { ...results };
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setState((prev) => ({
      ...prev,
      isExplaining: true,
      lastChangedParam: {
        parameter: changedKey!,
        oldValue: oldVal,
        newValue: newVal,
      },
    }));

    // Debounce for 600ms to allow user to finish sliding
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/ai/explain-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulationTitle,
            modelId,
            parameter: changedKey,
            oldValue: oldVal,
            newValue: newVal,
            oldResults: prevResultsRef.current,
            newResults: results,
            activeReaction,
          }),
        });

        let data: any = {};
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch {
          data = {};
        }
        if (data && data.success) {
          setState({
            observation: data.observation,
            why: data.why,
            formula: data.formula || null,
            isExplaining: false,
            lastChangedParam: {
              parameter: changedKey!,
              oldValue: oldVal,
              newValue: newVal,
            },
          });
        }
      } catch (err) {
        // Fallback explanation
        setState({
          observation: `Adjusted ${changedKey} from ${oldVal} to ${newVal}. The simulation output updated in real time.`,
          why: `The mathematical equations governing ${simulationTitle} recalculated the physical state.`,
          formula: null,
          isExplaining: false,
          lastChangedParam: {
            parameter: changedKey!,
            oldValue: oldVal,
            newValue: newVal,
          },
        });
      } finally {
        prevParamsRef.current = { ...parameters };
        prevResultsRef.current = { ...results };
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [parameters, results, simulationTitle, modelId, activeReaction]);

  return state;
}
