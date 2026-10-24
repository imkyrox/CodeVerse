import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { CodeStudio } from './components/CodeStudio';
import { SavedScreen } from './components/SavedScreen';
import { ProfileScreen } from './components/ProfileScreen';

import { Project, UserPreferences } from './types';
import { StorageService } from './services/storageService';
import { LANGUAGES } from './data/languages';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() =>
    StorageService.getActiveProjectId()
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    StorageService.getPreferences()
  );

  const runCodeTriggerRef = useRef<(() => void) | null>(null);

  // Active project helper
  const activeProject =
    projects.find((p) => p.id === activeProjectId) ||
    projects[0] ||
    StorageService.createProject('My Code', 'python', '');

  const activeFile =
    activeProject.files.find((f) => f.id === activeProject.activeFileId) || activeProject.files[0];

  const handleUpdateProject = (updated: Project) => {
    StorageService.updateProject(updated);
    setProjects(StorageService.getProjects());
  };

  const handleOpenProject = (project: Project) => {
    StorageService.setActiveProjectId(project.id);
    setActiveProjectId(project.id);
    setActiveTab('editor');
  };

  const handleRefreshProjects = () => {
    setProjects(StorageService.getProjects());
  };

  const handleUpdatePreferences = (prefs: UserPreferences) => {
    setPreferences(prefs);
    StorageService.savePreferences(prefs);
  };

  // Create brand new blank file
  const handleCreateNewFile = () => {
    const existingCount = projects.length + 1;
    const newName = `Script_${existingCount}`;
    const created = StorageService.createProject(newName, 'python', '');
    setProjects(StorageService.getProjects());
    setActiveProjectId(created.id);
    setActiveTab('editor');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all saved projects to defaults?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none antialiased">
      {/* Clean Header */}
      <Header
        fileName={activeFile?.name || 'main.py'}
        languageName={LANGUAGES[activeProject.language]?.name || 'Python'}
        isEditor={activeTab === 'editor'}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full min-h-0 overflow-y-auto bg-black">
        {activeTab === 'home' && (
          <HomeScreen
            onStartCoding={() => setActiveTab('editor')}
            onNewFile={handleCreateNewFile}
          />
        )}

        {activeTab === 'editor' && (
          <CodeStudio
            key={activeProject.id + '_' + activeProject.activeFileId}
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            preferences={preferences}
            onRunTriggerRef={(fn) => {
              runCodeTriggerRef.current = fn;
            }}
          />
        )}

        {activeTab === 'saved' && (
          <SavedScreen
            projects={projects}
            activeProjectId={activeProjectId}
            onOpenProject={handleOpenProject}
            onRefreshProjects={handleRefreshProjects}
            onCreateNew={handleCreateNewFile}
          />
        )}

        {activeTab === 'developer' && (
          <ProfileScreen
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* 4-Tab Bottom Navigation: Home, Editor, Saved, About */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
