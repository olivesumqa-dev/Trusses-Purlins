import React, { useState } from 'react';
import { ProjectState, TrussResult, PurlinResult, SectionProfile } from '../types';
import { Compass, Eye, ShieldAlert, TrendingUp, HelpCircle } from 'lucide-react';
import { STEEL_GRADES } from '../utils/sectionsDB';

interface GraphicsViewProps {
  state: ProjectState;
  trussResult: TrussResult;
  purlinResult: PurlinResult;
}

export default function GraphicsView({ state, trussResult, purlinResult }: GraphicsViewProps) {
  const [activeSubView, setActiveSubView] = useState<'truss' | 'roof' | 'purlin_bmd'>('truss');
  const [showLoads, setShowLoads] = useState<boolean>(true);
  const [showPurlinsOnTruss, setShowPurlinsOnTruss] = useState<boolean>(true);
  const [scaleFactor, setScaleFactor] = useState<number>(30); // scale up truss displacement for drawing

  const { trussInputs, roofGeometry, purlinInputs } = state;
  const H = trussInputs.height;
  const S = trussInputs.span;

  // Render Roof Isometric/2D Profile
  const renderRoofProfile = () => {
    const padding = 40;
    const width = 600;
    const height = 300;
    
    // Scale fitting
    const xMin = -state.roofGeometry.overhang;
    const xMax = S + state.roofGeometry.overhang;
    const yMax = Math.max(H, state.roofGeometry.eaveHeight) + 1;
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / yMax;
    const scale = Math.min(scaleX, scaleY);

    const getX = (x: number) => padding + (x - xMin) * scale;
    const getY = (y: number) => height - padding - y * scale;

    const eaveH = state.roofGeometry.eaveHeight;
    const ridgeH = eaveH + H;

    // Left overhang coordinate
    const ohX1 = -state.roofGeometry.overhang;
    const ohY1 = eaveH - (state.roofGeometry.overhang * H) / (S / 2); // extend slope downwards eave
    
    // Right overhang coordinate
    const ohX2 = S + state.roofGeometry.overhang;
    const ohY2 = ohY1;

    // Coordinates of columns
    const colLeftBase = { x: 0, y: 0 };
    const colLeftTop = { x: 0, y: eaveH };
    const colRightBase = { x: S, y: 0 };
    const colRightTop = { x: S, y: eaveH };

    // Coordinates of Roof rafters (top surface)
    const rafterLeft = { x: ohX1, y: ohY1 };
    const rafterRidge = { x: S / 2, y: ridgeH };
    const rafterRight = { x: ohX2, y: ohY2 };

    // Number of purlins
    const nPurlins = state.purlinInputs.spacing ? Math.floor((S / 2) / state.purlinInputs.spacing) + 1 : 4;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans font-medium text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            Roof Elevation & Purlin Distribution
          </h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400">
            Scale: 1 : {Math.round(100 / (scale / 40) || 1)}
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800/40">
          {/* Ground Line */}
          <line x1={0} y1={height - padding} x2={width} y2={height - padding} stroke="#94a3b8" strokeWidth={2} />
          
          {/* Columns */}
          <line x1={getX(colLeftBase.x)} y1={getY(colLeftBase.y)} x2={getX(colLeftTop.x)} y2={getY(colLeftTop.y)} stroke="#475569" strokeWidth={5} />
          <line x1={getX(colRightBase.x)} y1={getY(colRightBase.y)} x2={getX(colRightTop.x)} y2={getY(colRightTop.y)} stroke="#475569" strokeWidth={5} />
          
          {/* Wall Infills (light grey) */}
          <rect x={getX(0)} y={getY(eaveH)} width={S * scale} height={eaveH * scale} fill="url(#brick_pattern)" fillOpacity={0.06} stroke="#cbd5e1" strokeDasharray="4 4" />

          {/* Plinth block */}
          <rect x={getX(0) - 10} y={height - padding - 6} width={10} height={6} fill="#334155" />
          <rect x={getX(S)} y={height - padding - 6} width={10} height={6} fill="#334155" />

          {/* Rafter line/Roof slope line */}
          <line x1={getX(rafterLeft.x)} y1={getY(rafterLeft.y)} x2={getX(rafterRidge.x)} y2={getY(rafterRidge.y)} stroke="#0f172a" strokeWidth={4} />
          <line x1={getX(rafterRidge.x)} y1={getY(rafterRidge.y)} x2={getX(rafterRight.x)} y2={getY(rafterRight.y)} stroke="#0f172a" strokeWidth={4} strokeLinecap='round' />

          {/* Ceiling/Tye tie level */}
          <line x1={getX(0)} y1={getY(eaveH)} x2={getX(S)} y2={getY(eaveH)} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />

          {/* Draw purlins as small rectangular blocks on the slope */}
          {Array.from({ length: nPurlins + 1 }).map((_, idx) => {
            // Left Slope Purlin positions
            const ratio = idx / nPurlins;
            const pxLeft = ohX1 + (S/2 - ohX1) * ratio;
            const pyLeft = ohY1 + (ridgeH - ohY1) * ratio;

            // Right slope purlins
            const pxRight = S/2 + (ohX2 - S/2) * ratio;
            const pyRight = ridgeH - (ridgeH - ohY2) * ratio;

            return (
              <g key={idx}>
                {/* Left side purlin box */}
                <rect 
                  x={getX(pxLeft) - 3} 
                  y={getY(pyLeft) - 6} 
                  width={6} 
                  height={8} 
                  fill="#0284c7" 
                  stroke="#ffffff" 
                  strokeWidth={0.5} 
                  transform={`rotate(${-state.roofGeometry.slopeAngle}, ${getX(pxLeft)}, ${getY(pyLeft)})`}
                />
                {/* Right side purlin box */}
                <rect 
                  x={getX(pxRight) - 3} 
                  y={getY(pyRight) - 6} 
                  width={6} 
                  height={8} 
                  fill="#0284c7" 
                  stroke="#ffffff" 
                  strokeWidth={0.5} 
                  transform={`rotate(${state.roofGeometry.slopeAngle}, ${getX(pxRight)}, ${getY(pyRight)})`}
                />
              </g>
            );
          })}

          {/* Cladding Visual representation - parallel line above rafter */}
          <path 
            d={`M ${getX(rafterLeft.x)} ${getY(rafterLeft.y) - 6} L ${getX(rafterRidge.x)} ${getY(rafterRidge.y) - 6} L ${getX(rafterRight.x)} ${getY(rafterRight.y) - 6}`}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
          />

          {/* Roof Ridge Cap */}
          <path d={`M ${getX(rafterRidge.x) - 10} ${getY(rafterRidge.y) - 3} L ${getX(rafterRidge.x)} ${getY(rafterRidge.y) - 13} L ${getX(rafterRidge.x) + 10} ${getY(rafterRidge.y) - 3}`} fill="#047857" />

          {/* Dimension texts */}
          <text x={getX(S / 2)} y={getY(ridgeH) + 25} className="fill-slate-500 dark:fill-slate-400 font-sans font-medium text-xs text-center" textAnchor="middle">
            Pitch: {state.roofGeometry.slopeAngle.toFixed(1)}° ({state.roofGeometry.type})
          </text>

          {/* Span line */}
          <line x1={getX(0)} y1={getY(-0.3)} x2={getX(S)} y2={getY(-0.3)} stroke="#64748b" strokeWidth={1} />
          <line x1={getX(0)} y1={getY(-0.1)} x2={getX(0)} y2={getY(-0.5)} stroke="#64748b" strokeWidth={1} />
          <line x1={getX(S)} y1={getY(-0.1)} x2={getX(S)} y2={getY(-0.5)} stroke="#64748b" strokeWidth={1} />
          <text x={getX(S / 2)} y={getY(-0.6)} className="fill-slate-500 dark:fill-slate-400 text-xs" textAnchor="middle">
            Building Width/Truss Span = {S} m
          </text>

          {/* Eave Height label */}
          <line x1={getX(-0.3)} y1={getY(0)} x2={getX(-0.3)} y2={getY(eaveH)} stroke="#64748b" strokeWidth={1} />
          <text x={getX(-0.6)} y={getY(eaveH / 2)} className="fill-slate-500 dark:fill-slate-400 text-xs" textAnchor="end" transform={`rotate(-90, ${getX(-0.6)}, ${getY(eaveH / 2)})`}>
            Eave Height = {eaveH} m
          </text>

          {/* Pattern Definition */}
          <defs>
            <pattern id="brick_pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="10" height="5" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
              <rect x="5" y="5" width="10" height="5" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
        </svg>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded">
            <span className="text-slate-400 block">Span Length:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{S} meters</strong>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded">
            <span className="text-slate-400 block">Roof Ridge Rise (H):</span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{H} meters</strong>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded">
            <span className="text-slate-400 block">Shed Area (approx):</span>
            <strong className="text-slate-700 dark:text-slate-300 font-mono">{(state.roofGeometry.buildingLength * S).toFixed(1)} m²</strong>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded">
            <span className="text-slate-400 block">Slope Angle:</span>
            <strong className="text-emerald-500 font-mono">{state.roofGeometry.slopeAngle.toFixed(1)}°</strong>
          </div>
        </div>
      </div>
    );
  };

  // Render 2D Finite Element Truss forces
  const renderTrussView = () => {
    if (!trussResult || !trussResult.nodes) {
      return (
        <div className="bg-orange-50 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Truss results are not available. Please check geometric limits.</p>
        </div>
      );
    }

    const padding = 50;
    const width = 800;
    const height = 300;

    // Scale fitting of Truss coordinates
    let minX = 0, maxX = S, minY = 0, maxY = H;
    // Find limits (supports bounds)
    const scaleX = (width - 2 * padding) / S;
    const scaleY = (height - 2 * padding) / (H || 1);
    const scale = Math.min(scaleX, scaleY);

    const getX = (x: number) => padding + x * scale;
    const getY = (y: number) => height - padding - y * scale;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="font-sans font-medium text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-500" />
              Structural FE Solver - Axial Member Forces
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1.5 font-sans">
              Solid line color-coding: <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-200/35 dark:border-red-900/35">Thick Red = Tension (+)</span> | <span className="text-blue-600 dark:text-sky-400 font-bold bg-blue-50 dark:bg-sky-950/20 px-1.5 py-0.5 rounded border border-blue-200/35 dark:border-sky-900/35">Thick Blue/Sky = Compression (-)</span> | <span className="text-slate-450 dark:text-slate-500 font-normal bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/35 dark:border-slate-800">Thin Gray = Zero Force</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 self-end sm:self-auto">
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showLoads} 
                onChange={(e) => setShowLoads(e.target.checked)} 
                className="rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              Show Nodal Loads (Yellow)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showPurlinsOnTruss} 
                onChange={(e) => setShowPurlinsOnTruss(e.target.checked)} 
                className="rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              Show Purlin Distribution & Loads (Amber)
            </label>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          {/* Pins & Supports */}
          {/* Node 0 Pin support triangle */}
          <polygon 
            points={`${getX(0)},${getY(0)} ${getX(0) - 10},${getY(0) + 12} ${getX(0) + 10},${getY(0) + 12}`} 
            className="fill-slate-500 dark:fill-slate-400 stroke-slate-600 dark:stroke-slate-500" 
            strokeWidth={1} 
          />
          <line x1={getX(0) - 15} y1={getY(0) + 12} x2={getX(0) + 15} y2={getY(0) + 12} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth={2} />

          {/* Node Np Roller support */}
          <circle cx={getX(S)} cy={getY(0) + 6} r={5} fill="none" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth={2} />
          <line x1={getX(S) - 15} y1={getY(0) + 12} x2={getX(S) + 15} y2={getY(0) + 12} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth={2} />

          {/* Grid lines helper */}
          <line x1={0} y1={getY(0)} x2={width} y2={getY(0)} className="stroke-slate-300 dark:stroke-slate-800" strokeWidth={1} strokeDasharray="3 3" />

          {/* Draw Truss Members */}
          {trussResult.elements.map((el) => {
            const n1 = trussResult.nodes.find(n => n.id === el.n1);
            const n2 = trussResult.nodes.find(n => n.id === el.n2);
            if (!n1 || !n2) return null;

            // Decide styling classes based on compression/tension force with highly visible colors
            let strokeClass = 'stroke-slate-300 dark:stroke-slate-700'; // zero/low force (very clear thin grey)
            let textClass = 'fill-slate-400 dark:fill-slate-500';
            let forceText = '';
            let forceThicknessBoost = 0;
            
            if (el.force > 0.1) {
              strokeClass = 'stroke-red-600 dark:stroke-red-500'; // Tension = Red
              textClass = 'fill-red-700 dark:fill-red-400 font-bold';
              forceText = `+${el.force.toFixed(1)} kN`;
              forceThicknessBoost = 3.0; // thicker lines for Tension
            } else if (el.force < -0.1) {
              strokeClass = 'stroke-blue-600 dark:stroke-sky-400'; // Compression = Blue (Light Mode) or Sky (Dark Mode)
              textClass = 'fill-blue-700 dark:fill-sky-400 font-bold';
              forceText = `${el.force.toFixed(1)} kN`;
              forceThicknessBoost = 3.0; // thicker lines for Compression
            } else {
              forceText = '0.0 kN';
            }

            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;

            // Highlight thickness based on utilization and loaded state boost
            const strokeWidth = el.result ? (2.0 + forceThicknessBoost) + el.result.utilization * 4 : (2.0 + forceThicknessBoost);

            return (
              <g key={el.id}>
                {/* Visual beam element */}
                <line 
                  x1={getX(n1.x)} 
                  y1={getY(n1.y)} 
                  x2={getX(n2.x)} 
                  y2={getY(n2.y)} 
                  className={strokeClass} 
                  strokeWidth={strokeWidth > 5 ? 5 : strokeWidth} 
                  strokeLinecap="round"
                />

                {/* Force value on hover/visible text */}
                <circle cx={getX(midX)} cy={getY(midY)} r={2} className="fill-slate-400 dark:fill-slate-600 cursor-pointer" />
                <text 
                  x={getX(midX)} 
                  y={getY(midY) - 5} 
                  className={`${textClass} pointer-events-none font-mono text-[9px]`}
                  textAnchor="middle"
                >
                  {Math.abs(el.force) > 0.5 ? forceText : ''}
                </text>
                
                {/* Small section text inside members */}
                {/* <text x={getX(midX)} y={getY(midY) + 12} className="fill-slate-500 font-sans text-[7px]" textAnchor="middle">{el.id}</text> */}
              </g>
            );
          })}

          {/* Draw Load vectors/arrows if checked */}
          {showLoads && trussResult.nodes.map((n) => {
            const hasForce = Math.abs(n.forces.Fx) > 0.1 || Math.abs(n.forces.Fy) > 0.1;
            if (!hasForce) return null;

            const Fx = n.forces.Fx;
            const Fy = n.forces.Fy;

            // Vector arrow components in pixels
            // downward load points down, wind suction points outward (mostly up)
            const arrowLength = 35;
            const headingAngle = Math.atan2(Fy, Fx);
            
            // Draw loading arrow vector pushing or pulling at node
            // For downward gravity loads, arrow points down to node
            const xNode = getX(n.x);
            const yNode = getY(n.y);
            
            // We want arrow to terminate at the node, so we start from offset
            // Force vector is (Fx, Fy)
            // Normalizing force vector:
            const mag = Math.sqrt(Fx * Fx + Fy * Fy);
            if (mag < 0.1) return null;
            const uX = Fx / mag;
            const uY = Fy / mag;

            const xStart = xNode - uX * arrowLength;
            const yStart = yNode + uY * arrowLength; // Screen y is inverted

            return (
              <g key={`ld-${n.id}`}>
                <line 
                  x1={xStart} 
                  y1={yStart} 
                  x2={xNode} 
                  y2={yNode} 
                  className="stroke-amber-600 dark:stroke-amber-400" 
                  strokeWidth={2} 
                  markerEnd="url(#arrow)" 
                />
                
                {/* Arrowhead */}
                <polygon 
                  points={`${xNode},${yNode} ${xNode - uX*6 + uY*3},${yNode + uY*6 + uX*3} ${xNode - uX*6 - uY*3},${yNode + uY*6 - uX*3}`} 
                  className="fill-amber-600 dark:fill-amber-400" 
                />

                {/* Force Value */}
                <text 
                  x={xStart - uX * 5} 
                  y={yStart + uY * 5 + 4} 
                  className="fill-amber-705 dark:fill-amber-400 font-mono font-semibold text-[9px]"
                  textAnchor="middle"
                >
                  {mag.toFixed(1)} kN
                </text>
              </g>
            );
          })}

          {/* Draw nodes as small pins */}
          {trussResult.nodes.map((n) => (
            <circle 
              key={`node-${n.id}`} 
              cx={getX(n.x)} 
              cy={getY(n.y)} 
              r={4} 
              className="fill-slate-105 dark:fill-slate-900 stroke-slate-800 dark:stroke-slate-200 cursor-pointer hover:stroke-emerald-500 dark:hover:stroke-emerald-400" 
              strokeWidth={1.5}
            />
          ))}

          {/* Superimpose Purlins and their forces on top chords */}
          {showPurlinsOnTruss && (() => {
            const theta = (state.roofGeometry.slopeAngle * Math.PI) / 180;
            const L_slope = Math.sqrt((S / 2) * (S / 2) + H * H);
            const s = state.purlinInputs.spacing || 0.8;
            
            // Build the discrete list of distances along the rafter chord
            const stations: number[] = [];
            for (let d = 0; d <= L_slope + 0.05; d += s) {
              if (d > L_slope + 0.01) break;
              stations.push(d);
            }
            // Add a purlin near the ridge apex specifically if not covered as safe measure
            if (stations.length > 0 && Math.abs(stations[stations.length - 1] - L_slope) > 0.15) {
              stations.push(L_slope);
            }

            const section = state.purlinInputs.sections[state.purlinInputs.selectedIndex] || state.purlinInputs.sections[0];
            const w_self = state.purlinInputs.selfWeightInclusion ? (section.weight * 9.8066) / 1000 : 0;
            
            const dead_sqm = (state.loads.dead.roofingWeight || 0) + (state.loads.dead.insulation || 0) + (state.loads.dead.ceiling || 0) + (state.loads.dead.lightingMech || 0) + (state.loads.dead.solarPanels || 0);
            const live_sqm = state.loads.live.roofLiveLoad || 0.60;
            const wind_kPa = purlinResult.windPressure || 0;
            const L_truss = state.trussInputs.trussSpacing;

            // Single purlin point forces. Gravity is downward vertical. Wind is normal.
            const p_DL = (dead_sqm * s + w_self) * L_truss;
            const p_LL = (live_sqm * s) * L_truss; // vertical projection
            const p_WL = Math.abs(wind_kPa) * s * L_truss;

            return (
              <g id="truss-purlin-overlay">
                {stations.map((d, index) => {
                  // Left rafter chords
                  const xL = d * Math.cos(theta);
                  const yL = d * Math.sin(theta);

                  // Right rafter chords
                  const xR = S - d * Math.cos(theta);
                  const yR = d * Math.sin(theta);

                  const pxL = getX(xL);
                  const pyL = getY(yL);
                  const pxR = getX(xR);
                  const pyR = getY(yR);

                  return (
                    <g key={`truss-pur-pt-${index}`}>
                      {/* Left Purlin Box */}
                      <rect 
                        x={pxL - 4} 
                        y={pyL - 8} 
                        width={8} 
                        height={6} 
                        className="cursor-help fill-sky-600 dark:fill-sky-500 stroke-slate-350 dark:stroke-slate-705 hover:fill-amber-400 transition" 
                        strokeWidth={0.5} 
                        rx={1}
                        transform={`rotate(${-state.roofGeometry.slopeAngle}, ${pxL}, ${pyL})`}
                      >
                        <title>
                          {`Left Purlin #${index + 1}\n- Distance from eave: ${d.toFixed(2)} m\n- Vertical node load:\n  DL: ${p_DL.toFixed(2)} kN\n  LL: ${p_LL.toFixed(2)} kN\n  Wind uplift: ${p_WL.toFixed(2)} kN`}
                        </title>
                      </rect>

                      {/* Left vertical amber arrow pushing normal-down */}
                      {showLoads && (
                        <g>
                          <line 
                            x1={pxL} 
                            y1={pyL - 25} 
                            x2={pxL} 
                            y2={pyL - 2} 
                            className="stroke-amber-600 dark:stroke-amber-450" 
                            strokeWidth={2} 
                          />
                          <polygon 
                            points={`${pxL},${pyL - 1} ${pxL - 3},${pyL - 5} ${pxL + 3},${pyL - 5}`} 
                            className="fill-amber-600 dark:fill-amber-450" 
                          />
                        </g>
                      )}

                      {/* Right Purlin block */}
                      {d > 0.05 && xL < S / 2 - 0.05 && (
                        <g>
                          {/* Right Purlin Box */}
                          <rect 
                            x={pxR - 4} 
                            y={pyR - 8} 
                            width={8} 
                            height={6} 
                            className="cursor-help fill-sky-600 dark:fill-sky-500 stroke-slate-350 dark:stroke-slate-705 hover:fill-amber-400 transition" 
                            strokeWidth={0.5} 
                            rx={1}
                            transform={`rotate(${state.roofGeometry.slopeAngle}, ${pxR}, ${pyR})`}
                          >
                            <title>
                              {`Right Purlin #${index + 1}\n- Distance from eave: ${d.toFixed(2)} m\n- Vertical node load:\n  DL: ${p_DL.toFixed(2)} kN\n  LL: ${p_LL.toFixed(2)} kN\n  Wind uplift: ${p_WL.toFixed(2)} kN`}
                            </title>
                          </rect>

                          {/* Right vector load */}
                          {showLoads && (
                            <g>
                              <line 
                                x1={pxR} 
                                y1={pyR - 25} 
                                x2={pxR} 
                                y2={pyR - 2} 
                                className="stroke-amber-600 dark:stroke-amber-450" 
                                strokeWidth={2} 
                              />
                              <polygon 
                                points={`${pxR},${pyR - 1} ${pxR - 3},${pyR - 5} ${pxR + 3},${pyR - 5}`} 
                                className="fill-amber-600 dark:fill-amber-450" 
                              />
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* Labels for Supports */}
          <text x={getX(0)} y={getY(0) + 25} className="fill-slate-500 dark:fill-slate-400 text-[10px]" textAnchor="middle">Pinned Support</text>
          <text x={getX(S)} y={getY(0) + 25} className="fill-slate-500 dark:fill-slate-400 text-[10px]" textAnchor="middle">Roller Support (Expansion)</text>
        </svg>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded">
            <span className="text-slate-400 block">Critical Member Load (Compression):</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
              {Math.min(...trussResult.elements.map(el => el.force)).toFixed(1)} kN
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded">
            <span className="text-slate-400 block">Max Tensile Force (Tension):</span>
            <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
              {Math.max(...trussResult.elements.map(el => el.force)).toFixed(1)} kN
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded col-span-2 md:col-span-1">
            <span className="text-slate-400 block">Truss Midspan Deflex/Disp:</span>
            <strong className={`font-mono ${trussResult.maxDisplacement > (S*1000/240) ? 'text-red-500' : 'text-emerald-500'}`}>
              {trussResult.maxDisplacement.toFixed(2)} mm (Allowable: {((S * 1000) / 240).toFixed(1)} mm)
            </strong>
          </div>
        </div>

        {/* Purlin-to-Truss Load Transference Breakdown Panel */}
        {showPurlinsOnTruss && (() => {
          const theta = (state.roofGeometry.slopeAngle * Math.PI) / 180;
          const s = state.purlinInputs.spacing || 0.8;
          const section = state.purlinInputs.sections[state.purlinInputs.selectedIndex] || state.purlinInputs.sections[0];
          const w_self = state.purlinInputs.selfWeightInclusion ? (section.weight * 9.8066) / 1000 : 0;
          
          const dead_sqm = (state.loads.dead.roofingWeight || 0) + (state.loads.dead.insulation || 0) + (state.loads.dead.ceiling || 0) + (state.loads.dead.lightingMech || 0) + (state.loads.dead.solarPanels || 0);
          const live_sqm = state.loads.live.roofLiveLoad || 0.60;
          const wind_kPa = purlinResult.windPressure || 0;
          const L_truss = state.trussInputs.trussSpacing;

          const p_DL = (dead_sqm * s + w_self) * L_truss;
          const p_LL = (live_sqm * s) * L_truss; 
          const p_WL = Math.abs(wind_kPa) * s * L_truss; // normal wind pressure/suction load

          const p_ASD = p_DL + p_LL;
          const p_LRFD = 1.2 * p_DL + 1.6 * p_LL;

          return (
            <div className="mt-4 p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/10 rounded-lg text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:justify-between border-b border-slate-150 dark:border-slate-800 pb-1.5 matches-theme">
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                  Purlin-to-Truss Load Transference Breakdown (NSCP Chapter 5)
                </span>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900 font-bold self-start sm:self-auto shrink-0">
                  Spacing: {s} m | Span (Bays): {L_truss} m
                </span>
              </div>
              
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Purlins act as beam elements spanning between adjacent wind bracing. Cladding loads and wind pressures are tributary to each purlin station, and concentrated as point reactions applied directly onto the truss top chords (rendered as <span className="text-amber-500 font-bold">amber vector arrows</span>).
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 pt-1">
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-2 rounded">
                  <span className="text-slate-404 dark:text-slate-500 text-[9px] uppercase font-mono block">Dead Load (p_DL)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{p_DL.toFixed(2)} kN</strong>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">(Slab + self-wt)</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-2 rounded">
                  <span className="text-slate-404 dark:text-slate-500 text-[9px] uppercase font-mono block">Live Load (p_LL)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{p_LL.toFixed(2)} kN</strong>
                  <span className="text-[9px] text-slate-404 dark:text-slate-500 block mt-0.5">(Maintenance, RLL)</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-2 rounded">
                  <span className="text-slate-404 dark:text-slate-500 text-[9px] uppercase font-mono block">Wind Pres. (p_WL)</span>
                  <strong className="text-[#0ea5e9] dark:text-sky-450 font-mono text-sm">{p_WL.toFixed(2)} kN</strong>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">({wind_kPa > 0 ? 'Pressure' : 'Uplift Suction'})</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900 bg-sky-50/10 p-2 rounded">
                  <span className="text-sky-600 dark:text-sky-400 text-[9px] uppercase font-mono block font-bold">ASD Service Pt.</span>
                  <strong className="text-sky-700 dark:text-sky-400 font-mono text-sm font-bold">{(p_DL + p_LL).toFixed(2)} kN</strong>
                  <span className="text-[9px] text-sky-500/80 block mt-0.5">(Service: D + L)</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-905 bg-purple-50/10 p-2 rounded">
                  <span className="text-purple-600 dark:text-purple-400 text-[9px] uppercase font-mono block font-bold">LRFD Factored Pt.</span>
                  <strong className="text-purple-700 dark:text-purple-400 font-mono text-sm font-bold">{p_LRFD.toFixed(2)} kN</strong>
                  <span className="text-[9px] text-purple-500/80 block mt-0.5">(Factored: 1.2D+1.6L)</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // Render Purlin Bending Moment Data (BMD) and Shear Diagram (SFD)
  const renderPurlinBmd = () => {
    const padding = 40;
    const width = 600;
    const height = 180;
    
    // Grab critical values from purlin results
    const combo = purlinResult.combos.find(c => c.name === purlinResult.criticalComboName) || purlinResult.combos[0];
    const wn = combo ? combo.wn : 0.8; // default shear logic line load

    const getX = (x: number) => padding + (x / purlinResult.span) * (width - 2 * padding);
    const getY = (y: number, maxVal: number) => {
      if (Math.abs(maxVal) < 1e-6) return height / 2;
      // y scaled to maxVal
      const graphHeight = (height - 2 * padding) / 2;
      return height / 2 + (y / maxVal) * graphHeight;
    };

    // Construct curve coordinates
    const span = purlinResult.span;
    const steps = 60;
    const ptsMoment: string[] = [];
    const ptsShear: string[] = [];

    // Max values for scaling
    // M = w L^2 / 8, V = w L / 2
    const maxM = Math.abs(wn * span * span / 8);
    const maxV = Math.abs(wn * span / 2);

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * span;
      
      // Simply supported curves
      // Moment: M(x) = w/2 * (L*x - x^2)
      const mx = (wn / 2) * (span * x - x * x);
      // Shear: V(x) = w * (L/2 - x)
      const vx = wn * (span / 2 - x);

      ptsMoment.push(`${getX(x)},${getY(-mx, maxM || 1)}`);
      ptsShear.push(`${getX(x)},${getY(vx, maxV || 1)}`);
    }

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-sans font-medium text-slate-800 dark:text-slate-200 text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-rose-500" />
          Purlin Analytical Diagrams - Crit Combo: {purlinResult.criticalComboName}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-950/20">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-2">Bending Moment Diagram (Mx Major axis)</span>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#94a3b8" strokeWidth={1} />
              
              {/* Curve of moment */}
              <polyline points={ptsMoment.join(' ')} fill="none" stroke="#f43f5e" strokeWidth={2.5} />
              
              {/* Fill pattern under moment */}
              <path 
                d={`M ${getX(0)} ${height/2} ${ptsMoment.join(' ')} L ${getX(span)} ${height/2} Z`}
                fill="#f43f5e"
                fillOpacity={0.08}
              />

              {/* Labels */}
              <text x={getX(0)} y={height / 2 + 15} className="fill-slate-400 text-[10px]" textAnchor="start">Support</text>
              <text x={getX(span)} y={height / 2 + 15} className="fill-slate-400 text-[10px]" textAnchor="end">Support</text>
              <text x={getX(span/2)} y={getY(-maxM, maxM || 1) - 8} className="fill-rose-600 dark:fill-rose-400 font-mono font-bold text-xs" textAnchor="middle">
                Mmax = {maxM.toFixed(2)} kN-m
              </text>
            </svg>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-950/20">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-2">Shear Force Diagram (Vy Major Axis)</span>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#94a3b8" strokeWidth={1} />
              
              {/* Shear line */}
              <polyline points={ptsShear.join(' ')} fill="none" stroke="#2563eb" strokeWidth={2.5} />
              
              {/* Fill */}
              <path 
                d={`M ${getX(0)} ${height/2} ${ptsShear.join(' ')} L ${getX(span)} ${height/2} Z`}
                fill="#2563eb"
                fillOpacity={0.08}
              />

              {/* Labels */}
              <text x={getX(0.1)} y={getY(maxV, maxV || 1) - 8} className="fill-blue-600 dark:fill-blue-400 font-mono font-semibold text-[10px]" textAnchor="start">
                +{(maxV).toFixed(1)} kN
              </text>
              <text x={getX(span - 0.1)} y={getY(-maxV, maxV || 1) + 12} className="fill-blue-600 dark:fill-blue-400 font-mono font-semibold text-[10px]" textAnchor="end">
                -{(maxV).toFixed(1)} kN
              </text>
              <text x={getX(span/2)} y={height/2 - 5} className="fill-slate-500 text-[9px]" textAnchor="middle">V=0</text>
            </svg>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 p-2 rounded flex gap-2 items-center">
          <HelpCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Note: Sag rods placed laterally along the purlins significantly reduce minor axis bending moments (My), leaving the major axis beam equations above as the principal loading path for purlin selection.</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Visual Navigation Subbars */}
      <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg self-start gap-1">
        <button 
          onClick={() => setActiveSubView('truss')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border ${
            activeSubView === 'truss' 
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white' 
              : 'bg-slate-200/30 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 border-slate-200/20 dark:border-slate-700/20 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Truss FE Axial Forces
        </button>
        <button 
          onClick={() => setActiveSubView('roof')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border ${
            activeSubView === 'roof' 
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white' 
              : 'bg-slate-200/30 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 border-slate-200/20 dark:border-slate-700/20 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Roof Elevation View
        </button>
        <button 
          onClick={() => setActiveSubView('purlin_bmd')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border ${
            activeSubView === 'purlin_bmd' 
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white' 
              : 'bg-slate-200/30 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 border-slate-200/20 dark:border-slate-700/20 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Purlin Moment/Shear Diagram
        </button>
      </div>

      <div>
        {activeSubView === 'truss' && renderTrussView()}
        {activeSubView === 'roof' && renderRoofProfile()}
        {activeSubView === 'purlin_bmd' && renderPurlinBmd()}
      </div>
    </div>
  );
}
