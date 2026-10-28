import React, { useState } from 'react';
import { Navbar, PageRoute } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SettingsDirectoryModal } from './components/common/SettingsDirectoryModal';
import { ModelLaunchTarget } from './data/modelsDirectoryRegistry';
import { HomePage } from './pages/HomePage';
import { PhysicsLabPage } from './pages/PhysicsLabPage';
import { ChemistryLabPage, ChemistryWorkspaceMode } from './pages/ChemistryLabPage';
import { BiologyLabPage, BiologyModelId } from './pages/BiologyLabPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AiModelGeneratorPage } from './pages/AiModelGeneratorPage';
import { AboutPage } from './pages/AboutPage';
import { AnatomyPage } from './pages/AnatomyPage';
import { aiSpeechManager } from './utils/aiSpeechService';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [launchTarget, setLaunchTarget] = useState<ModelLaunchTarget | null>(null);
  const [launchKey, setLaunchKey] = useState<number>(0);

  const handleNavigate = (route: PageRoute | string) => {
    aiSpeechManager.stop();
    soundEngine.stopAllLoops();
    const safeRoute: PageRoute =
      route === 'diagram-scan' ? 'home' : (route as PageRoute);
    setCurrentRoute(safeRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchModelFromSettings = (target: ModelLaunchTarget) => {
    aiSpeechManager.stop();
    soundEngine.stopAllLoops();
    setLaunchTarget(target);
    setLaunchKey((prev) => prev + 1);
    setCurrentRoute(target.route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-slate-200">
      {/* Universal Top Bar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Centralized Settings & Model Directory Modal */}
      <SettingsDirectoryModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLaunchModel={handleLaunchModelFromSettings}
      />

      {/* Main Page Area */}
      <main className="flex-1">
        {currentRoute === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentRoute === 'physics' && (
          <PhysicsLabPage
            initialModelId={launchTarget?.physicsModelId}
            launchKey={launchKey}
          />
        )}
        {currentRoute === 'chemistry' && (
          <ChemistryLabPage
            initialMode={launchTarget?.chemistryMode as ChemistryWorkspaceMode | undefined}
            launchKey={launchKey}
          />
        )}
        {currentRoute === 'biology' && (
          <BiologyLabPage
            initialModelId={launchTarget?.biologyModelId as BiologyModelId | undefined}
            launchKey={launchKey}
          />
        )}
        {currentRoute === 'anatomy' && (
          <AnatomyPage
            onNavigate={handleNavigate}
            initialSpecimen={launchTarget?.anatomySpecimen}
            launchKey={launchKey}
          />
        )}
        {currentRoute === 'ai-generator' && (
          <AiModelGeneratorPage
            initialModelId={launchTarget?.aiCuratedKeyOrId}
            initialPrompt={launchTarget?.aiProceduralPrompt}
            launchKey={launchKey}
          />
        )}
        {currentRoute === 'ai-lab' && <AiAssistantPage />}
        {currentRoute === 'about' && <AboutPage onNavigate={handleNavigate} />}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
