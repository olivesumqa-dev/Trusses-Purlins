import { PurlinInputs, CargoLoads, PurlinResult, SectionProfile, SteelGrade } from '../types';
import { STEEL_GRADES, ROOF_CLADDING_DBS } from './sectionsDB';

export function solvePurlin(
  purlin: PurlinInputs,
  loads: CargoLoads,
  roofSlopeAngle: number, // in degrees
  designMethod: 'ASD' | 'LRFD'
): PurlinResult {
  const theta = (roofSlopeAngle * Math.PI) / 180;
  const L = purlin.span; // meter (Truss Spacing)
  const spacing = purlin.spacing; // meter
  
  // 1. Get Section Property
  const section: SectionProfile = purlin.sections[purlin.selectedIndex] || purlin.sections[0];
  
  // 2. Compute Steel Material properties
  const selectedGrade = purlin.steelGrade || 'G250_Cold';
  const mat = STEEL_GRADES[selectedGrade] || STEEL_GRADES.G250_Cold;
  const Fy = purlin.overrideFy ? purlin.manualFy : mat.fy;
  const Fu = mat.fu;
  const E = mat.e;

  // 3. Dead Load Calculation
  const roofingW_sqm = loads.dead.roofingWeight; // kPa
  const insulation_sqm = loads.dead.insulation; // kPa
  const ceiling_sqm = loads.dead.ceiling; // kPa
  const lightMech_sqm = loads.dead.lightingMech; // kPa
  const solar_sqm = loads.dead.solarPanels; // kPa

  let dl_sqm = roofingW_sqm + insulation_sqm + ceiling_sqm + lightMech_sqm + solar_sqm;
  
  // Purlin self-weight in kN/m
  const purlinSelfWeight_nm = purlin.selfWeightInclusion ? (section.weight * 9.81) / 1000 : 0; // kN/m

  // Dead Load on purlin as uniform line load (kN/m) along the sloped roof
  const dl_line_gravity = dl_sqm * spacing + purlinSelfWeight_nm; // kN/m

  // 4. Live Load Calculation
  // NSCP 2015 Live Load for un-accessible or sloped roofs is typically 0.60 kPa. 
  // It is applied on horizontal projection, but we can resolve it.
  const ll_sqm = loads.live.roofLiveLoad; // kPa
  const ll_line_gravity = ll_sqm * spacing * Math.cos(theta); // kN/m

  // 5. Wind Load Calculation (Wind pressure q is already calculated per sqm)
  // Let's compute NSCP Wind Pressure qz
  // NSCP 2015 Simplified Wind Load or MWFRS Wind Load Formula:
  // p = q * Gh * Cp - qi * (GCpi)
  // Let's implement a clean simplified version for Philippine roofs:
  // We determine the Design Wind Pressure on Roof based on:
  // q = 0.613 * Kz * Kzt * Kd * V^2 * I_occupancy (in N/m^2) where V is in m/s
  // V is in kph. V_ms = V / 3.6
  const V_kph = loads.wind.basicWindSpeed;
  const V_ms = V_kph / 3.6;
  
  // Exposure velocity pressure coefficient Kz estimation based on eave height
  // Assumed eave height can be around 5m as typical or 6m. Let's assume Kz = 0.85 for Exposure B, 1.0 for Exposure C, 1.15 for D
  let Kz = 0.85;
  if (loads.wind.exposureCategory === 'C') Kz = 1.0;
  if (loads.wind.exposureCategory === 'D') Kz = 1.15;

  const Kd = loads.wind.kd; // typically 0.85
  const Kzt = loads.wind.kzt; // 1.0
  
  // Occupancy Importance Factor based on category
  let I_factor = 1.0;
  if (loads.wind.occupancyCategory === 'Essential') I_factor = 1.15;
  if (loads.wind.occupancyCategory === 'Hazardous') I_factor = 1.15;
  if (loads.wind.occupancyCategory === 'Miscellaneous') I_factor = 0.87;

  // Velocity pressure q (kPa)
  const q_pa = 0.613 * Kz * Kzt * Kd * Math.pow(V_ms, 2) * I_factor;
  const q_kpa = q_pa / 1000; // kPa

  // External pressure coefficient Cp (Windward + Suction/Leeward)
  // Standard sloped roofs under transverse wind:
  // Suction (uplift) is major. Cp is typically -0.6 to -0.9 on leeward / windward.
  // Standard design Cp for roof envelope uplift is around -0.90 (local Zone 2) or -0.60 (Zone 1).
  // Let's assume wind suction (critical uplift) is -0.70, and internal pressure suction GCpi = +0.18
  // Net Wind Pressure Purlin Design = q * (Cp - GCpi)
  // Pwind_suction = q * (-0.7 - 0.18) = -0.88 * q (suction, outward)
  // Let's compute both Windward pressure and Suction pressure.
  // Standard wind uplift coefficient is -0.9.
  const cp_suction = -0.85; 
  const gcpi_val = parseFloat(loads.wind.gcpi); // 0.18 or 0.55 or 0.00
  const p_suction_kpa = q_kpa * (cp_suction - gcpi_val); // negative means suction (uplift)
  
  // Wind load on single purlin (kN/m) - perpendicular to roof
  // Since wind pressure acts normal to roof, there is no tangential wind force.
  const wl_line_normal = p_suction_kpa * spacing; // kN/m (negative = uplift)

  // 6. Resolved Loads along Axes
  // Normal (x-axis of bending) perp to roof: cos(theta) for DL and LL. Wind is already 100% normal.
  // Tangential (y-axis of bending) parallel to roof: sin(theta) for DL and LL. Wind is 0 tangential.
  
  // Sag rods unbraced length factor:
  // Lateral unbraced length reduces the span for minor axis bending.
  let Ly = L;
  let my_coeff_reduct = 1.0;
  if (purlin.hasSagRods) {
    if (purlin.sagRodSpacing === 'midspan') {
      Ly = L / 2;
      my_coeff_reduct = 0.25; // moment is reduced by approx 4 because span was divided by 2
    } else if (purlin.sagRodSpacing === 'thirdpoints') {
      Ly = L / 3;
      my_coeff_reduct = 0.111; // moment divided by ~9
    }
  }

  // Support coefficients for Maximum Moment, Shear and Deflection
  let m_factor = 0.125; // 1/8 for simply supported
  let v_factor = 0.5;   // 1/2 for simply supported
  let d_factor = 5 / 384; 

  if (purlin.supportCondition === 'Continuous (2 Spans)') {
    m_factor = 0.125; // Max moment is over intermediate support (neg. moment is 1/8 w L^2)
    v_factor = 0.625; // Max shear at central support
    d_factor = 0.0054; // approximately 40% of simply supported
  } else if (purlin.supportCondition === 'Continuous (3+ Spans)') {
    m_factor = 0.10;  // Max moment 1/10 w L^2
    v_factor = 0.60;  // Max shear 0.6 w L
    d_factor = 0.0040; // approximately 30% of simply supported
  }

  // 7. Load Combination Analysis
  const combos: PurlinResult['combos'] = [];
  
  // Define combination multipliers
  const loadCases = [
    { name: '1.4 D', d: 1.4, l: 0.0, w: 0.0, method: 'LRFD' },
    { name: '1.2 D + 1.6 L', d: 1.2, l: 1.6, w: 0.0, method: 'LRFD' },
    { name: '1.2 D + 1.0 W + 0.5 L', d: 1.2, l: 0.5, w: 1.0, method: 'LRFD' }, // W is normal wind
    { name: '0.9 D + 1.0 W (Uplift)', d: 0.9, l: 0.0, w: 1.0, method: 'LRFD' }, // Wind suction is critical

    // ASD Combos
    { name: 'D', d: 1.0, l: 0.0, w: 0.0, method: 'ASD' },
    { name: 'D + L', d: 1.0, l: 1.0, w: 0.0, method: 'ASD' },
    { name: 'D + 0.6 W', d: 1.0, l: 0.0, w: 0.6, method: 'ASD' },
    { name: 'D + 0.75 L + 0.45 W', d: 1.0, l: 0.75, w: 0.45, method: 'ASD' },
    { name: '0.6 D + 0.6 W (Uplift)', d: 0.6, l: 0.0, w: 0.6, method: 'ASD' }
  ];

  // Convert section properties from mm to m for formula calculations
  const Ix = section.ix * 1e-12; // m^4
  const Iy = section.iy * 1e-12; // m^4
  const Sx = section.sx * 1e-9;  // m^3
  const Sy = section.sy * 1e-9;  // m^3
  
  // Allowable Bending Stress ASD (NSCP)
  // Conservative estimate: 0.60 Fy
  const Fb_asd = 0.60 * Fy; // MPa

  // Design Strength LRFD (NSCP)
  // phi_b * Mn = 0.9 * Fy * S
  const phi_b = 0.90;

  let criticalRatio = 0;
  let criticalComboName = '';
  let criticalMx = 0;
  let criticalMy = 0;
  let maxWn_critical = 0;

  for (const c of loadCases) {
    if (c.method !== designMethod) continue;

    // Normal load (kPa or kN/m)
    // dl is down, ll is down, wl is up/outward (negative for suction)
    const dl_n = dl_line_gravity * Math.cos(theta); // kN/m
    const ll_n = ll_line_gravity * Math.cos(theta); // kN/m
    const wl_n = wl_line_normal; // kN/m (negative)

    // Total normal load for this combination
    const wn = c.d * dl_n + c.l * ll_n + c.w * wl_n; // kN/m (absolute sign matters)
    
    // Tangential load (kN/m)
    // Wind has 0 tangential load.
    const dl_t = dl_line_gravity * Math.sin(theta); // kN/m
    const ll_t = ll_line_gravity * Math.sin(theta); // kN/m
    const wt = c.d * dl_t + c.l * ll_t; // kN/m
    
    // Bending moments
    const Mx = wn * Math.pow(L, 2) * m_factor; // kN-m
    const My = wt * Math.pow(L, 2) * m_factor * my_coeff_reduct; // kN-m (account for brace spacing)

    // Bending stresses (MPa) = (Moment in kN-m * 1000) / (S in m^3 * 1e9) = M / S / 1000 ? No:
    // f_b = M / S. M in N-mm, S in mm^3.
    // Mx (kN-m) * 1e6 (N-mm/kN-m) / Sx (mm^3) = M_kNm * 1000 / S_mm3 * 1000 ?
    // Mx * 1e6 / section.sx = MPa
    const stressX = Math.abs(Mx * 1e6 / section.sx); // MPa
    const stressY = Math.abs(My * 1e6 / section.sy); // MPa

    let ratio = 0;
    if (designMethod === 'ASD') {
      // fb / Fb
      ratio = (stressX / Fb_asd) + (stressY / Fb_asd);
    } else {
      // Mu / (phi * Mn) = Mu / (0.9 * Fy * S) = stress / (0.9 * Fy)
      const ratioX = stressX / (phi_b * Fy);
      const ratioY = stressY / (phi_b * Fy);
      ratio = ratioX + ratioY;
    }

    combos.push({
      name: c.name,
      wn,
      wt,
      maxMx: Mx,
      maxMy: My,
      stressX,
      stressY,
      interactionRatio: ratio
    });

    if (ratio > criticalRatio) {
      criticalRatio = ratio;
      criticalComboName = c.name;
      criticalMx = Mx;
      criticalMy = My;
      maxWn_critical = wn;
    }
  }

  // 8. Shear Capacity check (Critical shear at ends)
  // V = w * L * v_factor
  // DL_t & LL_t shear in tangential, DL_n & LL_n & WL_n shear in normal
  // We'll calculate the maximum resultant shear or normal shear (normal shear is usually critical for purlins)
  // Let's use the critical combo normal and tangential forces
  const indexCrit = combos.findIndex(cb => cb.name === criticalComboName);
  const critComboData = combos[indexCrit] || combos[0];
  const maxVx = Math.abs(critComboData.wn * L * v_factor); // kN (perp to roof)
  const maxVy = Math.abs(critComboData.wt * L * v_factor * (purlin.hasSagRods ? 0.5 : 1.0)); // kN (parallel)
  const maxShear = Math.sqrt(maxVx * maxVx + maxVy * maxVy); // resultant shear, kN

  // Allowable Shear capacity (Conservative standard for thin walled cold-formed channels:
  // Fv = 0.4 Fy for ASD, Vn = 0.6 Fy * d * t for LRFD. Let's compute ASD/LRFD shear limit:
  const area_web = section.d * section.t; // approx web area mm^2
  let shearCapacity = 0;
  if (designMethod === 'ASD') {
    shearCapacity = (0.40 * Fy * area_web) / 1000; // kN
  } else {
    shearCapacity = (0.90 * 0.60 * Fy * area_web) / 1000; // LRFD nominal shear, kN
  }
  const shearRatio = maxShear / shearCapacity;

  // 9. Deflection Check (Serviceability)
  // Usually calculated for Service Load: DL + LL or DL + 0.6W.
  // Standard structural deflection limit is L / 180 for roof purlins, or L / 240 for plaster ceilings.
  // Let's check service loads (normal load):
  const service_wn = (dl_line_gravity * Math.cos(theta) + ll_line_gravity * Math.cos(theta)); // kN/m
  // Deflection under service load (mm): delta = (factor) * w * L^4 / (E * I) * conversions
  // L in m, w in kN/m, E in MPa (N/mm2), I in mm4.
  // delta_mm = d_factor * (w_kNm * 10^3 N/m / 10^3 mm/m) * (L_m * 10^3)^4 / (E_MPa * I_mm4)
  // delta_mm = d_factor * (w_kNm * L_m^4 * 1e12) / (E_MPa * I_mm4)
  // wait:
  // w (kN/m) = w (N/mm)
  // E (GPa) = E * 1e9 N/m^2. I (mm4) = I * 1e-12 m4. E*I in N-m2 = (E*1e6 N/m2) * (I*1e-12 m4) = E * I * 1e-6
  // Simplest formula: delta_mm = (d_factor * (service_wn * 1000) * Math.pow(L * 1000, 4)) / (E * (section.ix * 1e4))?
  // Let's do units perfectly:
  // w is in N/mm: w_kN_m = w_N_mm
  // L is in mm: L_mm = L * 1000
  // E is in N/mm²: E = E_MPa
  // I is in mm⁴: I = section.ix
  // delta (mm) = d_factor * (service_w_N_mm * L_mm^4) / (E * Ix)
  const L_mm = L * 1000;
  const maxDeflection = (d_factor * service_wn * Math.pow(L_mm, 4)) / (E * section.ix); // mm
  const allowableDeflection = L_mm / 180; // NSCP standard
  const deflectionRatio = maxDeflection / allowableDeflection;

  // 10. Compile Warnings
  const warnings: string[] = [];
  const passed = criticalRatio <= 1.0 && shearRatio <= 1.0 && deflectionRatio <= 1.0;

  if (criticalRatio > 1.0) {
    warnings.push(`Bending interaction stress ratio exceeded (${criticalRatio.toFixed(2)} > 1.0). Increase section size.`);
  }
  if (shearRatio > 1.0) {
    warnings.push(`Shear capacity exceeded (${shearRatio.toFixed(2)} > 1.0). Web local buckling or shear failure risk.`);
  }
  if (deflectionRatio > 1.0) {
    warnings.push(`Deflection exceeded NSCP Allowable L/180 (${maxDeflection.toFixed(1)}mm > ${allowableDeflection.toFixed(1)}mm).`);
  }
  if (roofSlopeAngle < 10 && purlin.type === 'C-Purlin') {
    warnings.push('Low roof slope (< 10°). Watch out for rainwater ponding and leakage with standard G.I. rib cladding.');
  }
  if (purlin.spacing > 1.2) {
    warnings.push('Purlin spacing is larger than 1.2m. Standard 0.4mm/0.5mm roof sheet skin might sag under worker walk loads.');
  }

  return {
    span: L,
    spacing,
    sectionName: section.name,
    slopeAngle: roofSlopeAngle,
    deadLoadPerSqm: dl_sqm,
    liveLoadPerSqm: ll_sqm,
    windPressure: p_suction_kpa,
    windUplift: Math.abs(p_suction_kpa),
    combos,
    criticalComboName,
    criticalRatio,
    criticalMx,
    criticalMy,
    shearRatio,
    maxShear,
    shearCapacity,
    deflectionRatio,
    maxDeflection,
    allowableDeflection,
    passed,
    warnings
  };
}
