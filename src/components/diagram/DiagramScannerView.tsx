import React, { useState, useRef, useEffect } from 'react';
import { DiagramScanResult } from '../../types/diagramScan';
import { SAMPLE_DIAGRAMS } from '../../data/sampleDiagrams';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Zap,
  HelpCircle,
  X,
  SwitchCamera,
} from 'lucide-react';
import { classifyAiError } from '../../utils/aiErrorClassifier';

interface DiagramScannerViewProps {
  onScanComplete: (result: DiagramScanResult) => void;
}

// Preprocess and compress image from file or gallery before sending
const preprocessImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Failed to read image file'));
      }
      const rawDataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(rawDataUrl);
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => {
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const DiagramScannerView: React.FC<DiagramScannerViewProps> = ({
  onScanComplete,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err.message);
      setCameraError(
        'Camera access was denied or is not supported in this browser. Please upload an image file instead.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      processImage(dataUrl, 'camera_capture.jpg');
    }
  };

  const handleToggleFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    startCamera(next);
  };

  // Process selected or captured image with Real Gemini Multimodal Vision
  const processImage = async (dataUrl: string, fileName?: string) => {
    setIsScanning(true);
    setErrorMsg(null);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMsg(
        '⚡ You are currently offline. AI Diagram Scanning requires an active internet connection to process images with Gemini Vision. You can explore all 31 verified preset 3D models in the Virtual Labs while offline.'
      );
      setIsScanning(false);
      return;
    }

    setScanStep('Connecting to Gemini Multimodal Vision AI...');

    const timer1 = setTimeout(() => {
      setScanStep('Analyzing diagram geometry, physical structure & OCR labels...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setScanStep('Mapping labels to 3D spatial coordinates & building educational model...');
    }, 2800);

    try {
      const res = await fetch('/api/ai/scan-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          fileName,
        }),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        data = {};
      }
      if (res.ok && data.success && data.result) {
        onScanComplete(data.result);
      } else {
        const errorDetail = !res.ok
          ? classifyAiError(res.status)
          : (data?.error || data?.message || 'Could not analyze diagram with AI. Please try another image.');
        setErrorMsg(errorDetail);
      }
    } catch (err: any) {
      console.error('Scan diagram failed:', err);
      setErrorMsg(classifyAiError(err));
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setErrorMsg(null);
      setScanStep('Preparing image from gallery for Multimodal Vision AI...');
      const optimizedDataUrl = await preprocessImageFile(file);
      await processImage(optimizedDataUrl, file.name);
    } catch (err: any) {
      console.error('File load failed:', err);
      setErrorMsg('Failed to process image file. Please choose a JPG, PNG, or WEBP image.');
      setIsScanning(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        setIsScanning(true);
        setErrorMsg(null);
        setScanStep('Preparing dropped image for Multimodal Vision AI...');
        const optimizedDataUrl = await preprocessImageFile(file);
        await processImage(optimizedDataUrl, file.name);
      } catch (err: any) {
        console.error('Drop load failed:', err);
        setErrorMsg('Failed to process dropped image file. Please try another image.');
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Vision AI</span>
          <span className="text-slate-300">·</span>
          <span>Verified 3D Scientific Binding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Scan a Diagram → Interactive 3D Model
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Upload a textbook diagram, lab worksheet, or snapshot from your device. VIZLAB analyzes the concept, detects physical labels, and builds a split-screen 3D model linked directly to your diagram.
        </p>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Analysis Notice</p>
              <p className="text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div className="max-w-3xl mx-auto">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center bg-white shadow-xs ${
            dragActive
              ? 'border-sky-500 bg-sky-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isScanning ? (
            <div className="space-y-4 py-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-sky-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-sky-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Analyzing Scientific Diagram</h3>
                <p className="text-xs text-slate-500">{scanStep}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-700 shadow-2xs">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Upload or Drop Your Science Diagram
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Drag and drop a PNG, JPG, or WEBP diagram from your textbook or science worksheet.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose Image File</span>
                </button>

                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-sky-600" />
                  <span>Take Photo with Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Camera Modal Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Take Photo of Textbook Diagram</h3>
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-xs text-rose-300 space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p>{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleToggleFacing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>Flip Camera</span>
              </button>

              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={!!cameraError}
                className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Try With Verified Sample Textbook Diagrams Section */}
      <div className="max-w-4xl mx-auto space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Or Try With Verified Textbook Diagrams:
            </h3>
            <p className="text-xs text-slate-500">
              Instant one-click testing using authentic scientific diagrams with verified label coordinates.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:block">
            4 Interactive Presets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SAMPLE_DIAGRAMS).map(([key, sample]) => (
            <div
              key={key}
              onClick={() => onScanComplete(sample)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-4/3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-3 relative group-hover:scale-[1.02] transition-transform">
                  <img
                    src={sample.imageUrl}
                    alt={sample.concept}
                    className="w-full h-full object-contain p-1"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-700 shadow-2xs">
                    {sample.subject}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {sample.concept}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {sample.labels.length} verified labels · {sample.diagramType}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-sky-600">
                <span>Load &amp; Link 3D Model</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
