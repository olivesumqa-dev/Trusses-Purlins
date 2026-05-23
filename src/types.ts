/**
 * Structural Code, Project, and Engineering Types
 */

export type RoofType = 'Gable' | 'Hip' | 'Mono-slope' | 'Sawtooth' | 'Curved';

export type TrussType = 'Howe' | 'Pratt' | 'Warren' | 'Fink' | 'Fan' | 'King Post' | 'Queen Post' | 'Custom';

export type PurlinType = 'C-Purlin' | 'Z-Purlin' | 'Rectangular Tube' | 'Equal Angle';

export type SupportCondition = 'Simply Supported' | 'Continuous (2 Spans)' | 'Continuous (3+ Spans)';

export type SteelGrade = 
  | 'A36' 
  | 'SS400' 
  | 'A50' 
  | 'A572_G50' 
  | 'A992' 
  | 'A500_G_B' 
  | 'A53_G_B' 
  | 'G250_Cold' 
  | 'G450_Cold' 
  | 'G550_Cold';

export type ConnectionType = 'Welded' | 'Bolted' | 'Gusset Plate';

export type WindExposure = 'B' | 'C' | 'D';

export type OccupancyCategory = 'Essential' | 'Hazardous' | 'Standard' | 'Miscellaneous';

export type DesignMethod = 'ASD' | 'LRFD';

export interface ProjectInfo {
  projectName: string;
  clientName: string;
  engineerName: string;
  location: string;
  windZone: string;
  designCode: 'NSCP 2015' | 'NSCP 2010' | 'AISC 360-16';
  designMethod: DesignMethod;
  date: string;
}

export interface RoofGeometry {
  type: RoofType;
  buildingLength: number; // meters
  buildingWidth: number; // meters
  roofSpan: number; // meters
  roofHeight: number; // meters
  overhang: number; // meters
  eaveHeight: number; // meters
  slopeInputType: 'height' | 'pitch'; // can select pitch directly or height
  slopeAngle: number; // angle in degrees (auto-calculated or input)
}

export interface MaterialProperties {
  grade: SteelGrade;
  fy: number; // MPa
  fu: number; // MPa
  e: number; // MPa
  density: number; // kg/m^3
  name?: string;           // full local descriptive name
  standard?: string;       // e.g. 'ASTM A36', 'JIS G 3101'
  commonUsage?: string;    // e.g. 'Truss double-angle bars, gusset plates, standard sections'
  isColdFormed?: boolean;  // is it cold-formed or hot-rolled?
}

export interface SectionProfile {
  name: string;
  d: number; // mm, depth
  b: number; // mm, width
  t: number; // mm, thickness
  t_web?: number; // mm, web thickness for W sections
  lip?: number; // mm, lip for C/Z sections
  area: number; // mm^2, area
  weight: number; // kg/m, weight per meter
  ix: number; // mm^4, moment of inertia major
  iy: number; // mm^4, moment of inertia minor
  sx: number; // mm^3, section modulus major
  sy: number; // mm^3, section modulus minor
  rx: number; // mm, radius of gyration major
  ry: number; // mm, radius of gyration minor
}

export interface PurlinInputs {
  type: PurlinType;
  sections: SectionProfile[];
  selectedIndex: number;
  spacing: number; // meters
  span: number; // meters (Truss spacing)
  supportCondition: SupportCondition;
  hasSagRods: boolean;
  sagRodSpacing: 'none' | 'midspan' | 'thirdpoints';
  selfWeightInclusion: boolean;
  overrideFy: boolean;
  manualFy: number;
  steelGrade: SteelGrade;
}

export interface TrussInputs {
  type: TrussType;
  span: number; // meters (usually matches building width or room span)
  height: number; // meters
  numPanels: number; // even number for top chord nodes
  trussSpacing: number; // meters
  connectionType: ConnectionType;
  topChordSectionIndex: number;
  bottomChordSectionIndex: number;
  webSectionIndex: number;
  steelGrade: SteelGrade;
}

export interface DeadLoads {
  roofingWeight: number; // kPa (e.g. rib type G.I. sheeting is 0.10 kPa)
  insulation: number; // kPa
  ceiling: number; // kPa
  lightingMech: number; // kPa
  solarPanels: number; // kPa
  purlinSelfWeightMultiplier: number; // standard self weight inclusion
}

export interface LiveLoads {
  roofLiveLoad: number; // kPa (NSCP default is 0.60 or 1.0 depending on slope)
  useNscpDefault: boolean;
}

export interface WindLoads {
  basicWindSpeed: number; // kph (NSCP wind speed)
  exposureCategory: WindExposure;
  occupancyCategory: OccupancyCategory;
  kd: number; // wind directionality factor (typically 0.85 for roofs)
  kzt: number; // topographic factor Default 1.0
  gcpi: '0.18' | '0.55' | '0.00'; // internal pressure coefficient (+/-)
}

export interface CargoLoads {
  dead: DeadLoads;
  live: LiveLoads;
  wind: WindLoads;
}

// Result structure for Purlins
export interface PurlinResult {
  span: number;
  spacing: number;
  sectionName: string;
  slopeAngle: number;
  deadLoadPerSqm: number;
  liveLoadPerSqm: number;
  windPressure: number; // wind outward (uplift) or inward
  windUplift: number; // outward pressure
  combos: {
    name: string;
    wn: number; // normal uniform load (kN/m)
    wt: number; // tangential uniform load (kN/m)
    maxMx: number; // kN-m
    maxMy: number; // kN-m
    stressX: number; // MPa
    stressY: number; // MPa
    interactionRatio: number;
  }[];
  criticalComboName: string;
  criticalRatio: number;
  criticalMx: number;
  criticalMy: number;
  shearRatio: number;
  maxShear: number; // kN
  shearCapacity: number; // kN
  deflectionRatio: number;
  maxDeflection: number; // mm
  allowableDeflection: number; // mm
  passed: boolean;
  warnings: string[];
}

// Truss member results
export interface TrussMemberResult {
  id: string; // e.g., TC1, BC2, W3
  type: 'Top Chord' | 'Bottom Chord' | 'Web';
  nodeStart: number;
  nodeEnd: number;
  length: number; // m
  sectionName: string;
  force: number; // kN (Positive = Tension, Negative = Compression)
  capacity: number; // kN
  klOverR: number; // slenderness ratio
  utilization: number; // demand/capacity ratio
  passed: boolean;
  warning?: string;
}

export interface TrussResult {
  nodes: { x: number; y: number; id: number; forces: { Fx: number; Fy: number } }[];
  elements: { id: string; n1: number; n2: number; force: number; stress: number; result: TrussMemberResult }[];
  maxDisplacement: number; // mm
  passed: boolean;
  warnings: string[];
}

export interface ProjectState {
  projectInfo: ProjectInfo;
  roofGeometry: RoofGeometry;
  purlinInputs: PurlinInputs;
  trussInputs: TrussInputs;
  loads: CargoLoads;
  activeTab: string;
}
