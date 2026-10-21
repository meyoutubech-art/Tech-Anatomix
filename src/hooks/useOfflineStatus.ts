import { useState, useEffect, useCallback, useRef } from 'react';
import {
  prepareAllOfflinePresets,
  getStoredVerificationRecord,
  getUniquePresets,
  OfflineProgressInfo,
  OfflineVerificationRecord,
} from '../utils/offlineModelManager';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const presets = getUniquePresets();
  const totalPresets = presets.length;

  const [progress, setProgress] = useState<OfflineProgressInfo>(() => {
    const existing = getStoredVerificationRecord();
    if (existing && existing.isReady && existing.verifiedCount >= totalPresets) {
      return {
        status: 'ready',
        current: existing.verifiedCount,
        total: existing.totalPresets,
        percentage: 100,
        currentModelTitle: 'All models verified',
        message: `Ready for exhibition: ${existing.verifiedCount}/${existing.totalPresets} models cached offline`,
        unverified: existing.unverified || [],
      };
    }
    return {
      status: 'idle',
      current: 0,
      total: totalPresets,
      percentage: 0,
      currentModelTitle: 'Preparing offline models...',
      message: `Preparing offline models: 0/${totalPresets}`,
      unverified: [],
    };
  });

  const [isPreparing, setIsPreparing] = useState(false);
  const hasAutoStartedRef = useRef(false);

  // Connectivity event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Execution function
  const runPreparation = useCallback(async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    try {
      await prepareAllOfflinePresets((info) => {
        setProgress(info);
      });
    } catch (err) {
      console.error('Offline preparation error:', err);
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        message: 'Offline preparation encountered an error. Click to retry.',
      }));
    } finally {
      setIsPreparing(false);
    }
  }, [isPreparing]);

  // Automatic background preparation on mount
  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;

    const existing = getStoredVerificationRecord();
    // If not ready or model count changed, run preparation
    if (!existing || !existing.isReady || existing.totalPresets !== totalPresets) {
      // Delay slightly so initial page render is instantaneous
      const timer = setTimeout(() => {
        runPreparation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [totalPresets, runPreparation]);

  const retryPreparation = useCallback(() => {
    runPreparation();
  }, [runPreparation]);

  return {
    isOnline,
    isPreparing,
    isReady: progress.status === 'ready',
    progress,
    totalPresets,
    cachedCount: progress.current,
    unverified: progress.unverified,
    retryPreparation,
  };
}
