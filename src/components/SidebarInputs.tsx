import React, { useState } from 'react';
import { ProjectState, RoofType, TrussType, PurlinType, SupportCondition, SteelGrade, ConnectionType, WindExposure, OccupancyCategory } from '../types';
import { PHILIPPINE_PROVINCES_WIND, STANDARD_C_PURLINS, STANDARD_Z_PURLINS, STANDARD_RHS, STANDARD_ANGLES, ROOF_CLADDING_DBS, STEEL_GRADES } from '../utils/sectionsDB';
import { Info, HelpCircle, MapPin, Layers, Settings, Ruler, Wind, Hammer, Database, Search, Gauge } from 'lucide-react';

interface SidebarInputsProps {
  state: ProjectState;
  onChange: (newState: Partial<ProjectState>) => void;
}

export default function SidebarInputs({ state, onChange }: SidebarInputsProps) {
  const { projectInfo, roofGeometry, purlinInputs, trussInputs, loads } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDbGrade, setSelectedDbGrade] = useState<SteelGrade>('A36');
  const [filterType, setFilterType] = useState<'all' | 'structural' | 'cold-formed'>('all');
  const [applyResult, setApplyResult] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setApplyResult(msg);
    setTimeout(() => setApplyResult(null), 3000);
  };

  const handleProjectChange = (key: keyof typeof projectInfo, value: any) => {
    // If location changes, auto pre-fill wind speed!
    let updatedLoads = { ...loads };
    if (key === 'location') {
      const match = PHILIPPINE_PROVINCES_WIND.find(p => p.province === value);
      if (match) {
        updatedLoads.wind = { ...updatedLoads.wind, basicWindSpeed: match.windSpeed };
      }
    }
    onChange({
      projectInfo: { ...projectInfo, [key]: value },
      loads: updatedLoads
    });
  };

  const handleGeometryChange = (key: keyof typeof roofGeometry, value: any) => {
    const updated = { ...roofGeometry, [key]: value };
    
    // Auto-calculate slope/angle parameters if dependent dimensions change
    if (key === 'roofSpan' || key === 'roofHeight') {
      const S = Number(updated.roofSpan) || 10;
      const H = Number(updated.roofHeight) || 2.5;
      const angle = (Math.atan(H / (S / 2)) * 180) / Math.PI;
      updated.slopeAngle = angle;
    } else if (key === 'slopeAngle') {
      const angle = Number(value) || 15;
      const S = Number(updated.roofSpan) || 10;
      // H = tan(angle) * (S/2)
      updated.roofHeight = Math.tan((angle * Math.PI) / 180) * (S / 2);
    }
    onChange({ roofGeometry: updated });
  };

  const handlePurlinChange = (key: keyof typeof purlinInputs, value: any) => {
    // Sync array of sections if purlin Type changes
    let sections = purlinInputs.sections;
    let selectedIndex = purlinInputs.selectedIndex;
    if (key === 'type') {
      if (value === 'C-Purlin') sections = STANDARD_C_PURLINS;
      else if (value === 'Z-Purlin') sections = STANDARD_Z_PURLINS;
      else if (value === 'Equal Angle') sections = STANDARD_ANGLES;
      else sections = STANDARD_RHS; // tubes
      selectedIndex = 0; // reset selection
    } else if (key === 'selectedIndex') {
      selectedIndex = value;
    }
    onChange({
      purlinInputs: {
        ...purlinInputs,
        [key]: value,
        sections,
        selectedIndex
      }
    });
  };

  const handleTrussChange = (key: keyof typeof trussInputs, value: any) => {
    onChange({ trussInputs: { ...trussInputs, [key]: value } });
  };

  const handleLoadsChange = (category: 'dead' | 'live' | 'wind', key: string, value: any) => {
    const updated = { ...loads };
    if (category === 'dead') {
      updated.dead = { ...updated.dead, [key]: value };
    } else if (category === 'live') {
      updated.live = { ...updated.live, [key]: value };
    } else if (category === 'wind') {
      updated.wind = { ...updated.wind, [key]: value };
    }
    onChange({ loads: updated });
  };

  const activeInputTab = state.activeTab;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 space-y-5">
      
      {/* 1. PROJECT INFORMATION PANEL */}
      {activeInputTab === 'project' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Settings className="w-4 h-4 text-slate-500" />
            <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-sm">Project Specification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Project Title / Name</label>
              <input 
                type="text" 
                value={projectInfo.projectName} 
                onChange={(e) => handleProjectChange('projectName', e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                placeholder="PROPOSED GABLE ROOF"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Client / Project Owner</label>
              <input 
                type="text" 
                value={projectInfo.clientName} 
                onChange={(e) => handleProjectChange('clientName', e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium font-sans">Lead Structural Engineer</label>
              <input 
                type="text" 
                value={projectInfo.engineerName} 
                onChange={(e) => handleProjectChange('engineerName', e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                placeholder="Engr. J. Dela Cruz"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Province / Site Location (NSCP)
              </label>
              <select 
                value={projectInfo.location} 
                onChange={(e) => handleProjectChange('location', e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                {PHILIPPINE_PROVINCES_WIND.map(p => (
                  <option key={p.province} value={p.province}>{p.province} ({p.windSpeed} kph)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Design Code</label>
              <select 
                value={projectInfo.designCode} 
                onChange={(e) => handleProjectChange('designCode', e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                <option value="NSCP 2015">NSCP 2015 (7th Ed)</option>
                <option value="NSCP 2010">NSCP 2010 (6th Ed)</option>
                <option value="AISC 360-16">AISC 360-16 ASD/LRFD</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Analysis Method</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => handleProjectChange('designMethod', 'ASD')}
                  className={`flex-1 py-1 text-center rounded-md font-semibold font-mono transition ${projectInfo.designMethod === 'ASD' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  ASD
                </button>
                <button 
                  type="button" 
                  onClick={() => handleProjectChange('designMethod', 'LRFD')}
                  className={`flex-1 py-1 text-center rounded-md font-semibold font-mono transition ${projectInfo.designMethod === 'LRFD' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  LRFD
                </button>
              </div>
            </div>
          </div>

          {/* NSCP Philippine Steel Material Database Explorer */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-600 dark:text-sky-400 cursor-pointer" />
                <h4 className="font-sans font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-tight">
                  NSCP Steel Grade Database Explorer
                </h4>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-505 font-mono bg-slate-50 dark:bg-slate-950/20 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800/80">
                Chapter 5 Standards
              </span>
            </div>

            {/* Application success message */}
            {applyResult && (
              <div className="p-2 border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg text-xs flex items-center gap-2 animate-fade-in animate-duration-150">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{applyResult}</span>
              </div>
            )}

            {/* Quick search and filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Filter steel grade... (e.g. ss400, a53)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-405 absolute left-2.5 top-2.5" />
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] self-start sm:self-auto">
                <button 
                  type="button" 
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 font-semibold rounded-md transition ${filterType === 'all' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  All
                </button>
                <button 
                  type="button" 
                  onClick={() => setFilterType('structural')}
                  className={`px-2 py-1 font-semibold rounded-md transition ${filterType === 'structural' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  Hot-Rolled (Truss)
                </button>
                <button 
                  type="button" 
                  onClick={() => setFilterType('cold-formed')}
                  className={`px-2 py-1 font-semibold rounded-md transition ${filterType === 'cold-formed' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                >
                  Cold-Formed (Purlin)
                </button>
              </div>
            </div>

            {/* Grades grid list */}
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {Object.values(STEEL_GRADES)
                .filter(grade => {
                  const s = searchTerm.toLowerCase();
                  const matchesSearch = grade.grade.toLowerCase().includes(s) || (grade.name?.toLowerCase() || '').includes(s);
                  const matchesFilter = filterType === 'all' || 
                    (filterType === 'structural' && !grade.isColdFormed) || 
                    (filterType === 'cold-formed' && grade.isColdFormed);
                  return matchesSearch && matchesFilter;
                })
                .map(grade => {
                  const isSelected = selectedDbGrade === grade.grade;
                  return (
                    <button
                      key={grade.grade}
                      type="button"
                      onClick={() => setSelectedDbGrade(grade.grade)}
                      className={`flex flex-col text-left p-2 border rounded-lg transition text-xs ${
                        isSelected 
                          ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 ring-1 ring-sky-500' 
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-1 mb-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{grade.grade}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded font-sans uppercase font-bold tracking-tight ${
                          grade.isColdFormed 
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' 
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {grade.isColdFormed ? 'Cold' : 'Hot'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {grade.name?.split('Steel')[0] || grade.grade}
                      </span>
                      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono pt-1 border-t border-slate-50 dark:border-slate-800/80 w-full">
                        <span>Fy: <strong className="text-slate-700 dark:text-slate-300">{grade.fy}</strong></span>
                        <span>Fu: <strong className="text-slate-700 dark:text-slate-300">{grade.fu}</strong></span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Selected Spec Detail Card */}
            {STEEL_GRADES[selectedDbGrade] && (() => {
              const g = STEEL_GRADES[selectedDbGrade];
              return (
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-3 rounded-lg text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 gap-2">
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">{g.name}</h5>
                      <span className="text-[10px] text-slate-405 dark:text-slate-500 block font-mono font-semibold">{g.standard}</span>
                    </div>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 px-1.5 py-0.5 rounded text-right shrink-0">
                      E = {g.e.toLocaleString()} MPa
                    </span>
                  </div>

                  <p className="text-slate-500 dark:text-slate-404 text-[10.5px] leading-relaxed font-sans">
                    {g.commonUsage}
                  </p>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-center pt-1.5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded shadow-sm">
                      <span className="text-slate-400 dark:text-slate-500 block text-[8px] uppercase">Yield Strength</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-xs font-bold">{g.fy} MPa</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded shadow-sm">
                      <span className="text-slate-400 dark:text-slate-500 block text-[8px] uppercase">Tensile Strength</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-xs font-bold">{g.fu} MPa</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded shadow-sm">
                      <span className="text-slate-400 dark:text-slate-500 block text-[8px] uppercase">Unit Density</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-xs font-bold">{g.density} kg/m³</strong>
                    </div>
                  </div>

                  {/* Quick Application Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <button
                      key={`btn-truss-${g.grade}`}
                      type="button"
                      onClick={() => {
                        handleTrussChange('steelGrade', g.grade);
                        triggerToast(`Assigned ${g.grade} to main Truss members!`);
                      }}
                      className="flex-grow py-1 px-2 border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-semibold rounded text-[10px] hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors shadow-sm"
                    >
                      Apply to Truss Chords
                    </button>
                    <button
                      key={`btn-purlin-${g.grade}`}
                      type="button"
                      onClick={() => {
                        handlePurlinChange('steelGrade', g.grade);
                        triggerToast(`Assigned ${g.grade} to continuous Purlins!`);
                      }}
                      className="flex-grow py-1 px-2 border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-semibold rounded text-[10px] hover:bg-sky-100 dark:hover:bg-sky-950/40 transition-colors shadow-sm"
                    >
                      Apply to Roof Purlins
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. ROOF GEOMETRY DESIGN PANEL */}
      {activeInputTab === 'geometry' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Ruler className="w-4 h-4 text-emerald-500" />
            <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-sm">Roof Geometry & Layout Dimensions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Roof Type Configuration</label>
              <select 
                value={roofGeometry.type} 
                onChange={(e) => handleGeometryChange('type', e.target.value as RoofType)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Gable">Gable Roof (Dual Slope)</option>
                <option value="Mono-slope">Mono-slope (Shed Type)</option>
                <option value="Hip">Hip Roof</option>
                <option value="Sawtooth">Sawtooth Profile</option>
                <option value="Curved">Curved Framing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Building Longitudinal Length (meters)</label>
              <input 
                type="number" 
                step="0.5"
                min="1"
                value={roofGeometry.buildingLength} 
                onChange={(e) => handleGeometryChange('buildingLength', parseFloat(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Truss Clear Span (meters)</label>
              <input 
                type="number" 
                step="0.5"
                min="2"
                value={roofGeometry.roofSpan} 
                onChange={(e) => {
                  handleGeometryChange('roofSpan', parseFloat(e.target.value));
                  // keep truss span synced too
                  handleTrussChange('span', parseFloat(e.target.value));
                }} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Eave Columns Height (meters)</label>
              <input 
                type="number" 
                step="0.1"
                min="1"
                value={roofGeometry.eaveHeight} 
                onChange={(e) => handleGeometryChange('eaveHeight', parseFloat(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Overhang Eaves (meters)</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={roofGeometry.overhang} 
                onChange={(e) => handleGeometryChange('overhang', parseFloat(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Slopping Input Method</label>
              <select 
                value={roofGeometry.slopeInputType} 
                onChange={(e) => handleGeometryChange('slopeInputType', e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
              >
                <option value="height">Specify Ridge Apex Height (H)</option>
                <option value="pitch">Specify Slope Pitch/Angle (Deg)</option>
              </select>
            </div>

            {roofGeometry.slopeInputType === 'height' ? (
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Ridge Apex Height H (meters)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  value={roofGeometry.roofHeight} 
                  onChange={(e) => {
                    handleGeometryChange('roofHeight', parseFloat(e.target.value));
                    // sync truss height
                    handleTrussChange('height', parseFloat(e.target.value));
                  }} 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Roof Pitch Angle (degrees)</label>
                <input 
                  type="number" 
                  min="2"
                  max="45"
                  step="1"
                  value={Math.round(roofGeometry.slopeAngle)} 
                  onChange={(e) => handleGeometryChange('slopeAngle', parseFloat(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PURLIN DESIGN PARAMETERS */}
      {activeInputTab === 'purlins' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-sm">Cold-formed Purlin Definition</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium font-semibold">Purlin Type Style</label>
              <select 
                value={purlinInputs.type} 
                onChange={(e) => handlePurlinChange('type', e.target.value as PurlinType)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
              >
                <option value="C-Purlin">C-Purlin Standard Channel</option>
                <option value="Z-Purlin">Z-Purlin Overlapping Section</option>
                <option value="Rectangular Tube">Steel RHS/SHS hollow tube</option>
                <option value="Equal Angle">Double Angle Profile (2L Section)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Standard Section Profile</label>
              <select 
                value={purlinInputs.selectedIndex} 
                onChange={(e) => handlePurlinChange('selectedIndex', parseInt(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-mono"
              >
                {purlinInputs.sections.map((sec, idx) => (
                  <option key={sec.name} value={idx}>{sec.name} ({sec.weight} kg/m)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-sky-500" />
                Purlin Steel Grade
              </label>
              <select 
                value={purlinInputs.steelGrade} 
                onChange={(e) => handlePurlinChange('steelGrade', e.target.value as SteelGrade)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-semibold"
              >
                {Object.values(STEEL_GRADES).map((grade) => (
                  <option key={`p-grade-${grade.grade}`} value={grade.grade}>
                    {grade.grade} - {grade.name?.split('Steel')[0] || grade.grade} (Fy={grade.fy})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Purlin Axial Spacing (meters)</label>
              <input 
                type="number" 
                step="0.05"
                min="0.3"
                max="2.0"
                value={purlinInputs.spacing} 
                onChange={(e) => handlePurlinChange('spacing', parseFloat(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 italic">NSCP recommended max is 0.90m - 1.20m</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Bay Width / Purlin Span (meters)</label>
              <input 
                type="number" 
                step="0.1"
                min="1.0"
                max="10.0"
                value={purlinInputs.span} 
                onChange={(e) => {
                  handlePurlinChange('span', parseFloat(e.target.value));
                  // Keep truss spacing synchronized!
                  handleTrussChange('trussSpacing', parseFloat(e.target.value));
                }} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 italic">This usually corresponds to your truss layout distance</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Purlin Support Conditions</label>
              <select 
                value={purlinInputs.supportCondition} 
                onChange={(e) => handlePurlinChange('supportCondition', e.target.value as SupportCondition)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
              >
                <option value="Simply Supported">Simply Supported (Single Span)</option>
                <option value="Continuous (2 Spans)">Continuous Beam (2 Spans)</option>
                <option value="Continuous (3+ Spans)">Continuous Beam (3+ Spans)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Sag Rod Bracing</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => {
                    handlePurlinChange('hasSagRods', true);
                    handlePurlinChange('sagRodSpacing', 'midspan');
                  }}
                  className={`flex-1 py-1 text-center rounded-md font-semibold font-mono transition ${purlinInputs.hasSagRods && purlinInputs.sagRodSpacing === 'midspan' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500'}`}
                >
                  Midspan
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    handlePurlinChange('hasSagRods', true);
                    handlePurlinChange('sagRodSpacing', 'thirdpoints');
                  }}
                  className={`flex-1 py-1 text-center rounded-md font-semibold font-mono transition ${purlinInputs.hasSagRods && purlinInputs.sagRodSpacing === 'thirdpoints' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500'}`}
                >
                  Thirdpts
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    handlePurlinChange('hasSagRods', false);
                    handlePurlinChange('sagRodSpacing', 'none');
                  }}
                  className={`flex-1 py-1 text-center rounded-md font-semibold font-mono transition {!purlinInputs.hasSagRods || purlinInputs.sagRodSpacing === 'none' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500'}`}
                >
                  None
                </button>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-4 py-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={purlinInputs.selfWeightInclusion}
                  onChange={(e) => handlePurlinChange('selfWeightInclusion', e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Include Purlin Self-Weight in dead loads</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={purlinInputs.overrideFy}
                  onChange={(e) => handlePurlinChange('overrideFy', e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Override steel Fy (MPa)</span>
              </label>
            </div>

            {purlinInputs.overrideFy && (
              <div className="space-y-1 col-span-2">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Custom Yield Strength Fy (MPa)</label>
                <input 
                  type="number" 
                  value={purlinInputs.manualFy} 
                  onChange={(e) => handlePurlinChange('manualFy', parseFloat(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ROOF TRUSS CONFIG PANEL */}
      {activeInputTab === 'truss' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Hammer className="w-4 h-4 text-purple-500" />
            <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-sm">Gable Truss Geometry & Double Angle Profiles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Web Configuration</label>
              <select 
                value={trussInputs.type} 
                onChange={(e) => handleTrussChange('type', e.target.value as TrussType)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
              >
                <option value="Fink">Fink Roof Truss (Ph Standard)</option>
                <option value="Howe">Howe (Dwnslope Diagonals)</option>
                <option value="Pratt">Pratt (Upslope Diagonals)</option>
                <option value="Warren">Warren (A-Zigzag diagonals)</option>
                <option value="King Post">King Post (Simplistic Tie)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Erection Support Width (m)</label>
              <input 
                type="number" 
                step="0.5" 
                disabled 
                value={trussInputs.span} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400 rounded-lg font-mono"
              />
              <span className="text-[10px] text-slate-400 italic">Synced to Roof building width</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Number of Chord Panels (Even number)</label>
              <select 
                value={trussInputs.numPanels} 
                onChange={(e) => handleTrussChange('numPanels', parseInt(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-mono"
              >
                <option value="4">4 Panels (Small Span)</option>
                <option value="6">6 Panels (Standard Span)</option>
                <option value="8">8 Panels (8m - 12m)</option>
                <option value="12">12 Panels (Long span Warehouse)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-purple-500" />
                Base Steel Grade
              </label>
              <select 
                value={trussInputs.steelGrade} 
                onChange={(e) => handleTrussChange('steelGrade', e.target.value as SteelGrade)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-semibold"
              >
                {Object.values(STEEL_GRADES).map((grade) => (
                  <option key={`t-grade-${grade.grade}`} value={grade.grade}>
                    {grade.grade} - {grade.name?.split('Steel')[0] || grade.grade} (Fy={grade.fy})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Top Chord Steel Member</label>
              <select 
                value={trussInputs.topChordSectionIndex} 
                onChange={(e) => handleTrussChange('topChordSectionIndex', parseInt(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-mono"
              >
                {STANDARD_ANGLES.map((sec, idx) => (
                  <option key={`tc-${idx}`} value={idx}>{sec.name} ({sec.weight} kg/m)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Bottom Tension Chord Member</label>
              <select 
                value={trussInputs.bottomChordSectionIndex} 
                onChange={(e) => handleTrussChange('bottomChordSectionIndex', parseInt(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-mono"
              >
                {STANDARD_ANGLES.map((sec, idx) => (
                  <option key={`bc-${idx}`} value={idx}>{sec.name} ({sec.weight} kg/m)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Web Struts / Stiffeners</label>
              <select 
                value={trussInputs.webSectionIndex} 
                onChange={(e) => handleTrussChange('webSectionIndex', parseInt(e.target.value))} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-300 font-mono"
              >
                {STANDARD_ANGLES.map((sec, idx) => (
                  <option key={`w-${idx}`} value={idx}>{sec.name} ({sec.weight} kg/m)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Gusset Node Connections</label>
              <select 
                value={trussInputs.connectionType} 
                onChange={(e) => handleTrussChange('connectionType', e.target.value as ConnectionType)} 
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500"
              >
                <option value="Welded">Fillet Welded Connections (5mm-6mm E70)</option>
                <option value="Bolted">Bolted (High Strength A325 M16)</option>
                <option value="Gusset Plate">Gusset Plate (Pl 6mm - structural framing)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 5. LOAD INPUT VARIABLES */}
      {activeInputTab === 'loads' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Wind className="w-4 h-4 text-sky-500" />
            <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-200 text-sm">NSCP Load Definition (Chapter 2)</h3>
          </div>

          {/* Sub loading levels */}
          <div className="space-y-3 text-xs">
            
            {/* Dead Load levels */}
            <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Dead Loads per Square Meter (kPa)</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400">Roof Sheet Cladding</label>
                  <select 
                    value={loads.dead.roofingWeight} 
                    onChange={(e) => handleLoadsChange('dead', 'roofingWeight', parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded focus:ring-1 focus:ring-sky-500 font-mono"
                  >
                    {ROOF_CLADDING_DBS.map(cl => (
                      <option key={cl.name} value={cl.weight}>{cl.name} ({(cl.weight).toFixed(2)} kPa)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Insulation Material</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={loads.dead.insulation}
                    onChange={(e) => handleLoadsChange('dead', 'insulation', parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Ceiling Infill boards</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0"
                    value={loads.dead.ceiling}
                    onChange={(e) => handleLoadsChange('dead', 'ceiling', parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Solar Panel installations</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0"
                    value={loads.dead.solarPanels}
                    onChange={(e) => handleLoadsChange('dead', 'solarPanels', parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Lighting/Mech fixtures</label>
                  <input 
                    type="number" 
                    step="0.02"
                    min="0"
                    value={loads.dead.lightingMech}
                    onChange={(e) => handleLoadsChange('dead', 'lightingMech', parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Load levels */}
            <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Roof Live Load (kPa)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400">Manual Override Live Load (kPa)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0.1"
                    max="2"
                    value={loads.live.roofLiveLoad}
                    onChange={(e) => handleLoadsChange('live', 'roofLiveLoad', parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded font-mono"
                  />
                </div>
                <div className="text-[10px] text-slate-400 italic flex items-center pt-2">
                  <span>Note: NSCP Section 205 permits sloped roof structural live loads to be reduced down to 0.60 kPa for slopes exceeding 15% pitch (dual-slope ridge frameworks).</span>
                </div>
              </div>
            </div>

            {/* Wind Load levels */}
            <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
              <span className="font-bold text-sky-700 dark:text-sky-300 block mb-2">Wind Structural Exposure Coefficients</span>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400">Wind Velocity Speed V (kph)</label>
                  <input 
                    type="number" 
                    min="100"
                    max="400"
                    value={loads.wind.basicWindSpeed}
                    onChange={(e) => handleLoadsChange('wind', 'basicWindSpeed', parseInt(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Exposure Terrain</label>
                  <select 
                    value={loads.wind.exposureCategory}
                    onChange={(e) => handleLoadsChange('wind', 'exposureCategory', e.target.value as WindExposure)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="B">Exposure B (Urban/Suburban woodlots)</option>
                    <option value="C">Exposure C (Open flat terrains / fields)</option>
                    <option value="D">Exposure D (Flat, unobstructed shorelines)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-sans">Occupancy Importance</label>
                  <select 
                    value={loads.wind.occupancyCategory}
                    onChange={(e) => handleLoadsChange('wind', 'occupancyCategory', e.target.value as OccupancyCategory)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Standard">Standard Occupancy (I = 1.0)</option>
                    <option value="Essential">Essential Facilities / Hospitals (I = 1.15)</option>
                    <option value="Hazardous">Hazardous Structures (I = 1.15)</option>
                    <option value="Miscellaneous">Miscellaneous Shelters (I = 0.87)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Enclosure Style (GCpi)</label>
                  <select 
                    value={loads.wind.gcpi}
                    onChange={(e) => handleLoadsChange('wind', 'gcpi', e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded focus:ring-1 focus:ring-sky-500 font-mono"
                  >
                    <option value="0.18">Enclosed Envelope (+/- 0.18)</option>
                    <option value="0.55">Partially Enclosed openings (+/- 0.55)</option>
                    <option value="0.00">Fully Open Canopy / Shed (0.00)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
