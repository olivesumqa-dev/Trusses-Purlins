import { TrussInputs, CargoLoads, TrussResult, TrussMemberResult, SectionProfile, SteelGrade } from '../types';
import { STEEL_GRADES, TOP_CHORD_SECTIONS, BOTTOM_CHORD_SECTIONS, WEB_SECTIONS } from './sectionsDB';

export function solveTruss(
  truss: TrussInputs,
  loads: CargoLoads,
  roofSlopeAngle: number, // in degrees
  designMethod: 'ASD' | 'LRFD'
): TrussResult {
  const S = truss.span; // Truss span in meters
  const H = truss.height || 0.1; // Truss height in meters
  const Np = truss.numPanels % 2 === 0 ? truss.numPanels : truss.numPanels + 1; // force even panel count
  const spacing = truss.trussSpacing; // Truss spacing in meters

  // 1. Get steel grade and section properties
  const mat = STEEL_GRADES[truss.steelGrade];
  const Fy = mat.fy;
  const E = mat.e;

  const topSection = TOP_CHORD_SECTIONS[truss.topChordSectionIndex] || TOP_CHORD_SECTIONS[0];
  const botSection = BOTTOM_CHORD_SECTIONS[truss.bottomChordSectionIndex] || BOTTOM_CHORD_SECTIONS[0];
  const webSection = WEB_SECTIONS[truss.webSectionIndex] || WEB_SECTIONS[0];

  // 2. Generate Truss Nodes
  // Nodes reside on two levels: Top Chord and Bottom Chord
  // Panel horizontal spacing
  const cp = S / Np;
  
  interface Node {
    id: number;
    x: number;
    y: number;
    rx: number; // 1 = fixed, 0 = free
    ry: number; // 1 = fixed, 0 = free
    Fx: number; // concentrated force
    Fy: number; // concentrated force
  }

  const nodes: Node[] = [];
  const topNodesMap: number[] = [];
  const botNodesMap: number[] = [];

  // Generate Top Chord Nodes
  // T_0 to T_Np. Total Np + 1 nodes.
  for (let i = 0; i <= Np; i++) {
    const x = i * cp;
    let y = 0;
    if (x <= S / 2) {
      y = (2 * H / S) * x;
    } else {
      y = (2 * H / S) * (S - x);
    }
    
    let rx = 0;
    let ry = 0;
    
    // Boundary conditions:
    // Pinned support at bottom left (node 0)
    if (i === 0) {
      rx = 1;
      ry = 1;
    }
    // Roller support at bottom right (node Np)
    if (i === Np) {
      rx = 0; // free horizontally
      ry = 1; // fixed vertically
    }

    nodes.push({
      id: nodes.length,
      x,
      y,
      rx,
      ry,
      Fx: 0,
      Fy: 0
    });
    topNodesMap.push(i);
  }

  // Generate Bottom Chord Nodes
  // Bottom chord runs along y = 0. B_1 to B_{Np-1} are inner nodes.
  // Note: B_0 is merged with T_0, and B_Np is merged with T_Np.
  for (let i = 1; i < Np; i++) {
    const x = i * cp;
    const y = 0; // standard flat bottom chord
    nodes.push({
      id: nodes.length,
      x,
      y,
      rx: 0,
      ry: 0,
      Fx: 0,
      Fy: 0
    });
    botNodesMap.push(nodes.length - 1);
  }

  // Helper maps to resolve Node IDs
  const getTopNodeId = (index: number) => topNodesMap[index];
  const getBotNodeId = (index: number) => {
    if (index === 0) return topNodesMap[0];
    if (index === Np) return topNodesMap[Np];
    return botNodesMap[index - 1];
  };

  // 3. Generate Elements (Members)
  interface Element {
    id: string;
    n1: number;
    n2: number;
    type: 'Top Chord' | 'Bottom Chord' | 'Web';
    section: SectionProfile;
  }

  const elements: Element[] = [];

  // A. Top Chord Members
  for (let i = 0; i < Np; i++) {
    elements.push({
      id: `TC${i + 1}`,
      n1: getTopNodeId(i),
      n2: getTopNodeId(i + 1),
      type: 'Top Chord',
      section: topSection
    });
  }

  // B. Bottom Chord Members
  for (let i = 0; i < Np; i++) {
    elements.push({
      id: `BC${i + 1}`,
      n1: getBotNodeId(i),
      n2: getBotNodeId(i + 1),
      type: 'Bottom Chord',
      section: botSection
    });
  }

  // C. Web Members (Depending on Truss configuration)
  const halfNp = Np / 2;
  
  if (truss.type === 'King Post') {
    // Single vertical in center, diagonals from center bottom to top quarter points
    // Vertical center post
    elements.push({
      id: 'W-V1',
      n1: getTopNodeId(halfNp),
      n2: getBotNodeId(halfNp),
      type: 'Web',
      section: webSection
    });
    // Diagonals
    for (let i = 1; i < halfNp; i++) {
      elements.push({
        id: `W-D${i}`,
        n1: getTopNodeId(i),
        n2: getBotNodeId(halfNp),
        type: 'Web',
        section: webSection
      });
    }
    for (let i = halfNp + 1; i < Np; i++) {
      elements.push({
        id: `W-D${i}`,
        n1: getTopNodeId(i),
        n2: getBotNodeId(halfNp),
        type: 'Web',
        section: webSection
      });
    }
  } 
  else if (truss.type === 'Pratt') {
    // Verticals: T_i -> B_i
    for (let i = 1; i < Np; i++) {
      elements.push({
        id: `W-V${i}`,
        n1: getTopNodeId(i),
        n2: getBotNodeId(i),
        type: 'Web',
        section: webSection
      });
    }
    // Diagonals slope upwards towards the center
    // Left half: B_i -> T_{i+1}
    for (let i = 0; i < halfNp; i++) {
      if (i > 0) { // B_0 is support, B_0 -> T_1 is already top chord slope practically
        elements.push({
          id: `W-DL${i}`,
          n1: getBotNodeId(i),
          n2: getTopNodeId(i + 1),
          type: 'Web',
          section: webSection
        });
      }
    }
    // Right half: B_{i+1} -> T_i
    for (let i = halfNp; i < Np - 1; i++) {
      elements.push({
        id: `W-DR${i}`,
        n1: getBotNodeId(i + 1),
        n2: getTopNodeId(i),
        type: 'Web',
        section: webSection
      });
    }
  } 
  else if (truss.type === 'Warren') {
    // Zig-zag diagonal webs between top and bottom, vertical posts are optional but let's include them for stability
    for (let i = 0; i < Np; i++) {
      if (i % 2 === 0) {
        elements.push({
          id: `W-D${i * 2 + 1}`,
          n1: getBotNodeId(i),
          n2: getTopNodeId(i + 1),
          type: 'Web',
          section: webSection
        });
        if (i + 1 < Np) {
          elements.push({
            id: `W-D${i * 2 + 2}`,
            n1: getTopNodeId(i + 1),
            n2: getBotNodeId(i + 2),
            type: 'Web',
            section: webSection
          });
        }
      }
    }
    // Add light stability vertical posts at intermediate panel points if they don't overlap
    for (let i = 1; i < Np; i++) {
      let alreadyConnected = false;
      // Warren does not strictly require verticals, but we can add them to prevent chord slenderness issues
      elements.push({
        id: `W-V${i}`,
        n1: getTopNodeId(i),
        n2: getBotNodeId(i),
        type: 'Web',
        section: webSection
      });
    }
  }
  else if (truss.type === 'Fink' || truss.type === 'Fan' || truss.type === 'Howe' || truss.type === 'Custom') {
    // Howe configuration (diagonals slope down towards center)
    // Verticals at every inner node: T_i -> B_i
    for (let i = 1; i < Np; i++) {
      elements.push({
        id: `W-V${i}`,
        n1: getTopNodeId(i),
        n2: getBotNodeId(i),
        type: 'Web',
        section: webSection
      });
    }
    // Diagonals slope downwards towards the center
    // Left half: T_i -> B_{i+1}
    for (let i = 0; i < halfNp; i++) {
      elements.push({
        id: `W-DL${i + 1}`,
        n1: getTopNodeId(i),
        n2: getBotNodeId(i + 1),
        type: 'Web',
        section: webSection
      });
    }
    // Right half: T_{i+1} -> B_{i}
    for (let i = halfNp; i < Np; i++) {
      elements.push({
        id: `W-DR${i}`,
        n1: getTopNodeId(i + 1),
        n2: getBotNodeId(i),
        type: 'Web',
        section: webSection
      });
    }
  } else {
    // Default fallback: Simple Post
    elements.push({
      id: 'W-V-center',
      n1: getTopNodeId(halfNp),
      n2: getBotNodeId(halfNp),
      type: 'Web',
      section: webSection
    });
  }

  // 4. Compute and Apply Joint Loads
  // Total factored Service load or ultimate load based on combination.
  // To keep the analysis rigorous and physical under nodal forces,
  // we will solve for a critical Loading combo.
  // Factored loads for ASD or LRFD load combination applied to joints.
  // Under NSCP, Dead plus Live plus Wind combination:
  // Gravity combo (LRFD) on bottom chord and top chord: 
  // Let's use 1.2 D + 1.6 L or ASD: D + L.
  // Wind pressure represents transverse loads normal to the top surface.
  // Let's do general design combination forces on joints:
  // Concentrated gravity load per meter of roof width is:
  // load_sqm = Dead Load + Live Load (kPa = kN/m^2)
  // linear_load = load_sqm * spacing (kN/m)
  // Joint load = linear_load * tributary chord length
  const dl_sqm = loads.dead.roofingWeight + loads.dead.insulation + loads.dead.ceiling + loads.dead.lightingMech + loads.dead.solarPanels;
  const ll_sqm = loads.live.roofLiveLoad;

  const w_gravity_sqm = designMethod === 'LRFD' 
    ? (1.2 * dl_sqm + 1.6 * ll_sqm) 
    : (1.0 * dl_sqm + 1.0 * ll_sqm); // kN/m2

  // Total gravity load per joint
  const p_grav_factor = w_gravity_sqm * spacing; // kN/m along span projection
  
  // Apply Gravity Nodal Load
  for (let i = 0; i <= Np; i++) {
    const nodeId = getTopNodeId(i);
    // Tributary length
    let tribLength = cp;
    if (i === 0 || i === Np) tribLength = cp / 2;
    const forceY = -p_grav_factor * tribLength;
    nodes[nodeId].Fy += forceY;
  }

  // Add Wind uplift (critical wind uplift scenario!)
  // V_kph, calculate wind suction normal pressure
  const V_kph = loads.wind.basicWindSpeed;
  const V_ms = V_kph / 3.6;
  let Kz = 0.85;
  if (loads.wind.exposureCategory === 'C') Kz = 1.0;
  if (loads.wind.exposureCategory === 'D') Kz = 1.15;
  const I_factor = loads.wind.occupancyCategory === 'Essential' ? 1.15 : 1.0;
  const q_kpa = (0.613 * Kz * 1.0 * loads.wind.kd * Math.pow(V_ms, 2) * I_factor) / 1000;
  
  // Suction pressure
  const cp_suction = -0.90; // conservative main force coefficient
  const gcpi_val = parseFloat(loads.wind.gcpi);
  const p_wind_kpa = q_kpa * (cp_suction - gcpi_val); // negative = uplift

  // Wind load combo multiplier
  const w_mult = designMethod === 'LRFD' ? 1.0 : 0.6; // 1.0W for LRFD, 0.6W for ASD in NSCP 2015

  const p_wind_ultimate = p_wind_kpa * w_mult; // kPa

  // Apply Wind Load on Top Chord Joints (Suction normal to chord)
  const radTheta = (roofSlopeAngle * Math.PI) / 180;
  
  for (let i = 0; i <= Np; i++) {
    const nodeId = getTopNodeId(i);
    let tribChordLength = cp / Math.cos(radTheta);
    if (i === 0 || i === Np) tribChordLength = (cp / Math.cos(radTheta)) / 2;

    const windForceTotal = p_wind_ultimate * tribChordLength * spacing; // kN (negative for tension/suction)

    // Wind suction acts outward (upward perpendicular to top chords)
    // Left half (i < halfNp): points up and left
    // Right half (i > halfNp): points up and right
    let Fw_x = 0;
    let Fw_y = 0;

    if (i < halfNp) {
      // Normal vector is (-sin theta, cos theta)
      Fw_x = -windForceTotal * Math.sin(radTheta);
      Fw_y = windForceTotal * Math.cos(radTheta);
    } else if (i > halfNp) {
      // Normal vector is (sin theta, cos theta)
      Fw_x = windForceTotal * Math.sin(radTheta);
      Fw_y = windForceTotal * Math.cos(radTheta);
    } else {
      // Ridge node (ID = halfNp): experiences vector sum of both left and right trib surfaces
      const windForceHalf = p_wind_ultimate * (tribChordLength) * spacing;
      Fw_x = 0; // cancels out due to symmetry
      Fw_y = windForceHalf * Math.cos(radTheta);
    }

    // Apply wind uplift and combination to joints
    nodes[nodeId].Fx += Fw_x;
    nodes[nodeId].Fy += Fw_y;
  }

  // 5. 2D Truss Finite Element Stiffness Matrix Assembly and Solver
  const numNodes = nodes.length;
  const dofs = 2 * numNodes;
  
  // Initialize Global Stiffness Matrix K (dofs x dofs) and Load Vector F (dofs)
  const KG: number[][] = Array(dofs).fill(0).map(() => Array(dofs).fill(0));
  const FVector: number[] = Array(dofs).fill(0);

  // Set up loads vector
  for (let i = 0; i < numNodes; i++) {
    FVector[2 * i] = nodes[i].Fx;
    FVector[2 * i + 1] = nodes[i].Fy;
  }

  // Assemble Elements
  const elemLength: number[] = [];
  const elemCos: number[] = [];
  const elemSin: number[] = [];

  for (let eIdx = 0; eIdx < elements.length; eIdx++) {
    const el = elements[eIdx];
    const n1 = nodes[el.n1];
    const n2 = nodes[el.n2];

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L_elem = Math.sqrt(dx * dx + dy * dy);
    elemLength.push(L_elem);

    const cosT = dx / L_elem;
    const sinT = dy / L_elem;
    elemCos.push(cosT);
    elemSin.push(sinT);

    // Cross-sectional Area A in m^2
    const A = el.section.area * 1e-6; // mm^2 to m^2
    // E in N/m^2
    const E_mod = E * 1e6; // MPa to N/m^2

    const k_local = (A * E_mod) / L_elem; // N/m

    // Global stiffness matrix terms for this truss member
    const cc = cosT * cosT * k_local;
    const cs = cosT * sinT * k_local;
    const ss = sinT * sinT * k_local;

    const dofMap = [
      2 * el.n1,     // ux1
      2 * el.n1 + 1, // uy1
      2 * el.n2,     // ux2
      2 * el.n2 + 1  // uy2
    ];

    const ke_glob = [
      [ cc,  cs, -cc, -cs],
      [ cs,  ss, -cs, -ss],
      [-cc, -cs,  cc,  cs],
      [-cs, -ss,  cs,  ss]
    ];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        KG[dofMap[r]][dofMap[c]] += ke_glob[r][c];
      }
    }
  }

  // Apply boundary conditions (supports) to KG matrix
  // If a degree of freedom is constrained, we set its row and column to 0, and diagonal to 1.
  // And its corresponding Load vector element to 0.
  for (let i = 0; i < numNodes; i++) {
    const node = nodes[i];
    if (node.rx === 1) {
      const gDof = 2 * i;
      for (let j = 0; j < dofs; j++) {
        KG[gDof][j] = 0;
        KG[j][gDof] = 0;
      }
      KG[gDof][gDof] = 1;
      FVector[gDof] = 0;
    }
    if (node.ry === 1) {
      const gDof = 2 * i + 1;
      for (let j = 0; j < dofs; j++) {
        KG[gDof][j] = 0;
        KG[j][gDof] = 0;
      }
      KG[gDof][gDof] = 1;
      FVector[gDof] = 0;
    }
  }

  // Solve system KG * Disp = FVector using standard Gaussian Elimination solver
  // We make copies to prevent modifyingassembled data
  const A_matrix = KG.map(row => [...row]);
  const B_vector = [...FVector];
  const Disp = Array(dofs).fill(0);

  for (let i = 0; i < dofs; i++) {
    // Search pivot
    let maxEl = Math.abs(A_matrix[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < dofs; k++) {
      if (Math.abs(A_matrix[k][i]) > maxEl) {
        maxEl = Math.abs(A_matrix[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row
    const tmpRow = A_matrix[maxRow];
    A_matrix[maxRow] = A_matrix[i];
    A_matrix[i] = tmpRow;

    const tmpVal = B_vector[maxRow];
    B_vector[maxRow] = B_vector[i];
    B_vector[i] = tmpVal;

    // Eliminate column elements below pivot
    for (let k = i + 1; k < dofs; k++) {
      const diag = A_matrix[i][i];
      if (Math.abs(diag) < 1e-12) continue; // singular/constrained dof
      const c = -A_matrix[k][i] / diag;
      for (let j = i; j < dofs; j++) {
        if (i === j) {
          A_matrix[k][j] = 0;
        } else {
          A_matrix[k][j] += c * A_matrix[i][j];
        }
      }
      B_vector[k] += c * B_vector[i];
    }
  }

  // Back substitution
  for (let i = dofs - 1; i >= 0; i--) {
    const diag = A_matrix[i][i];
    if (Math.abs(diag) < 1e-12) {
      Disp[i] = 0;
      continue;
    }
    Disp[i] = B_vector[i];
    for (let j = i + 1; j < dofs; j++) {
      Disp[i] -= A_matrix[i][j] * Disp[j];
    }
    Disp[i] /= diag;
  }

  // 6. Calculate Member Force and Stress Checks
  let maxDisplacement = 0; // mm
  for (let i = 0; i < dofs; i++) {
    const disp_mm = Math.abs(Disp[i] * 1000);
    if (disp_mm > maxDisplacement) maxDisplacement = disp_mm;
  }

  const memberResults: { id: string; force: number; stress: number; result: TrussMemberResult }[] = [];
  let trussPassed = true;
  const warnings: string[] = [];

  for (let eIdx = 0; eIdx < elements.length; eIdx++) {
    const el = elements[eIdx];
    const L_elem = elemLength[eIdx];
    const cosT = elemCos[eIdx];
    const sinT = elemSin[eIdx];

    // Node displacements in meters
    const u1x = Disp[2 * el.n1];
    const u1y = Disp[2 * el.n1 + 1];
    const u2x = Disp[2 * el.n2];
    const u2y = Disp[2 * el.n2 + 1];

    const A_mm2 = el.section.area;
    const A_m2 = A_mm2 * 1e-6; // m^2
    const E_mod = E * 1e6; // N/m^2

    // Axial strain and force in member (kN)
    // P = AE/L * ( (u2x-u1x)*cos + (u2y-u1y)*sin )
    const Force_N = (A_m2 * E_mod / L_elem) * ((u2x - u1x) * cosT + (u2y - u1y) * sinT);
    const Force_kN = Force_N / 1000; // Positive = Tension, Negative = Compression
    const Stress_MPa = Force_kN * 1000 / A_mm2; // Force/Area

    // Engineering Checks based on AISC / NSCP codes
    let isTension = Force_kN >= 0;
    
    // Member unbraced lengths
    // K factor is typically assumed as 1.0 for truss pin-connections.
    const K = 1.0;
    const L_mm = L_elem * 1000;
    const r_min = Math.min(el.section.rx, el.section.ry);
    const slenderness = (K * L_mm) / r_min;

    let memberPassed = true;
    let warning = '';
    let capacity_kN = 0;

    if (isTension) {
      // Slenderness limit for tension is 300 per AISC/NSCP
      if (slenderness > 300) {
        memberPassed = false;
        warning = `Slenderness ratio kl/r exceeded tension limit 300 (${slenderness.toFixed(1)} > 300)`;
      }

      // Tension capacity
      // Yielding of gross section: Pn = Fy * Ag
      // For ASD: P_allow = Fy * Ag / Ω_t (Ω_t = 1.67) => P = 0.60 * Fy * Ag
      // For LRFD: phi*Pn = 0.90 * Fy * Ag
      if (designMethod === 'ASD') {
        capacity_kN = (0.60 * Fy * A_mm2) / 1000;
      } else {
        capacity_kN = (0.90 * Fy * A_mm2) / 1000;
      }

      if (Math.abs(Force_kN) > capacity_kN) {
        memberPassed = false;
        warning = `Tensile force exceeds design capacity (${Math.abs(Force_kN).toFixed(1)}kN > ${capacity_kN.toFixed(1)}kN)`;
      }
    } 
    else {
      // Compression
      // Slenderness limit for compression is 200 per AISC/NSCP
      if (slenderness > 200) {
        memberPassed = false;
        warning = `Slenderness ratio kl/r exceeded compression limit 200 (${slenderness.toFixed(1)} > 200)`;
      }

      // Compression Column capacity including Euler / AISC buckling
      // Fe (Euler stress) = pi^2 * E / (Kl/r)^2
      const Fe = (Math.PI * Math.PI * E) / (slenderness * slenderness);
      
      // AISC Chapter E Critical Compression Stress Fcr
      let Fcr = 0;
      // Slenderness parameter check
      if (slenderness <= 4.71 * Math.sqrt(E / Fy)) {
        Fcr = Math.pow(0.658, Fy / Fe) * Fy;
      } else {
        Fcr = 0.877 * Fe;
      }

      // Design capacity
      // For ASD: allowable stress is Fcr / Ω_c (Ω_c = 1.67) => P = Fcr * Ag / 1.67 => 0.60 * Fcr * Ag
      // For LRFD: phi * Fcr * Ag (phi = 0.90)
      if (designMethod === 'ASD') {
        capacity_kN = (Fcr / 1.67 * A_mm2) / 1000;
      } else {
        capacity_kN = (0.90 * Fcr * A_mm2) / 1000;
      }

      if (Math.abs(Force_kN) > capacity_kN) {
        memberPassed = false;
        warning = `Buckling or yielding limits exceeded (${Math.abs(Force_kN).toFixed(1)}kN > ${capacity_kN.toFixed(1)}kN)`;
      }
    }

    const utilization = Math.abs(Force_kN) / (capacity_kN || 1);
    if (utilization > 1.0) {
      memberPassed = false;
    }

    if (!memberPassed) {
      trussPassed = false;
      warnings.push(`Member ${el.id} (${el.type}): ${warning || 'Section inadequate'}`);
    }

    memberResults.push({
      id: el.id,
      force: Force_kN,
      stress: Stress_MPa,
      result: {
        id: el.id,
        type: el.type,
        nodeStart: el.n1,
        nodeEnd: el.n2,
        length: L_elem,
        sectionName: el.section.name,
        force: Force_kN,
        capacity: capacity_kN,
        klOverR: slenderness,
        utilization,
        passed: memberPassed,
        warning
      }
    });
  }

  // Global service deflection limit (Typically Truss L / 240, or L / 360)
  const allowableDef = (S * 1000) / 240; // in mm
  if (maxDisplacement > allowableDef) {
    trussPassed = false;
    warnings.push(`Truss vertical deflection exceeds allowable L/240 limit (${maxDisplacement.toFixed(1)}mm > ${allowableDef.toFixed(1)}mm)`);
  }

  return {
    nodes: nodes.map(n => ({
      id: n.id,
      x: n.x,
      y: n.y,
      forces: { Fx: n.Fx, Fy: n.Fy }
    })),
    elements: elements.map((el, idx) => ({
      id: el.id,
      n1: el.n1,
      n2: el.n2,
      force: memberResults[idx].force,
      stress: memberResults[idx].stress,
      result: memberResults[idx].result
    })),
    maxDisplacement,
    passed: trussPassed,
    warnings
  };
}
