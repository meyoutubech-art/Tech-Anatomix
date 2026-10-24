import React from 'react';
import { PageRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img
              src="/logo.png"
              alt="Tech-Anatomix Logo"
              className="w-7 h-7 object-contain rounded-md"
            />
            <span className="text-base font-bold tracking-tight text-slate-900">Tech-Anatomix</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-emerald-600 font-semibold">Dissect Your Cell!</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Interactive 3D virtual science & anatomy laboratory empowering students through WebGL physical simulations, surgical frog & human neck dissection, verified chemical reactions, and AI 3D model generation.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium text-slate-600 flex-wrap">
          <button onClick={() => onNavigate('chemistry')} className="hover:text-slate-900 cursor-pointer">
            Chemistry Lab
          </button>
          <button onClick={() => onNavigate('anatomy')} className="hover:text-slate-900 cursor-pointer font-medium text-emerald-700">
            Anatomy
          </button>
          <button onClick={() => onNavigate('physics')} className="hover:text-slate-900 cursor-pointer">
            Physics Lab
          </button>
          <button onClick={() => onNavigate('biology')} className="hover:text-slate-900 cursor-pointer">
            Biology Lab
          </button>
          <button onClick={() => onNavigate('ai-generator')} className="hover:text-slate-900 cursor-pointer">
            Create 3D Model
          </button>
          <button onClick={() => onNavigate('about')} className="hover:text-slate-900 cursor-pointer">
            About Tech-Anatomix
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <span>© {new Date().getFullYear()} Tech-Anatomix STEM Laboratory. Dissect Your Cell!</span>
        <span>Deterministic Physical & Chemical Engines · Interactive 3D Dissection</span>
      </div>
    </footer>
  );
};
