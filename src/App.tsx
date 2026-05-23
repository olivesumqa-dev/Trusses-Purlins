import React, { useState, useEffect } from 'react';
import { ProjectState, PurlinResult, TrussResult } from './types';
import { STANDARD_C_PURLINS } from './utils/sectionsDB';
import { solvePurlin } from './utils/purlinSolver';
import { solveTruss } from './utils/trussSolver';
import Header from './components/Header';
import SidebarInputs from './components/SidebarInputs';
import GraphicsView from './components/GraphicsView';
import ReportTab from './components/ReportTab';
import { 
  Briefcase, 
  Ruler, 
  Grid, 
  Activity, 
  Wind, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedViewMode, setSelectedViewMode] = useState<'dashboard' | 'report'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Fallback initial state
  const fallbackState: ProjectState = {
    projectInfo: {
      projectName: "Proposed Commercial Warehouse Roof",
      clientName: "Private Developer Inc.",
      engineerName: "Engr. Juan Dela Cruz, CE",
      location: "Metro Manila",
      windZone: "Zone 2 (250 kph)",
      designCode: "NSCP 2015",
      designMethod: "ASD",
      date: new Date().toISOString().slice(0, 10)
    },
    roofGeometry: {
      type: "Gable",
      buildingLength: 18.0,
      buildingWidth: 10.0,
      roofSpan: 10.0,
      roofHeight: 2.2,
      overhang: 0.6,
      eaveHeight: 4.5,
      slopeInputType: "height",
      slopeAngle: 23.7
    },
    purlinInputs: {
      type: "C-Purlin",
      sections: STANDARD_C_PURLINS,
      selectedIndex: 4, // LC 125 x 50 x 20 x 2.0 (Philippine standard constructor choice default)
      spacing: 0.8,
      span: 5.0, // Truss spacing (m)
      supportCondition: "Continuous (3+ Spans)",
      hasSagRods: true,
      sagRodSpacing: "midspan",
      selfWeightInclusion: true,
      overrideFy: false,
      manualFy: 248,
      steelGrade: "G250_Cold"
    },
    trussInputs: {
      type: "Fink",
      span: 10.0,
      height: 2.2,
      numPanels: 6,
      trussSpacing: 5.0,
      connectionType: "Welded",
      topChordSectionIndex: 15, // 2L-50x50x5mm
      bottomChordSectionIndex: 15, // 2L-50x50x5mm
      webSectionIndex: 8, // 2L-40x40x4mm
      steelGrade: "A36"
    },
    loads: {
      dead: {
        roofingWeight: 0.10, // prepainted rib type (0.1 kPa)
        insulation: 0.02,
        ceiling: 0.10,
        lightingMech: 0.03,
        solarPanels: 0.00,
        purlinSelfWeightMultiplier: 1.0
      },
      live: {
        roofLiveLoad: 0.60,
        useNscpDefault: true
      },
      wind: {
        basicWindSpeed: 290, // Metro Manila default (kph)
        exposureCategory: "B",
        occupancyCategory: "Standard",
        kd: 0.85,
        kzt: 1.0,
        gcpi: "0.18"
      }
    },
    activeTab: "project"
  };

  // Core state for structural parameters (loaded from localStorage or fallback)
  const [state, setState] = useState<ProjectState>(() => {
    const saved = localStorage.getItem('structeng_project_state_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.purlinInputs && parsed.trussInputs) {
          // Sync standard sections array if it's missing or out of sync
          if (!parsed.purlinInputs.sections || parsed.purlinInputs.sections.length === 0) {
            parsed.purlinInputs.sections = STANDARD_C_PURLINS;
          }
          return parsed;
        }
      } catch (e) {
        console.error("Error loading localStorage state:", e);
      }
    }
    return fallbackState;
  });

  const [appliedState, setAppliedState] = useState<ProjectState>(() => state);
  const [execState, setExecState] = useState<'idle' | 'dirty' | 'executing'>('idle');

  // Save changes to localStorage on State changes automatically
  useEffect(() => {
    localStorage.setItem('structeng_project_state_v3', JSON.stringify(state));
  }, [state]);

  // Toggle Dark/Light mode visually
  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleStateChange = (newState: Partial<ProjectState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const handleLoadState = (loadedState: ProjectState) => {
    setState(loadedState);
    setAppliedState(loadedState);
    setExecState('idle');
  };

  const handleApplyChanges = () => {
    if (execState !== 'dirty') return;
    setExecState('executing');
    setTimeout(() => {
      setAppliedState(state);
      setExecState('idle');
    }, 700);
  };

  // Watch for change in key physical variables to flag "Apply changes"
  useEffect(() => {
    const isStateDifferent = 
      JSON.stringify(state.roofGeometry) !== JSON.stringify(appliedState.roofGeometry) ||
      JSON.stringify(state.purlinInputs) !== JSON.stringify(appliedState.purlinInputs) ||
      JSON.stringify(state.trussInputs) !== JSON.stringify(appliedState.trussInputs) ||
      JSON.stringify(state.loads) !== JSON.stringify(appliedState.loads) ||
      state.projectInfo.designMethod !== appliedState.projectInfo.designMethod ||
      state.projectInfo.designCode !== appliedState.projectInfo.designCode;

    if (isStateDifferent && execState === 'idle') {
      setExecState('dirty');
    } else if (!isStateDifferent && execState === 'dirty') {
      setExecState('idle');
    }
  }, [state, appliedState, execState]);

  // Perform core structural solver checks on states changes using the executed appliedState
  const purlinResult: PurlinResult = solvePurlin(
    appliedState.purlinInputs,
    appliedState.loads,
    appliedState.roofGeometry.slopeAngle,
    appliedState.projectInfo.designMethod
  );

  const trussResult: TrussResult = solveTruss(
    appliedState.trussInputs,
    appliedState.loads,
    appliedState.roofGeometry.slopeAngle,
    appliedState.projectInfo.designMethod
  );

  return (
    <div className={`h-screen flex overflow-hidden font-sans ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#F1F5F9] text-slate-800'}`}>
      
      {/* 1. LEFT NAVIGATION RAIL (ASIDE) */}
      <aside className={`w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-300 z-30
        ${isSidebarOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'hidden lg:flex lg:translate-x-0'}
      `}>
        {/* Header brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400">NSCP v2015</div>
            <h1 className="text-base font-bold text-white tracking-snug uppercase">StructEng Pro</h1>
          </div>
          {/* Mobile close button */}
          <button 
            className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-grow py-4 space-y-1 overflow-y-auto">
          <div className="px-5 text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Roof Sub-systems</div>
          
          <button
            onClick={() => {
              setSelectedViewMode('dashboard');
              handleStateChange({ activeTab: 'project' });
              setIsSidebarOpen(false);
            }}
            className={`w-[calc(100%-16px)] mx-2 flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedViewMode === 'dashboard' && state.activeTab === 'project' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Briefcase className="w-3.5 h-3.5 mr-3 shrink-0" />
            <span>Project Specs</span>
          </button>

          <button
            onClick={() => {
              setSelectedViewMode('dashboard');
              handleStateChange({ activeTab: 'geometry' });
              setIsSidebarOpen(false);
            }}
            className={`w-[calc(100%-16px)] mx-2 flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedViewMode === 'dashboard' && state.activeTab === 'geometry' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Ruler className="w-3.5 h-3.5 mr-3 shrink-0" />
            <span>Roof Geometry</span>
          </button>

          <button
            onClick={() => {
              setSelectedViewMode('dashboard');
              handleStateChange({ activeTab: 'purlins' });
              setIsSidebarOpen(false);
            }}
            className={`w-[calc(100%-16px)] mx-2 flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedViewMode === 'dashboard' && state.activeTab === 'purlins' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Grid className="w-3.5 h-3.5 mr-3 shrink-0" />
            <span>Purlin Design</span>
          </button>

          <button
            onClick={() => {
              setSelectedViewMode('dashboard');
              handleStateChange({ activeTab: 'truss' });
              setIsSidebarOpen(false);
            }}
            className={`w-[calc(100%-16px)] mx-2 flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedViewMode === 'dashboard' && state.activeTab === 'truss' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity className="w-3.5 h-3.5 mr-3 shrink-0" />
            <span>Gable Truss</span>
          </button>

          <button
            onClick={() => {
              setSelectedViewMode('dashboard');
              handleStateChange({ activeTab: 'loads' });
              setIsSidebarOpen(false);
            }}
            className={`w-[calc(100%-16px)] mx-2 flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedViewMode === 'dashboard' && state.activeTab === 'loads' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <Wind className="w-3.5 h-3.5 mr-3 shrink-0" />
            <span>Loads (NSCP)</span>
          </button>

          {/* Scientific Calculation Solver Execute Trigger */}
          <div className="mx-2 mt-4 pt-4 border-t border-slate-800/60">
            <button
              onClick={handleApplyChanges}
              disabled={execState !== 'dirty'}
              className={`w-full flex items-center px-4 py-2.5 rounded-lg text-xs font-bold select-none cursor-pointer transition-all duration-200
                ${execState === 'dirty'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/15 ring-2 ring-emerald-500/30'
                  : execState === 'executing'
                    ? 'bg-amber-500 text-slate-950 font-bold animate-pulse cursor-wait'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 font-semibold cursor-default'
                }
              `}
              id="engineering-calculate-trigger"
            >
              {execState === 'dirty' ? (
                <>
                  <Activity className="w-3.5 h-3.5 mr-3 shrink-0 text-slate-950 animate-bounce" />
                  <span>Apply changes</span>
                </>
              ) : execState === 'executing' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-3.5 w-3.5 text-slate-950 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-3 shrink-0 text-emerald-500" />
                  <span>Changes Executed</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-6 px-5 text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">Reports & Output</div>
          
          <button
            onClick={() => {
              setSelectedViewMode('report');
              setIsSidebarOpen(false);
            }}
            className={`w-[calc(100%-16px)] mx-2 flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${selectedViewMode === 'report' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-3 shrink-0" />
            <span>Printable Report</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-400 select-none">
          <p>Licensed to: <strong className="text-white font-sans">{state.projectInfo.engineerName || 'Juan Dela Cruz, P.E.'}</strong></p>
          <p className="opacity-50 mt-1">Ver 1.2.0-Build.0478</p>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-20 cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Header Integration */}
        <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between select-none">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            <Header 
              projectName={state.projectInfo.projectName} 
              isDarkMode={isDarkMode} 
              onToggleDarkMode={handleToggleDarkMode} 
              state={state}
              onLoadState={handleLoadState}
              isCompliant={purlinResult.passed && trussResult.passed}
            />
          </div>
        </div>

        {/* Body content scroll region */}
        <div className="flex-grow p-4 lg:p-6 overflow-y-auto space-y-6">
          {selectedViewMode === 'dashboard' ? (
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Fields input (Left Column) */}
              <div className="lg:col-span-5 space-y-4">
                <SidebarInputs 
                  state={state} 
                  onChange={handleStateChange} 
                />

                {/* Status compliance summaries inside sidebar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Section Capacity checks</h4>
                  
                  {/* Purlin quick values */}
                  <div className="border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
                    <div>
                      <span className="block font-semibold text-slate-700 dark:text-slate-200">C-Purlin interaction ratio:</span>
                      <span className="text-[10px] text-slate-400">Code limit: max 1.0 (Biaxial)</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-sm font-bold block ${purlinResult.criticalRatio > 1.0 ? 'text-rose-500 font-black' : 'text-emerald-500'}`}>
                        {(purlinResult.criticalRatio * 100).toFixed(0)}%
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${purlinResult.passed ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400'}`}>
                        {purlinResult.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>

                  {/* Truss quick values */}
                  <div className="border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
                    <div>
                      <span className="block font-semibold text-slate-700 dark:text-slate-200">Gable Truss compliance:</span>
                      <span className="text-[10px] text-slate-400">Ag yield & Buckling KL/r</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-sm font-bold block ${trussResult.passed ? 'text-emerald-500' : 'text-rose-500 font-black'}`}>
                        {trussResult.passed ? 'Adequate' : 'Slight Flaw'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${trussResult.passed ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
                        {trussResult.passed ? 'PASS' : 'WARN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphics elevation and drawings (Right Column) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Graphic container view */}
                <GraphicsView 
                  state={appliedState} 
                  trussResult={trussResult} 
                  purlinResult={purlinResult}
                />

                {/* Warnings / Civil Optimizer Engine Accordion */}
                <div className="bg-slate-900 border border-slate-800 text-slate-300 p-4 rounded-xl space-y-3 shadow-md">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5 select-none">
                    <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                    Real-time Engineering Sizing Advisor
                  </h4>

                  <div className="text-xs text-slate-300 leading-relaxed space-y-3">
                    {/* Purlin failure optimizer */}
                    {!purlinResult.passed ? (
                      <div className="border border-red-900/40 bg-red-950/20 p-2.5 rounded flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                        <div>
                          <strong>Purlins are stressed beyond limits!</strong><br />
                          <span className="text-slate-400">The combination {purlinResult.criticalComboName} demands higher resistance. 
                          <strong> Advisor:</strong> {purlinResult.criticalMx > 0.8 && !appliedState.purlinInputs.hasSagRods ? "Enable 'Sag rods midspan' bracing to divide minor axis bending" : "Select standard 'LC 125 x 50 x 2.0' from the Purlin profiles dropdown"}.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-emerald-900/30 bg-emerald-950/10 p-2.5 rounded flex gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                          <strong>Purlins are fully compliant ({Math.round(purlinResult.criticalRatio*100)}%)</strong><br />
                          <span className="text-slate-400">The spacing of {appliedState.purlinInputs.spacing}m is safe under basic wind action {appliedState.loads.wind.basicWindSpeed} kph. No further action needed.</span>
                        </div>
                      </div>
                    )}

                    {/* Truss warning checks */}
                    {!trussResult.passed ? (
                      <div className="border border-amber-900/40 bg-amber-950/20 p-2.5 rounded flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <strong>Truss limits triggered. Check steel spans:</strong><br />
                          <span className="text-slate-400">One or more double angle struts exceed Euler buckling or code slenderness.
                          <strong> Advisor:</strong> Select a more rigid '2L-50×50×5mm' or heavier chords inside the Gable Truss tab to shorten column buckling heights.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-emerald-900/30 bg-emerald-950/10 p-2.5 rounded flex gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                          <strong>Gable Truss members satisfy AISC slenderness limits ({Math.round(trussResult.maxDisplacement)}mm max def)</strong><br />
                          <span className="text-slate-400">Slenderness ratios are kept below 200 (compression) and 300 (tension) safely. ready for framing detailing.</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Education block */}
                    <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800 flex gap-1.5 items-center select-none">
                      <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                      <span>Reference Standard: NSCP 2015 Sections 203 & 207 (Wind Envelopes) / Chapter 5 Structural Steel Design.</span>
                    </div>
                  </div>
                </div>

                {/* Professional Structural Analysis Summary Data Grid (LRFD Demand/Capacity) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-slate-850 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>STRUCTURAL INTEGRITY ASD/LRFD DATA GRID (NSCP CHAPTER 5)</span>
                    <span className="text-[10.5px] font-mono text-blue-500 dark:text-sky-400 font-bold">SOLVED</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse select-none">
                      <thead>
                        <tr className="text-[10px] uppercase text-slate-400 dark:text-slate-500 border-b border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
                          <th className="px-4 py-2.5 font-bold">Member Group</th>
                          <th className="px-4 py-2.5 font-bold">Section Profile</th>
                          <th className="px-4 py-2.5 font-bold text-right">Demand</th>
                          <th className="px-4 py-2.5 font-bold text-right">Capacity</th>
                          <th className="px-4 py-2.5 font-bold text-right">Ratio</th>
                          <th className="px-4 py-2.5 font-bold text-right">Deflection</th>
                          <th className="px-4 py-2.5 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                        {/* C-Purlin Row */}
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-950 dark:text-slate-205">C-Purlins (Biaxial)</td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{purlinResult.sectionName}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{purlinResult.criticalMx.toFixed(2)} kN-m</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                            {(purlinResult.criticalRatio > 0 ? purlinResult.criticalMx / purlinResult.criticalRatio : 1.25).toFixed(2)} kN-m
                          </td>
                          <td className={`px-4 py-2.5 text-right ${purlinResult.criticalRatio > 1.0 ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {(purlinResult.criticalRatio * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-2.5 text-right">{purlinResult.maxDeflection.toFixed(1)} mm</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${purlinResult.passed ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700'}`}>
                              {purlinResult.passed ? 'Pass' : 'Critical'}
                            </span>
                          </td>
                        </tr>

                        {/* Top Chord Row */}
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-950 dark:text-slate-205">Top Chord (Rafter)</td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{trussResult.elements[0]?.result.sectionName || '2L-50×50×5mm'}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{Math.abs(trussResult.elements[0]?.result.force || 0).toFixed(1)} kN</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{(trussResult.elements[0]?.result.capacity || 45.0).toFixed(1)} kN</td>
                          <td className={`px-4 py-2.5 text-right ${((trussResult.elements[0]?.result.utilization || 0) > 1.0) ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {((trussResult.elements[0]?.result.utilization || 0) * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-2.5 text-right">--</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${trussResult.passed ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-750 dark:text-red-400'}`}>
                              {trussResult.passed ? 'Pass' : 'Warn'}
                            </span>
                          </td>
                        </tr>

                        {/* Bottom Chord Row */}
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-950 dark:text-slate-205">Bottom Chord (Tie)</td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                            {trussResult.elements.find(el=>el.id.includes('BC'))?.result.sectionName || '2L-50×50×5mm'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                            {Math.abs(trussResult.elements.find(el=>el.id.includes('BC'))?.result.force || 0).toFixed(1)} kN
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                            {(trussResult.elements.find(el=>el.id.includes('BC'))?.result.capacity || 40.0).toFixed(1)} kN
                          </td>
                          <td className={`px-4 py-2.5 text-right ${((trussResult.elements.find(el=>el.id.includes('BC'))?.result.utilization || 0) > 1.0) ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {((trussResult.elements.find(el=>el.id.includes('BC'))?.result.utilization || 0) * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-2.5 text-right">{trussResult.maxDisplacement.toFixed(1)} mm</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${trussResult.passed ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/40 text-red-750'}`}>
                              {trussResult.passed ? 'Pass' : 'Warn'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

          ) : (
            
            /* Full printable calculation report */
            <ReportTab 
              state={appliedState} 
              purlinResult={purlinResult} 
              trussResult={trussResult} 
            />

          )}
        </div>

        {/* High-Fidelity Status bar Footer */}
        <footer className="h-10 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center px-6 justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0 transition-all select-none">
          <div className="flex space-x-6 items-center">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Calculations Active
            </span>
            <span className="flex items-center hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
              NSCP Section 203.3 Applied
            </span>
          </div>
          <div className="flex space-x-4 items-center">
            <span>Solver Engine: Matrix-Stiffness 1.0</span>
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">System Healthy</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
