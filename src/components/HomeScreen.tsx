import React from 'react';
import { Play, Plus, ArrowRight } from 'lucide-react';

interface HomeScreenProps {
  onStartCoding: () => void;
  onNewFile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartCoding,
  onNewFile,
}) => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-6 py-12 bg-black text-white select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
        {/* App Logo & Name */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl liquid-glass-panel text-white font-extrabold text-2xl shadow-2xl border border-white/20">
            CV
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase font-mono">
              CodeVerse
            </h1>
            <p className="text-xs text-neutral-400 mt-1 font-mono tracking-wider">
              Mobile Code Studio
            </p>
          </div>
        </div>

        {/* Liquid Glass Buttons */}
        <div className="w-full space-y-3.5 pt-4">
          <button
            onClick={onStartCoding}
            className="w-full py-4 px-6 rounded-2xl glass-btn-primary font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START CODING</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onNewFile}
            className="w-full py-3.5 px-6 rounded-2xl glass-btn-secondary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
