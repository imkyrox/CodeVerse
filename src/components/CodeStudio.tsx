import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { sql } from '@codemirror/lang-sql';
import { rust } from '@codemirror/lang-rust';
import { json } from '@codemirror/lang-json';

import {
  Play,
  Square,
  Undo2,
  Redo2,
  Search,
  Maximize2,
  Minimize2,
  Trash2,
  Save,
  Terminal,
  Layers,
  Copy,
  ChevronDown,
  Check,
  Edit3,
  X,
  CheckCircle2,
} from 'lucide-react';

import { SupportedLanguage, ExecutionResult, Project, UserPreferences } from '../types';
import { LANGUAGES } from '../data/languages';
import { executeCode } from '../services/executionService';
import { StorageService } from '../services/storageService';

interface CodeStudioProps {
  project: Project;
  onUpdateProject: (proj: Project) => void;
  preferences: UserPreferences;
  onRunTriggerRef?: (fn: () => void) => void;
}

export const CodeStudio: React.FC<CodeStudioProps> = ({
  project,
  onUpdateProject,
  preferences,
  onRunTriggerRef,
}) => {
  const activeFile =
    project.files.find((f) => f.id === project.activeFileId) || project.files[0];

  const [code, setCode] = useState<string>(activeFile?.content || '');
  const [fileName, setFileName] = useState<string>(activeFile?.name || 'main.py');
  const [language, setLanguage] = useState<SupportedLanguage>(
    activeFile?.language || project.language
  );
  const [stdin, setStdin] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'preview' | 'stdin' | 'table'>('output');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [outputHeight, setOutputHeight] = useState<'collapsed' | 'half' | 'expanded'>('half');

  // Save UI states
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [customSaveName, setCustomSaveName] = useState<string>(activeFile?.name || 'main.py');

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const autosaveTimerRef = useRef<any>(null);

  // Sync internal state when active project or active file changes
  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.content);
      setLanguage(activeFile.language);
      setFileName(activeFile.name);
      setCustomSaveName(activeFile.name);
    }
  }, [project.id, project.activeFileId]);

  // Persist code changes immediately
  const persistChanges = (newCode: string, nameToUse?: string) => {
    const targetName = nameToUse || fileName;
    const updatedFiles = project.files.map((f) =>
      f.id === activeFile.id
        ? { ...f, content: newCode, name: targetName, language, updatedAt: Date.now() }
        : f
    );
    const updatedProj: Project = {
      ...project,
      name: project.name === 'My Workspace' && targetName !== 'main.py' ? targetName : project.name,
      language,
      files: updatedFiles,
      updatedAt: Date.now(),
    };
    onUpdateProject(updatedProj);

    StorageService.saveRecoveryBuffer({
      projectId: project.id,
      fileId: activeFile.id,
      content: newCode,
      language: language,
    });
  };

  // Background auto-save so user never loses code
  const triggerAutosave = useCallback(
    (newCode: string) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        persistChanges(newCode);
      }, 1000);
    },
    [project, activeFile, language, fileName]
  );

  const handleCodeChange = (val: string) => {
    setCode(val);
    triggerAutosave(val);
  };

  // Explicit Save File action requested by user
  const handleExplicitSave = () => {
    persistChanges(code, fileName);
    setSaveToast(`"${fileName}" saved successfully! You can resume anytime.`);
    setTimeout(() => {
      setSaveToast(null);
    }, 2800);
  };

  // Save As / Rename and Save
  const handleConfirmSaveAs = () => {
    const cleanName = customSaveName.trim() || fileName;
    setFileName(cleanName);
    persistChanges(code, cleanName);
    setShowSaveDialog(false);
    setSaveToast(`File saved as "${cleanName}"!`);
    setTimeout(() => {
      setSaveToast(null);
    }, 2800);
  };

  // Language selection handler
  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const langInfo = LANGUAGES[newLang];
    const newFileName = `main${langInfo.extension}`;
    setFileName(newFileName);
    setCustomSaveName(newFileName);

    const updatedFiles = project.files.map((f) =>
      f.id === activeFile.id
        ? {
            ...f,
            name: newFileName,
            language: newLang,
            content: code,
            updatedAt: Date.now(),
          }
        : f
    );

    const updatedProj = {
      ...project,
      language: newLang,
      files: updatedFiles,
      updatedAt: Date.now(),
    };

    onUpdateProject(updatedProj);
  };

  // Run code handler
  const handleRunCode = async () => {
    setIsRunning(true);
    // Auto-save before running
    persistChanges(code);
    setOutputHeight((prev) => (prev === 'collapsed' ? 'half' : prev));

    if (language === 'html' || language === 'css') {
      setActiveOutputTab('preview');
    } else if (language === 'sql') {
      setActiveOutputTab('table');
    } else {
      setActiveOutputTab('output');
    }

    try {
      const result = await executeCode(language, code, stdin);
      setExecutionResult(result);
      if (result.tableData && result.tableData.rows.length > 0) {
        setActiveOutputTab('table');
      }
    } catch (err: any) {
      setExecutionResult({
        status: 'error',
        output: '',
        error: err.message || 'Execution error encountered.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (onRunTriggerRef) {
      onRunTriggerRef(handleRunCode);
    }
  }, [code, language, stdin]);

  const handleStopExecution = () => {
    setIsRunning(false);
    setExecutionResult({
      status: 'error',
      output: executionResult?.output || '',
      error: 'Execution stopped.',
    });
  };

  // Quick insert toolbar symbols
  const handleInsertSymbol = (symbol: string) => {
    const view = editorRef.current?.view;
    if (view) {
      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: { from: cursor, insert: symbol },
        selection: { anchor: cursor + symbol.length },
      });
      view.focus();
    } else {
      setCode((prev) => prev + symbol);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    const view = editorRef.current?.view;
    if (view) {
      import('@codemirror/commands').then(({ undo }) => {
        undo(view);
      });
    }
  };

  const handleRedo = () => {
    const view = editorRef.current?.view;
    if (view) {
      import('@codemirror/commands').then(({ redo }) => {
        redo(view);
      });
    }
  };

  const handleClearCode = () => {
    if (window.confirm('Clear all code in current file?')) {
      setCode('');
      handleCodeChange('');
    }
  };

  const handleReplace = () => {
    if (!searchQuery) return;
    const newCode = code.replaceAll(searchQuery, replaceQuery);
    setCode(newCode);
    handleCodeChange(newCode);
  };

  const handleCopyOutput = () => {
    const text = executionResult?.output || executionResult?.error || '';
    if (text) {
      navigator.clipboard.writeText(text);
    }
  };

  // CodeMirror language extension resolver
  const extensions = useMemo(() => {
    const list: any[] = [];
    switch (language) {
      case 'javascript':
        list.push(javascript({ jsx: true, typescript: false }));
        break;
      case 'typescript':
        list.push(javascript({ jsx: true, typescript: true }));
        break;
      case 'python':
        list.push(python());
        break;
      case 'html':
        list.push(html());
        break;
      case 'css':
        list.push(css());
        break;
      case 'cpp':
      case 'c':
        list.push(cpp());
        break;
      case 'java':
        list.push(java());
        break;
      case 'sql':
        list.push(sql());
        break;
      case 'rust':
        list.push(rust());
        break;
      case 'json':
        list.push(json());
        break;
      default:
        break;
    }
    return list;
  }, [language]);

  const symbols = [
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    '"',
    "'",
    ';',
    '=',
    ':',
    '+',
    '-',
    '*',
    '/',
    '<',
    '>',
    '_',
    '!',
    '&',
    '|',
    '->',
    '=>',
  ];

  return (
    <div
      className={`flex flex-col w-full h-[calc(100vh-50px)] bg-black text-white relative ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
    >
      {/* Save Confirmation Toast */}
      {saveToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-neutral-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Studio Controls */}
      <div className="bg-black border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Language Selector Dropdown */}
          <div className="relative inline-block">
            <select
              value={language}
              onChange={(e) => handleSelectLanguage(e.target.value as SupportedLanguage)}
              className="appearance-none bg-neutral-900 text-white text-xs font-mono font-medium pl-2.5 pr-6 py-1 rounded border border-neutral-800 hover:border-neutral-700 focus:outline-none focus:border-white"
            >
              {Object.values(LANGUAGES).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clickable File Name to Rename & Save */}
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white font-mono truncate max-w-[120px]"
            title="Click to rename"
          >
            <span className="truncate">{fileName}</span>
            <Edit3 className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Prominent SAVE FILE Button */}
          <button
            onClick={handleExplicitSave}
            title="Save code to resume later"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl glass-btn-secondary text-xs font-medium cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Save</span>
          </button>

          <button
            onClick={handleUndo}
            title="Undo"
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 active:scale-95"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            title="Redo"
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 active:scale-95"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            title="Search"
            className={`p-1.5 rounded active:scale-95 ${
              showSearch ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* RUN Button */}
          {isRunning ? (
            <button
              onClick={handleStopExecution}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl glass-btn-secondary text-white font-medium text-xs border border-rose-500/50"
            >
              <Square className="w-3 h-3 fill-current text-rose-400" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRunCode}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl glass-btn-primary font-bold text-xs cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Save File Dialog / Rename Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Save File</h3>
              </div>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-300 font-medium">File Name</label>
              <input
                type="text"
                placeholder="e.g. my_script.py"
                value={customSaveName}
                onChange={(e) => setCustomSaveName(e.target.value)}
                className="w-full p-2.5 bg-black border border-neutral-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-white"
              />
              <p className="text-[11px] text-neutral-500">
                This code will be saved in your browser storage so you can continue later anytime.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 rounded-lg bg-neutral-900 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveAs}
                className="flex-1 py-2 rounded-lg bg-white text-black font-semibold text-xs active:scale-95 transition-all"
              >
                Save Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find and Replace Bar */}
      {showSearch && (
        <div className="bg-neutral-950 border-b border-neutral-800 p-2 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Find text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black border border-neutral-800 rounded px-2.5 py-1 text-white focus:outline-none focus:border-white flex-1 min-w-[120px]"
          />
          <input
            type="text"
            placeholder="Replace..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="bg-black border border-neutral-800 rounded px-2.5 py-1 text-white focus:outline-none focus:border-white flex-1 min-w-[120px]"
          />
          <button
            onClick={handleReplace}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded border border-neutral-800 font-medium"
          >
            Replace
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="text-neutral-500 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* CodeMirror Editor Area */}
        <div
          className={`flex-1 overflow-auto ${
            outputHeight === 'expanded' ? 'hidden' : 'block'
          }`}
        >
          <CodeMirror
            ref={editorRef}
            value={code}
            height="100%"
            theme={oneDark}
            extensions={extensions}
            onChange={handleCodeChange}
            basicSetup={{
              lineNumbers: preferences.lineNumbers,
              highlightActiveLineGutter: true,
              history: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: preferences.autoCloseBrackets,
              autocompletion: true,
              highlightActiveLine: true,
            }}
            style={{
              fontSize: `${preferences.fontSize}px`,
              fontFamily: "'Fira Code', monospace",
            }}
          />
        </div>

        {/* Mobile Coding Symbols Row */}
        <div className="flex-shrink-0 bg-neutral-950 border-t border-b border-neutral-800 px-2 py-1 flex items-center gap-1 overflow-x-auto no-scrollbar select-none z-10">
          <button
            onClick={() => handleInsertSymbol('  ')}
            className="px-2.5 py-1 rounded bg-neutral-900 text-white font-mono text-xs font-semibold flex-shrink-0 border border-neutral-800 active:scale-95"
          >
            Tab
          </button>

          {symbols.map((sym, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertSymbol(sym)}
              className="min-w-[30px] h-7 px-1.5 rounded bg-black hover:bg-neutral-900 border border-neutral-800 text-white font-mono text-xs flex items-center justify-center flex-shrink-0 active:scale-95"
            >
              {sym}
            </button>
          ))}

          <button
            onClick={handleClearCode}
            title="Clear Editor"
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-mono text-xs flex items-center gap-1 flex-shrink-0 border border-neutral-800"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Console / Output Panel */}
        <div
          className={`flex flex-col bg-black border-t border-neutral-800 transition-all z-20 ${
            outputHeight === 'collapsed'
              ? 'h-8'
              : outputHeight === 'expanded'
              ? 'h-full'
              : 'h-[44%]'
          }`}
        >
          {/* Output Panel Header */}
          <div className="flex items-center justify-between px-3 py-1 bg-neutral-950 border-b border-neutral-800 text-xs select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveOutputTab('output');
                  if (outputHeight === 'collapsed') setOutputHeight('half');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeOutputTab === 'output'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Console</span>
              </button>

              {(language === 'html' || language === 'css' || language === 'javascript') && (
                <button
                  onClick={() => {
                    setActiveOutputTab('preview');
                    if (outputHeight === 'collapsed') setOutputHeight('half');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeOutputTab === 'preview'
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              )}

              {language === 'sql' && (
                <button
                  onClick={() => {
                    setActiveOutputTab('table');
                    if (outputHeight === 'collapsed') setOutputHeight('half');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeOutputTab === 'table'
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Table</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveOutputTab('stdin');
                  if (outputHeight === 'collapsed') setOutputHeight('half');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeOutputTab === 'stdin'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Stdin</span>
                {stdin.trim().length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {executionResult?.executionTimeMs !== undefined && (
                <span className="text-[10px] text-neutral-500 font-mono">
                  {executionResult.executionTimeMs}ms
                </span>
              )}
              {activeOutputTab === 'output' && (
                <button
                  onClick={handleCopyOutput}
                  title="Copy output"
                  className="p-1 text-neutral-400 hover:text-white rounded"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() =>
                  setOutputHeight((prev) =>
                    prev === 'collapsed' ? 'half' : prev === 'half' ? 'expanded' : 'collapsed'
                  )
                }
                title="Resize"
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    outputHeight === 'collapsed'
                      ? 'rotate-180'
                      : outputHeight === 'expanded'
                      ? 'rotate-0'
                      : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Output Content */}
          {outputHeight !== 'collapsed' && (
            <div className="flex-1 overflow-auto p-3 font-mono text-xs select-text bg-black text-white">
              {/* CONSOLE TAB */}
              {activeOutputTab === 'output' && (
                <div className="space-y-1.5">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-neutral-400 py-2">
                      <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                      <span>Running...</span>
                    </div>
                  ) : !executionResult ? (
                    <div className="text-neutral-500 italic py-2">
                      Tap "Run" to execute your {LANGUAGES[language]?.name} code.
                    </div>
                  ) : (
                    <div>
                      {executionResult.error && (
                        <div className="p-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 mb-2 whitespace-pre-wrap">
                          <span className="font-semibold text-white">Error: </span>
                          {executionResult.error}
                        </div>
                      )}

                      {executionResult.output && (
                        <div className="text-white whitespace-pre-wrap leading-relaxed font-mono">
                          {executionResult.output}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LIVE PREVIEW TAB */}
              {activeOutputTab === 'preview' && (
                <div className="w-full h-full min-h-[160px] bg-white text-black rounded overflow-hidden relative">
                  <iframe
                    title="Live Code Preview"
                    sandbox="allow-scripts allow-modals"
                    srcDoc={
                      language === 'html'
                        ? code
                        : language === 'css'
                        ? `<style>${code}</style><div style="font-family:sans-serif;padding:20px;"><h2>CSS Preview</h2><p>Styled text</p></div>`
                        : `<!DOCTYPE html><html><body><div id="root"></div><script>${code}<\/script></body></html>`
                    }
                    className="w-full h-full border-none"
                  />
                </div>
              )}

              {/* STDIN TAB */}
              {activeOutputTab === 'stdin' && (
                <div className="space-y-2 h-full flex flex-col">
                  <p className="text-[11px] text-neutral-400">
                    Input passed to standard input (input(), cin, etc.):
                  </p>
                  <textarea
                    rows={4}
                    placeholder="Enter input here..."
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    className="w-full flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-white text-xs focus:outline-none focus:border-white font-mono resize-none"
                  />
                </div>
              )}

              {/* SQL TABLE TAB */}
              {activeOutputTab === 'table' && (
                <div>
                  {executionResult?.tableData ? (
                    <div className="overflow-x-auto border border-neutral-800 rounded">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-900 border-b border-neutral-800 text-white font-semibold">
                            {executionResult.tableData.headers.map((h, i) => (
                              <th key={i} className="py-1.5 px-3 uppercase tracking-wider font-mono">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 font-mono">
                          {executionResult.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-neutral-900">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-1 px-3 text-neutral-200">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-neutral-500 italic py-2">
                      Run a SQL query to see tabular results here.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
