import React, { useRef } from 'react';
import { ProjectState } from '../types';
import { Download, Upload, Sun, Moon, Sparkles, Compass, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  state: ProjectState;
  onLoadState: (loaded: ProjectState) => void;
  isCompliant: boolean;
}

export default function Header({ projectName, isDarkMode, onToggleDarkMode, state, onLoadState, isCompliant }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Download feature for CAD engineering data
  const handleSaveProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    
    // Nice safe file name
    const timestamp = new Date().toISOString().slice(0,10);
    const cleanProjName = (state.projectInfo.projectName || 'roof-design')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nscp-${cleanProjName}-${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Upload/Restore JSON designer files
  const handleLoadProjectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedState = JSON.parse(event.target?.result as string) as ProjectState;
        // Basic schema verification
        if (parsedState.projectInfo && parsedState.roofGeometry && parsedState.purlinInputs) {
          onLoadState(parsedState);
        } else {
          alert("Invalid file structure. Make sure you load a valid NSCP Purlin & Truss JSON project.");
        }
      } catch (err) {
        alert("Fail to parse project JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors">
      <div className="flex items-center space-x-4 min-w-0">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Project ID: PRJ-2026-NSCP
          </div>
          <div className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200" title={projectName}>
            {projectName || "Warehouse Roof Design"}
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
        <div className="flex space-x-2 shrink-0">
          {isCompliant ? (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">
              Pass
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded text-[10px] font-bold uppercase tracking-wider">
              Crit
            </span>
          )}
          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider italic">
            Metric (kN, m, MPa)
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
        {/* Action button download/saves */}
        <button 
          onClick={handleSaveProject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 hover:border-slate-300 rounded text-xs font-bold transition-all cursor-pointer shadow-sm"
          title="Save computational model to local disk"
          id="btn-save"
        >
          <Download className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span className="hidden sm:inline">SAVE</span>
        </button>

        {/* Action button upload */}
        <button 
          onClick={handleLoadProjectClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 hover:border-slate-300 rounded text-xs font-bold transition-all cursor-pointer shadow-sm"
          title="Restore project from file"
          id="btn-load"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="hidden sm:inline">LOAD</span>
        </button>
        
        {/* Hidden upload field */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/json"
          className="hidden"
          id="engineering-file-uploader"
        />

        {/* Dark/Light mode theme switcher */}
        <button 
          onClick={onToggleDarkMode}
          className="p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-250 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition cursor-pointer"
          title="Toggle UI theme mode"
          id="btn-theme-toggle"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
        </button>
      </div>
    </header>
  );
}
