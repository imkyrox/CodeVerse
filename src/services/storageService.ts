import { Project, UserPreferences, SupportedLanguage } from '../types';
import { LANGUAGES } from '../data/languages';

const STORAGE_KEYS = {
  PROJECTS: 'codeverse_projects_v2',
  ACTIVE_PROJECT_ID: 'codeverse_active_proj_id_v2',
  RECOVERY_BUFFER: 'codeverse_recovery_buffer_v2',
  PREFERENCES: 'codeverse_preferences_v2',
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj_main_empty',
    name: 'My Code',
    language: 'python',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    activeFileId: 'f_main_py',
    files: [
      {
        id: 'f_main_py',
        name: 'main.py',
        language: 'python',
        updatedAt: Date.now(),
        content: '',
      },
    ],
  },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: 14,
  lineNumbers: true,
  autoCloseBrackets: true,
  tabSize: 2,
};

export class StorageService {
  static getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load projects from storage', e);
    }
    this.saveProjects(DEFAULT_PROJECTS);
    return DEFAULT_PROJECTS;
  }

  static saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to storage', e);
    }
  }

  static getActiveProjectId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    if (id) return id;
    const projects = this.getProjects();
    return projects[0]?.id || 'proj_python_main';
  }

  static setActiveProjectId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  }

  static createProject(name: string, language: SupportedLanguage, initialCode?: string): Project {
    const langInfo = LANGUAGES[language];
    const newFileId = `f_${Date.now()}`;
    const newFile = {
      id: newFileId,
      name: `main${langInfo.extension}`,
      language,
      content: initialCode !== undefined ? initialCode : '',
      updatedAt: Date.now(),
    };

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: name.trim() || `Untitled ${langInfo.name}`,
      language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeFileId: newFileId,
      files: [newFile],
    };

    const projects = this.getProjects();
    projects.unshift(newProject);
    this.saveProjects(projects);
    this.setActiveProjectId(newProject.id);
    return newProject;
  }

  static updateProject(project: Project): void {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      projects[idx] = { ...project, updatedAt: Date.now() };
    } else {
      projects.unshift(project);
    }
    this.saveProjects(projects);
  }

  static deleteProject(id: string): void {
    let projects = this.getProjects();
    projects = projects.filter((p) => p.id !== id);
    if (projects.length === 0) {
      const fresh = this.createProject('My Workspace', 'python');
      this.setActiveProjectId(fresh.id);
      return;
    }
    this.saveProjects(projects);
    if (this.getActiveProjectId() === id) {
      this.setActiveProjectId(projects[0].id);
    }
  }

  static saveRecoveryBuffer(data: { projectId: string; fileId: string; content: string; language: string }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECOVERY_BUFFER, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch {}
  }

  static getRecoveryBuffer(): { projectId: string; fileId: string; content: string; language: string; savedAt: number } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECOVERY_BUFFER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (data) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load preferences', e);
    }
    return DEFAULT_PREFERENCES;
  }

  static savePreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
  }

  static exportFile(fileName: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
