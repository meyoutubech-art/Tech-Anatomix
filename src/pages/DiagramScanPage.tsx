import React, { useState } from 'react';
import { DiagramScannerView } from '../components/diagram/DiagramScannerView';
import { DiagramSplitScreenView } from '../components/diagram/DiagramSplitScreenView';
import { DiagramScanResult } from '../types/diagramScan';

export const DiagramScanPage: React.FC = () => {
  const [activeScan, setActiveScan] = useState<DiagramScanResult | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {activeScan ? (
        <DiagramSplitScreenView
          scanResult={activeScan}
          onResetScan={() => setActiveScan(null)}
        />
      ) : (
        <DiagramScannerView onScanComplete={(res) => setActiveScan(res)} />
      )}
    </div>
  );
};
