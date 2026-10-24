import React from 'react';
import { Home, Code2, Bookmark, User } from 'lucide-react';

export type NavTab = 'home' | 'editor' | 'saved' | 'developer';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'editor' as NavTab, label: 'Editor', icon: Code2 },
    { id: 'saved' as NavTab, label: 'Saved', icon: Bookmark },
    { id: 'developer' as NavTab, label: 'About', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-neutral-800 px-3 py-1 select-none">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors active:scale-95 ${
                isActive ? 'text-white font-semibold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-neutral-500'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight ${
                  isActive ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
