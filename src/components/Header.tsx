import React from 'react';
import { Instagram } from 'lucide-react';

interface HeaderProps {
  fileName?: string;
  languageName?: string;
  isEditor?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  fileName = 'main.py',
  languageName = 'Python',
  isEditor = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full px-4 py-2.5 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between select-none">
      {/* Brand & Optional File Info (Only on Editor) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
          CV
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white tracking-wide truncate">
              CodeVerse
            </span>
            {isEditor && (
              <>
                <span className="text-neutral-600 text-xs">/</span>
                <span className="text-xs font-mono text-neutral-300 truncate">
                  {fileName}
                </span>
              </>
            )}
          </div>

          {isEditor && (
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
              {languageName}
            </p>
          )}
        </div>
      </div>

      {/* Top Corner: Developer Instagram ID */}
      <div className="flex items-center gap-2">
        <a
          href="https://www.instagram.com/imujjaal/?hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full liquid-glass-badge text-xs font-mono text-neutral-200 hover:text-white transition-all shadow-sm active:scale-95"
          title="Developer Instagram @imujjaal"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
          <span className="text-[11px] font-medium tracking-tight">@imujjaal</span>
        </a>
      </div>
    </header>
  );
};
