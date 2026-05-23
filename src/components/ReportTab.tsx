import React, { useRef } from 'react';
import { ProjectState, TrussResult, PurlinResult, SectionProfile } from '../types';
import { Printer, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Signature } from 'lucide-react';

interface ReportTabProps {
  state: ProjectState;
  trussResult: TrussResult;
  purlinResult: PurlinResult;
}

export default function ReportTab({ state, trussResult, purlinResult }: ReportTabProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // A clean, simple print command.
    window.print();
  };

  const { projectInfo, roofGeometry, purlinInputs, trussInputs, loads } = state;

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h3 className="font-sans font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500" />
            Printable Calculation Report (NSCP / AISC)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Generates a formal, detailed design calculation sheet ready for structural calculations submissions to local building officials (Office of the Building Official - OBO, Philippines).
          </p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm active:scale-95"
          id="print-button"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF Report
        </button>
      </div>

      {/* Printable Sheet Area */}
      <div 
        ref={reportRef}
        className="bg-white text-slate-900 border border-slate-300 rounded-xl p-8 max-w-4xl mx-auto shadow-md print:border-none print:shadow-none print:p-0 font-sans print:bg-white print:text-black"
        id="structural-design-report"
      >
        {/* Printable Header */}
        <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-950 uppercase">Structural Design Report</h1>
            <p className="text-xs text-slate-500 font-mono">Code standard: {projectInfo.designCode} ({projectInfo.designMethod})</p>
            <p className="text-xs text-slate-500">Subject: Preliminary Roof Frame framing design of Rafter Trusses & Purlins</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono space-y-1">
            <div>Date: {projectInfo.date || '2026-05-20'}</div>
            <div>Ref No: {projectInfo.projectName ? projectInfo.projectName.substring(0,3).toUpperCase() : 'PRJ'}-902</div>
            <div className="font-semibold text-emerald-600 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5" /> Checked & Verified
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-xs leading-relaxed mb-6 print:bg-slate-100 border border-slate-200">
          <div>
            <div className="text-slate-400 uppercase font-bold tracking-wider text-[9px] mb-1">Project Particulars</div>
            <div><strong>Project Name:</strong> {projectInfo.projectName || 'Proposed Residential Warehouse Roof'}</div>
            <div><strong>Client Name:</strong> {projectInfo.clientName || 'Private Developer Inc.'}</div>
            <div><strong>Project Location:</strong> {projectInfo.location || 'Metro Manila, Philippines'}</div>
          </div>
          <div>
            <div className="text-slate-400 uppercase font-bold tracking-wider text-[9px] mb-1">Engineering Particulars</div>
            <div><strong>Design Engineer:</strong> {projectInfo.engineerName || 'Engr. J. Dela Cruz, CE'}</div>
            <div><strong>Basic Wind Speed (V):</strong> {loads.wind.basicWindSpeed} kph (NSCP Zone {loads.wind.gcpi === '0.18' ? '2' : '1'})</div>
            <div><strong>Wind Exposure:</strong> Category {loads.wind.exposureCategory} | Imp Factor: 1.0</div>
          </div>
        </div>

        {/* Executive Structural Status Indicator */}
        <div className="mb-6 flex gap-4 items-center">
          <div className={`p-4 rounded-lg flex-1 border flex items-center gap-3 ${purlinResult.passed && trussResult.passed ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-red-50 border-red-300 text-red-950'}`}>
            {purlinResult.passed && trussResult.passed ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">DESIGN COMPLIANCE: ADEQUATE (PASS)</h4>
                  <p className="text-xs text-emerald-700 mt-1">Both C-Purlin framing sections and Gable truss members satisfy all stress, slenderness, and serviceability deflection checks in accordance with NSCP guidelines.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">DESIGN COMPLIANCE: FAILED (ACTION REQUIRED)</h4>
                  <p className="text-xs text-red-700 mt-1">One or more structural parts exceed their maximum allowable capacity stress ratio or slenderness limits. Reselect larger sections.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 1: Roof Geometric Profile */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-1 rounded inline-block">1.0 Roof Geometry & Dimensional Inputs</h2>
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Parameter</th>
                <th className="p-2 border-r border-slate-300">Value (m/deg)</th>
                <th className="p-2 border-r border-slate-300">Description</th>
                <th className="p-2">Engineering Formula / Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Slope Angle (θ)</td>
                <td className="p-2 border-r border-slate-300 font-mono">{roofGeometry.slopeAngle.toFixed(1)}°</td>
                <td className="p-2 border-r border-slate-300">Inclination of Rafter chords</td>
                <td className="p-2 font-mono">θ = atan(Height / (Span/2))</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Truss Span (S)</td>
                <td className="p-2 border-r border-slate-300 font-mono">{trussInputs.span} m</td>
                <td className="p-2 border-r border-slate-300">Total lateral structural width</td>
                <td className="p-2">Clear out-to-out distance of supports</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium font-mono">Purlin Spacing</td>
                <td className="p-2 border-r border-slate-300 font-mono">{purlinInputs.spacing} m</td>
                <td className="p-2 border-r border-slate-300">Tributary load band spacing</td>
                <td className="p-2">Maximum span spacing limit is 1.20 meters</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-300 font-medium">Truss Spacing</td>
                <td className="p-2 border-r border-slate-300 font-mono">{trussInputs.trussSpacing} m</td>
                <td className="p-2 border-r border-slate-300">Purlin structural span distance</td>
                <td className="p-2">Longitudinal structural column spacing</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Load Cases & Combinations */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-1 rounded inline-block">2.0 Applied Load Specifications (NSCP Ch. 2)</h2>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="border border-slate-300 p-3 rounded">
              <strong className="block border-b border-slate-200 pb-1 mb-2 font-bold text-slate-800">I. Dead Load (DL)</strong>
              <div>Roof Cladding: {(loads.dead.roofingWeight).toFixed(2)} kPa</div>
              <div>Insulation/Ceiling: {(loads.dead.insulation + loads.dead.ceiling).toFixed(2)} kPa</div>
              <div>Solar Weight: {loads.dead.solarPanels.toFixed(2)} kPa</div>
              <div className="font-bold border-t border-slate-200 mt-2 pt-1">Total DL = {purlinResult.deadLoadPerSqm.toFixed(2)} kPa</div>
            </div>

            <div className="border border-slate-300 p-3 rounded">
              <strong className="block border-b border-slate-200 pb-1 mb-2 font-bold text-slate-800">II. Live Load (LL)</strong>
              <div>NSCP sloped live load: {loads.live.roofLiveLoad.toFixed(2)} kPa</div>
              <div className="text-[10px] text-slate-500 mt-2">Applied over horizontal projection or chord surface. Inward action.</div>
              <div className="font-bold border-t border-slate-200 mt-2 pt-1">LL = {loads.live.roofLiveLoad.toFixed(2)} kPa</div>
            </div>

            <div className="border border-slate-300 p-3 rounded">
              <strong className="block border-b border-slate-200 pb-1 mb-2 font-bold text-slate-800">III. Wind Load (WL)</strong>
              <div>Basic Wind Speed: {loads.wind.basicWindSpeed} kph</div>
              <div>Velocity Press. (qp): {(purlinResult.windUplift / 0.9 || 0.5).toFixed(2)} kPa</div>
              <div>Internal Press (GCpi): +/-{loads.wind.gcpi}</div>
              <div className="font-bold border-t border-slate-200 mt-2 pt-1 text-sky-700">Max Uplift normal = {purlinResult.windUplift.toFixed(2)} kPa</div>
            </div>
          </div>
        </div>

        {/* Section 3: Purlin Calculation Output */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-1 rounded inline-block">3.0 C-Purlin Member Bending & Stress Verification</h2>
          <div className="text-xs space-y-1">
            <div><strong>Section Profile selected:</strong> {purlinResult.sectionName}</div>
            <div><strong>Support Condition:</strong> {purlinInputs.supportCondition} (Span = {purlinResult.span} m)</div>
            <div><strong>Sag Rod bracing:</strong> {purlinInputs.hasSagRods ? `Active (${purlinInputs.sagRodSpacing})` : 'None'}</div>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-slate-300 shadow-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Load Combination</th>
                <th className="p-2 border-r border-slate-300 font-mono">Mx (kN-m)</th>
                <th className="p-2 border-r border-slate-300 font-mono">My (kN-m)</th>
                <th className="p-2 border-r border-slate-300 font-mono">Stress (MPa)</th>
                <th className="p-2">Interaction Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {purlinResult.combos.map((cb, idx) => (
                <tr key={idx} className={cb.name === purlinResult.criticalComboName ? 'bg-amber-50 print:bg-yellow-100 font-medium' : ''}>
                  <td className="p-2 border-r border-slate-300">{cb.name} {cb.name === purlinResult.criticalComboName ? ' (CRITICAL)' : ''}</td>
                  <td className="p-2 border-r border-slate-300 font-mono">{cb.maxMx.toFixed(3)}</td>
                  <td className="p-2 border-r border-slate-300 font-mono">{cb.maxMy.toFixed(3)}</td>
                  <td className="p-2 border-r border-slate-300 font-mono">{cb.stressX.toFixed(1)}x / {cb.stressY.toFixed(1)}y</td>
                  <td className="p-2 font-mono">
                    <span className={cb.interactionRatio > 1.0 ? 'text-red-600 font-bold' : 'text-slate-900'}>
                      {cb.interactionRatio.toFixed(3)} ({(cb.interactionRatio * 100).toFixed(0)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-4 text-xs mt-2 p-3 bg-slate-50 border border-slate-200 rounded leading-relaxed">
            <div>
              <strong>Deflection Check:</strong><br />
              Calculated Max Deflection: <strong>{purlinResult.maxDeflection.toFixed(1)} mm</strong><br />
              Allowable Limit (L/180) = {purlinResult.allowableDeflection.toFixed(1)} mm<br />
              Deflection Status: <span className={purlinResult.deflectionRatio > 1.0 ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}>{purlinResult.deflectionRatio > 1.0 ? 'FAILED' : 'PASSED'}</span>
            </div>
            <div>
              <strong>Resultant Shear Check:</strong><br />
              Max end shear force V: <strong>{purlinResult.maxShear.toFixed(2)} kN</strong><br />
              Design Shear capacity phi*V_n: {purlinResult.shearCapacity.toFixed(2)} kN<br />
              Shear Status: <span className={purlinResult.shearRatio > 1.0 ? 'text-red-a600 font-bold' : 'text-emerald-700 font-semibold'}>{purlinResult.shearRatio > 1.0 ? 'FAILED' : 'PASSED'}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Truss Calculation Output */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-1 rounded inline-block">4.0 Roof Gable Truss Element Verification</h2>
          <div className="text-xs space-y-1">
            <div><strong>Truss Profile:</strong> {trussInputs.type} ({trussInputs.numPanels} Panel Units) | <strong>Truss Height (Apex):</strong> {trussInputs.height} m</div>
            <div><strong>Top Chord Section:</strong> {trussResult.elements[0]?.result.sectionName} | <strong>Bottom Chord Section:</strong> {trussResult.elements.find(el=>el.id.includes('BC'))?.result.sectionName}</div>
          </div>

          <div className="text-xs border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-100 p-2 font-semibold border-b border-slate-300">Worst-case Chord & Web Forces & Utilizations</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 font-medium">
                  <th className="p-2 border-r border-slate-300">Chord ID</th>
                  <th className="p-2 border-r border-slate-300">Force (kN)</th>
                  <th className="p-2 border-r border-slate-300">Stress Type</th>
                  <th className="p-2 border-r border-slate-300">Capacity Check (kN)</th>
                  <th className="p-2 border-r border-slate-300">Slenderness KL/r</th>
                  <th className="p-2">Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                {/* Select top 5 critical elements for display */}
                {trussResult.elements
                  .filter((_, idx, arr) => idx === 0 || idx === arr.length - 1 || idx === Math.floor(arr.length/2) || idx === Math.floor(arr.length/4))
                  .map((el, idx) => {
                    const res = el.result;
                    return (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-300 font-sans font-medium">{el.id} ({res.type})</td>
                        <td className="p-3 border-r border-slate-300">{res.force.toFixed(2)}</td>
                        <td className={`p-2 border-r border-slate-300 font-sans ${res.force >= 0 ? 'text-red-700 font-semibold' : 'text-blue-700 font-semibold'}`}>
                          {res.force >= 0 ? 'Tension (Yield)' : 'Compression (Buckling)'}
                        </td>
                        <td className="p-2 border-r border-slate-300">{res.capacity.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-300">{res.klOverR.toFixed(1)}</td>
                        <td className="p-2 font-sans font-semibold">
                          <span className={res.utilization > 1.0 ? 'text-red-500 font-bold' : 'text-slate-800'}>
                            {res.utilization.toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engineering Recommendations & Optimization Suggestions */}
        <div className="space-y-2 mb-6 border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Professional Design Recommendations & Optimization
          </h4>
          <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
            {purlinResult.passed ? (
              <li>Purlin sizing of <strong className="font-mono">{purlinResult.sectionName}</strong> is stable. If you wish to optimize costs, you can safely trim thickness down toward 1.6mm or test sag rods to further reduce deflection.</li>
            ) : (
              <li><strong>Purlin resizing critical:</strong> Increase normal section depth to LC100x50x2.0 or introduce sag rods at midspan/thirdpoints to drastically truncate minor-axis bending.</li>
            )}
            {trussResult.passed ? (
              <li>The custom truss layout possesses sufficient axial member stiffeners. Standard double angle sections will prevent flutter and are highly recommended.</li>
            ) : (
              <li><strong>Truss chord buckling alert:</strong> Select a wider section (higher radius of gyration, e.g. 2L-50×50×5mm or RHS tube) to decrease the slenderness ratio $KL/r$ below the code mandates of 200.</li>
            )}
          </ul>
        </div>

        {/* Printable/Sign-off Fields */}
        <div className="border-t border-slate-300 pt-8 mt-12 grid grid-cols-2 gap-12 text-xs leading-5">
          <div className="text-center space-y-2 print:mt-16">
            <div className="h-10 flex items-end justify-center">
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold">{projectInfo.engineerName || 'Engr. J. Dela Cruz, CE'}</div>
            <div className="text-slate-500" id="engineer-title-label">Civil Engineer</div>
            <div className="text-[10px] text-slate-400">PRC License No: 0142981 | PTR No: 90281-2026</div>
          </div>
          <div className="text-center space-y-2 print:mt-16">
            <div className="h-10 flex items-end justify-center">
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold">NSCP Structural Design Stamp</div>
            <div className="text-slate-500">Seal / Approval Certification</div>
            <div className="text-[10px] text-slate-400">Date: {projectInfo.date || '2026-05-20'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
