export type SupportedLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'sql'
  | 'c'
  | 'cpp'
  | 'java'
  | 'rust'
  | 'go'
  | 'csharp'
  | 'php'
  | 'kotlin'
  | 'ruby'
  | 'swift'
  | 'r'
  | 'bash'
  | 'json'
  | 'xml'
  | 'yaml';

export type LanguageCategory = 'Web' | 'Scripting' | 'Systems' | 'Database' | 'Config' | 'Data';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  extension: string;
  category: LanguageCategory;
  defaultCode: string;
  runnerType: 'sandbox-js' | 'web-preview' | 'sql-engine' | 'data-format' | 'piston-runner';
  pistonRuntime?: {
    language: string;
    version?: string;
  };
}

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: SupportedLanguage;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  language: SupportedLanguage;
  files: CodeFile[];
  activeFileId: string;
  createdAt: number;
  updatedAt: number;
}

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout';

export interface ExecutionResult {
  status: ExecutionStatus;
  output: string;
  error?: string;
  executionTimeMs?: number;
  exitCode?: number;
  tableData?: { headers: string[]; rows: (string | number | null)[][] };
}

export interface UserPreferences {
  fontSize: number;
  lineNumbers: boolean;
  autoCloseBrackets: boolean;
  tabSize: number;
}
