import React, { useState } from 'react';
import { Navbar, PageRoute } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { HomePage } from './pages/HomePage';
import { PhysicsLabPage } from './pages/PhysicsLabPage';
import { ChemistryLabPage } from './pages/ChemistryLabPage';
import { BiologyLabPage } from './pages/BiologyLabPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AiModelGeneratorPage } from './pages/AiModelGeneratorPage';
import { DiagramScanPage } from './pages/DiagramScanPage';
import { AboutPage } from './pages/AboutPage';
import { AnatomyPage } from './pages/AnatomyPage';
import { aiSpeechManager } from './utils/aiSpeechService';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');

  const handleNavigate = (route: PageRoute) => {
    aiSpeechManager.stop();
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-slate-200">
      {/* Universal Top Bar */}
      <Navbar currentRoute={currentRoute} onNavigate={handleNavigate} />

      {/* Main Page Area */}
      <main className="flex-1">
        {currentRoute === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentRoute === 'diagram-scan' && <DiagramScanPage />}
        {currentRoute === 'physics' && <PhysicsLabPage />}
        {currentRoute === 'chemistry' && <ChemistryLabPage />}
        {currentRoute === 'biology' && <BiologyLabPage />}
        {currentRoute === 'anatomy' && <AnatomyPage onNavigate={handleNavigate} />}
        {currentRoute === 'ai-generator' && <AiModelGeneratorPage />}
        {currentRoute === 'ai-lab' && <AiAssistantPage />}
        {currentRoute === 'about' && <AboutPage onNavigate={handleNavigate} />}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
