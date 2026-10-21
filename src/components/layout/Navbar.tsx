import React from 'react';
import { Sparkles, Camera } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type PageRoute = 'home' | 'diagram-scan' | 'physics' | 'chemistry' | 'biology' | 'anatomy' | 'ai-generator' | 'ai-lab' | 'about';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const navLinks: { route: PageRoute; label: string }[] = [
    { route: 'home', label: 'Home' },
    { route: 'diagram-scan', label: 'Scan Diagram' },
    { route: 'chemistry', label: 'Chemistry' },
    { route: 'anatomy', label: 'Anatomy' },
    { route: 'ai-generator', label: 'Create 3D Model' },
    { route: 'ai-lab', label: 'AI Lab' },
    { route: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand wordmark & tagline */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 group text-left cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="Tech-Anatomix Logo"
            className="w-9 h-9 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
              Tech-Anatomix
            </span>
            <span className="text-[10px] font-medium text-emerald-600 tracking-wide mt-0.5">
              Dissect Your Cell!
            </span>
          </div>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & PWA Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <PWAInstallButton compact />
          <button
            onClick={() => onNavigate('diagram-scan')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span>Scan Diagram</span>
          </button>
          <button
            onClick={() => onNavigate('physics')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            Virtual Lab
          </button>
        </div>
      </div>

      {/* Mobile Nav Link Ribbon */}
      <div className="md:hidden flex items-center gap-4 px-4 py-2 overflow-x-auto border-t border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-600">
        {navLinks.map((item) => (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            className={`whitespace-nowrap shrink-0 ${
              currentRoute === item.route ? 'text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
