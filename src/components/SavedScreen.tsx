import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Search,
  FileCode,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Project, CodeFile, SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';
import { StorageService } from '../services/storageService';

interface SavedScreenProps {
  projects: Project[];
  activeProjectId: string;
  onOpenProject: (project: Project) => void;
  onRefreshProjects: () => void;
  onCreateNew: () => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  projects,
  activeProjectId,
  onOpenProject,
  onRefreshProjects,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [renamingProjectName, setRenamingProjectName] = useState<string>('');

  // Delete confirmation state (100% reliable inside iframe)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    StorageService.deleteProject(projectToDelete.id);
    onRefreshProjects();
    showToast(`"${projectToDelete.name}" deleted.`);
    setProjectToDelete(null);
  };

  const handleExportFile = (e: React.MouseEvent, file: CodeFile) => {
    e.stopPropagation();
    StorageService.exportFile(file.name, file.content);
    showToast(`Downloading "${file.name}"...`);
  };

  const handleRenameProject = (project: Project) => {
    if (!renamingProjectName.trim()) return;
    const cleanName = renamingProjectName.trim();
    const updatedFiles = project.files.map((f) => ({
      ...f,
      name: cleanName.includes('.') ? cleanName : `${cleanName}${LANGUAGES[project.language]?.extension || '.py'}`,
    }));
    const updated = {
      ...project,
      name: cleanName,
      files: updatedFiles,
      updatedAt: Date.now(),
    };
    StorageService.updateProject(updated);
    onRefreshProjects();
    setEditingProjectId(null);
    showToast(`Renamed to "${cleanName}"`);
  };

  const formatTime = (ts: number) => {
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 pb-20 space-y-4 bg-black text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-neutral-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-white" />
            <span>Saved Codes</span>
          </h2>
          <p className="text-xs text-neutral-400">
            {projects.length} saved code file{projects.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs active:scale-95 transition-all shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Code</span>
        </button>
      </div>

      {/* Search Bar */}
      {projects.length > 1 && (
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search saved files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      )}

      {/* Saved Codes List */}
      <div className="space-y-2.5">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-neutral-950 rounded-2xl border border-neutral-900 space-y-3">
            <Bookmark className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs text-neutral-300 font-semibold">No saved code found</p>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              Write your code in the Editor and tap "Save" to keep it here so you can continue anytime.
            </p>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
            >
              Start Coding
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isEditing = editingProjectId === project.id;
            const file = project.files[0] || { name: 'script.py', content: '' };

            return (
              <div
                key={project.id}
                onClick={() => onOpenProject(project)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isActive
                    ? 'bg-neutral-950 border-white'
                    : 'bg-black border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={renamingProjectName}
                            onChange={(e) => setRenamingProjectName(e.target.value)}
                            className="bg-neutral-900 border border-white rounded px-2 py-0.5 text-xs text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameProject(project)}
                            className="p-1 rounded bg-white text-black"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingProjectId(null)}
                            className="p-1 rounded bg-neutral-800 text-neutral-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {project.name}
                          </h3>
                          {isActive && (
                            <span className="text-[10px] font-mono text-black bg-white px-1.5 py-0.2 rounded font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                        <span className="text-neutral-300">{LANGUAGES[project.language]?.name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {formatTime(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setEditingProjectId(project.id);
                        setRenamingProjectName(project.name);
                      }}
                      className="p-2 text-neutral-400 hover:text-white rounded hover:bg-neutral-900"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleExportFile(e, file as CodeFile)}
                      className="p-2 text-neutral-400 hover:text-white rounded hover:bg-neutral-900"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setProjectToDelete({ id: project.id, name: project.name });
                      }}
                      className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded"
                      title="Delete saved code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Code preview snippet */}
                {file.content && file.content.trim() && (
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-900 font-mono text-xs text-neutral-300 truncate whitespace-pre">
                    {file.content.trim().split('\n')[0]}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-[11px] text-neutral-500">Tap card to open in editor</span>
                  <div className="flex items-center gap-1 text-white font-semibold">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Saved Code?</h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white font-mono">"{projectToDelete.name}"</span>?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProject}
                className="flex-1 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 font-bold text-xs active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
