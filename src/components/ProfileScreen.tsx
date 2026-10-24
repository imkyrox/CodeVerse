import React from 'react';
import {
  User,
  Settings,
  Instagram,
  Mail,
  ExternalLink,
  Code,
  Sliders,
} from 'lucide-react';
import { UserPreferences } from '../types';

interface ProfileScreenProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onResetData: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  preferences,
  onUpdatePreferences,
  onResetData,
}) => {
  const handleFontSizeChange = (size: number) => {
    onUpdatePreferences({ ...preferences, fontSize: size });
  };

  const handleToggleLineNumbers = () => {
    onUpdatePreferences({ ...preferences, lineNumbers: !preferences.lineNumbers });
  };

  const handleToggleBrackets = () => {
    onUpdatePreferences({ ...preferences, autoCloseBrackets: !preferences.autoCloseBrackets });
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 pb-20 space-y-4 bg-black text-white">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white">Settings & Developer</h2>
      </div>

      {/* Developer Section */}
      <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-white text-black font-bold flex items-center justify-center text-xs">
            CV
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">About Developer</h3>
          </div>
        </div>

        <div className="space-y-2 pt-1 border-t border-neutral-900">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/imujjaal/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded bg-black hover:bg-neutral-900 border border-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Instagram className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs font-medium text-white">Instagram</div>
                <div className="text-[11px] text-neutral-400 font-mono">@imujjaal</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>

          {/* Email */}
          <a
            href="mailto:kaai444xixi@gmail.com"
            className="flex items-center justify-between p-2.5 rounded bg-black hover:bg-neutral-900 border border-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-white" />
              <div>
                <div className="text-xs font-medium text-white">Email</div>
                <div className="text-[11px] text-neutral-400 font-mono">kaai444xixi@gmail.com</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        </div>
      </div>

      {/* Editor Preferences */}
      <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-white" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Editor Configuration
          </h3>
        </div>

        {/* Font size */}
        <div className="flex items-center justify-between p-2.5 rounded bg-black border border-neutral-900">
          <div>
            <div className="text-xs font-medium text-white">Font Size</div>
            <div className="text-[11px] text-neutral-500">Monospace editor scale</div>
          </div>
          <div className="flex items-center gap-1">
            {[12, 14, 16].map((size) => (
              <button
                key={size}
                onClick={() => handleFontSizeChange(size)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${
                  preferences.fontSize === size
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        {/* Line Numbers Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded bg-black border border-neutral-900">
          <div>
            <div className="text-xs font-medium text-white">Line Numbers</div>
            <div className="text-[11px] text-neutral-500">Display left margin gutter</div>
          </div>
          <button
            onClick={handleToggleLineNumbers}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
              preferences.lineNumbers ? 'bg-white' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full transition-transform absolute top-0.5 left-0.5 ${
                preferences.lineNumbers ? 'bg-black translate-x-5' : 'bg-neutral-500'
              }`}
            />
          </button>
        </div>

        {/* Auto Close Brackets Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded bg-black border border-neutral-900">
          <div>
            <div className="text-xs font-medium text-white">Auto-Close Brackets</div>
            <div className="text-[11px] text-neutral-500">Auto insert matching pairs</div>
          </div>
          <button
            onClick={handleToggleBrackets}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
              preferences.autoCloseBrackets ? 'bg-white' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full transition-transform absolute top-0.5 left-0.5 ${
                preferences.autoCloseBrackets ? 'bg-black translate-x-5' : 'bg-neutral-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Reset Cache */}
      <div className="pt-2 text-center">
        <button
          onClick={onResetData}
          className="text-xs text-neutral-500 hover:text-white underline transition-colors"
        >
          Reset Local Data to Defaults
        </button>
      </div>
    </div>
  );
};
