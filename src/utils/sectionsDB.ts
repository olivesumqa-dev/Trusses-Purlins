import { SectionProfile, SteelGrade, MaterialProperties, WindExposure, OccupancyCategory } from '../types';

export const STEEL_GRADES: Record<SteelGrade, MaterialProperties> = {
  A36: {
    grade: 'A36',
    fy: 248,
    fu: 400,
    e: 200000,
    density: 7850,
    name: 'ASTM A36 Mild Carbon Steel',
    standard: 'ASTM A36 / NSCP Sec 505',
    commonUsage: 'Standard choice for hot-rolled angle bars, channels, plates, and structural steel trusses in local PH buildings.',
    isColdFormed: false
  },
  SS400: {
    grade: 'SS400',
    fy: 245,
    fu: 400,
    e: 200000,
    density: 7850,
    name: 'JIS SS400 Structural Steel',
    standard: 'JIS G 3101 / NSCP Chapter 5',
    commonUsage: 'Most common structural grade found in local hardware suppliers across the Philippines. Perfect for general truss chord and web steel.',
    isColdFormed: false
  },
  A50: {
    grade: 'A50',
    fy: 345,
    fu: 450,
    e: 200000,
    density: 7850,
    name: 'AISC Gr. 50 Equivalent Carbon Steel',
    standard: 'AISC 360 / NSCP Chapter 5',
    commonUsage: 'Moderate high-strength carbon steel, widely utilized for truss chords and thick plates.',
    isColdFormed: false
  },
  A572_G50: {
    grade: 'A572_G50',
    fy: 345,
    fu: 450,
    e: 200000,
    density: 7850,
    name: 'ASTM A572 Grade 50 High-Strength',
    standard: 'ASTM A572 Grade 50 / NSCP Chapter 5',
    commonUsage: 'High-strength low-alloy steel. Used for large Span configurations, heavy industrial warehouses, and primary chords.',
    isColdFormed: false
  },
  A992: {
    grade: 'A992',
    fy: 345,
    fu: 450,
    e: 200000,
    density: 7850,
    name: 'ASTM A992 Wide Flange Steel',
    standard: 'ASTM A992 / NSCP Chapter 5',
    commonUsage: 'De facto standard for wide-flange shapes (W-beams) and main structural columns/beams.',
    isColdFormed: false
  },
  A500_G_B: {
    grade: 'A500_G_B',
    fy: 317,
    fu: 400,
    e: 200000,
    density: 7850,
    name: 'ASTM A500 Grade B Hollow Tube',
    standard: 'ASTM A500 Grade B / NSCP Chapter 5',
    commonUsage: 'Highly popular structural grade for square and rectangular steel tubes (RHS/SHS) used as rafters, webs or columns.',
    isColdFormed: true
  },
  A53_G_B: {
    grade: 'A53_G_B',
    fy: 240,
    fu: 415,
    e: 200000,
    density: 7850,
    name: 'ASTM A53 Grade B Seamless/Welded Pipe',
    standard: 'ASTM A53 / NSCP Sec 505',
    commonUsage: 'Circular hollow pipe standard used extensively for space frames, architectural truss struts, and curved structural items.',
    isColdFormed: false
  },
  G250_Cold: {
    grade: 'G250_Cold',
    fy: 250,
    fu: 320,
    e: 203000,
    density: 7850,
    name: 'NSCP Grade G250 Structural Cold-Formed',
    standard: 'NSCP Chapter 5 / AS 1397',
    commonUsage: 'Standard cold-rolled structural steel with zinc-coating. Ideal for commercial C-Channels and light-gauge Z-purlins.',
    isColdFormed: true
  },
  G450_Cold: {
    grade: 'G450_Cold',
    fy: 450,
    fu: 520,
    e: 203000,
    density: 7850,
    name: 'NSCP Grade G450 High-Tensile Purlin',
    standard: 'NSCP Chapter 5 / AS 1397',
    commonUsage: 'High-strength cold-formed steel used for premium thick-walled purlins supporting heavy roofing or solar panel sets.',
    isColdFormed: true
  },
  G550_Cold: {
    grade: 'G550_Cold',
    fy: 550,
    fu: 570,
    e: 203000,
    density: 7850,
    name: 'NSCP Grade G550 Ultra-High strength Sheeting',
    standard: 'NSCP Chapter 5 / AS 1397',
    commonUsage: 'Ultra-high strength thin galvanized steel sheets. Primarily used for prepainted rib span panels and light-weight battens.',
    isColdFormed: true
  }
};

/**
 * Standard C-Purlin steel sections (Philippine construction standards)
 * Dimensions in mm, section properties in mm units
 */
export const STANDARD_C_PURLINS: SectionProfile[] = [
  { name: 'LC 75 x 50 x 15 x 1.6', d: 75, b: 50, t: 1.6, lip: 15, area: 298.5, weight: 2.34, ix: 260000, iy: 102000, sx: 6930, sy: 4080, rx: 29.5, ry: 18.5 },
  { name: 'LC 75 x 50 x 15 x 2.0', d: 75, b: 50, t: 2.0, lip: 15, area: 366.4, weight: 2.88, ix: 312000, iy: 122000, sx: 8320, sy: 4880, rx: 29.2, ry: 18.2 },
  { name: 'LC 100 x 50 x 15 x 1.6', d: 100, b: 50, t: 1.6, lip: 15, area: 338.5, weight: 2.66, ix: 554000, iy: 114000, sx: 11080, sy: 4560, rx: 40.5, ry: 18.3 },
  { name: 'LC 100 x 50 x 15 x 2.0', d: 100, b: 50, t: 2.0, lip: 15, area: 416.4, weight: 3.27, ix: 668000, iy: 136000, sx: 13360, sy: 5440, rx: 40.1, ry: 18.1 },
  { name: 'LC 125 x 50 x 20 x 2.0', d: 125, b: 50, t: 2.0, lip: 20, area: 486.4, weight: 3.82, ix: 1150000, iy: 158000, sx: 18400, sy: 6320, rx: 48.6, ry: 18.0 },
  { name: 'LC 150 x 50 x 20 x 2.0', d: 150, b: 50, t: 2.0, lip: 20, area: 536.4, weight: 4.21, ix: 1840000, iy: 178000, sx: 24530, sy: 7120, rx: 58.6, ry: 17.8 },
  { name: 'LC 150 x 65 x 20 x 2.0', d: 150, b: 65, t: 2.0, lip: 20, area: 596.4, weight: 4.68, ix: 2180000, iy: 342000, sx: 29070, sy: 10520, rx: 60.5, ry: 24.0 },
  { name: 'LC 150 x 65 x 20 x 3.2', d: 150, b: 65, t: 3.2, lip: 20, area: 928.6, weight: 7.29, ix: 3260000, iy: 512000, sx: 43470, sy: 15750, rx: 59.2, ry: 23.5 },
  { name: 'LC 200 x 75 x 20 x 2.3', d: 200, b: 75, t: 2.3, lip: 20, area: 852.1, weight: 6.69, ix: 5080000, iy: 618000, sx: 50800, sy: 16480, rx: 77.2, ry: 26.9 },
  { name: 'LC 200 x 75 x 20 x 3.2', d: 200, b: 75, t: 3.2, lip: 20, area: 1168.6, weight: 9.17, ix: 6810000, iy: 846000, sx: 68100, sy: 22560, rx: 76.3, ry: 26.5 }
];

/**
 * Standard Z-Purlins
 */
export const STANDARD_Z_PURLINS: SectionProfile[] = [
  { name: 'LZ 100 x 50 x 2.0', d: 100, b: 50, t: 2.0, lip: 15, area: 416, weight: 3.27, ix: 680000, iy: 140000, sx: 13600, sy: 5600, rx: 40.2, ry: 18.3 },
  { name: 'LZ 150 x 60 x 2.0', d: 150, b: 60, t: 2.0, lip: 20, area: 576, weight: 4.52, ix: 2020000, iy: 280000, sx: 26900, sy: 9330, rx: 59.2, ry: 22.0 },
  { name: 'LZ 150 x 65 x 3.0', d: 150, b: 65, t: 3.0, lip: 20, area: 870, weight: 6.83, ix: 3050000, iy: 480000, sx: 40700, sy: 14700, rx: 59.1, ry: 23.5 },
  { name: 'LZ 200 x 75 x 2.5', d: 200, b: 75, t: 2.5, lip: 20, area: 955, weight: 7.50, ix: 5850000, iy: 720000, sx: 58500, sy: 19200, rx: 78.2, ry: 27.5 },
  { name: 'LZ 200 x 75 x 3.2', d: 200, b: 75, t: 3.2, lip: 20, area: 1205, weight: 9.46, ix: 7350000, iy: 910000, sx: 73500, sy: 24300, rx: 78.1, ry: 27.4 }
];

/**
 * Rectangular RHS/SHS sections (purlins or truss)
 */
export const STANDARD_RHS: SectionProfile[] = [
  { name: 'RHS 75 x 38 x 2.0', d: 75, b: 38, t: 2.0, area: 418, weight: 3.28, ix: 312000, iy: 104000, sx: 8320, sy: 5470, rx: 27.3, ry: 15.8 },
  { name: 'RHS 100 x 50 x 2.5', d: 100, b: 50, t: 2.5, area: 708, weight: 5.56, ix: 954000, iy: 322000, sx: 19080, sy: 12880, rx: 36.7, ry: 21.3 },
  { name: 'RHS 100 x 50 x 3.2', d: 100, b: 50, t: 3.2, area: 888, weight: 6.97, ix: 1150000, iy: 395000, sx: 23000, sy: 15800, rx: 36.0, ry: 21.1 },
  { name: 'RHS 150 x 50 x 3.0', d: 150, b: 50, t: 3.0, area: 1130, weight: 8.87, ix: 3340000, iy: 520000, sx: 44530, sy: 20800, rx: 54.3, ry: 21.5 },
  { name: 'SHS 50 x 50 x 2.0', d: 50, b: 50, t: 2.0, area: 368, weight: 2.89, ix: 135000, iy: 135000, sx: 5400, sy: 5400, rx: 19.1, ry: 19.1 },
  { name: 'SHS 75 x 75 x 3.0', d: 75, b: 75, t: 3.0, area: 834, weight: 6.55, ix: 708000, iy: 708000, sx: 18880, sy: 18880, rx: 29.1, ry: 29.1 },
  { name: 'SHS 100 x 100 x 4.0', d: 100, b: 100, t: 4.0, area: 1470, weight: 11.54, ix: 2180000, iy: 2180000, sx: 43600, sy: 43600, rx: 38.5, ry: 38.5 }
];

/**
 * Philippine Regular Standard: Double Angle Sections (2-angle bars welded side x side / back-to-back with 10mm spacer plate)
 * Derived dynamically from the physical Asian Single Angle standard profiles.
 */
export interface RawAngleInfo {
  size: number;
  t: number;
  area: number;
  weight: number;
  ys: number;
  ix: number;
  rx: number;
}

export const RAW_SINGLE_ANGLES: RawAngleInfo[] = [
  // 25 x 25: 3, 4, 5
  { size: 25, t: 3, area: 142.0, weight: 1.14, ys: 7.23, ix: 8000, rx: 7.5 },
  { size: 25, t: 4, area: 185.0, weight: 1.48, ys: 7.62, ix: 10200, rx: 7.4 },
  { size: 25, t: 5, area: 226.0, weight: 1.81, ys: 7.99, ix: 12100, rx: 7.3 },
  // 30 x 30: 3, 4, 5
  { size: 30, t: 3, area: 174.0, weight: 1.39, ys: 8.35, ix: 14000, rx: 9.0 },
  { size: 30, t: 4, area: 227.0, weight: 1.81, ys: 8.78, ix: 18000, rx: 8.9 },
  { size: 30, t: 5, area: 278.0, weight: 2.22, ys: 9.18, ix: 21600, rx: 8.8 },
  // 35 x 35: 4
  { size: 35, t: 4, area: 267.0, weight: 2.13, ys: 10.03, ix: 29500, rx: 10.5 },
  // 40 x 40: 3, 4, 5, 6
  { size: 40, t: 3, area: 234.0, weight: 1.87, ys: 10.84, ix: 34900, rx: 12.2 },
  { size: 40, t: 4, area: 308.0, weight: 2.46, ys: 11.20, ix: 44700, rx: 12.1 },
  { size: 40, t: 5, area: 379.0, weight: 3.03, ys: 11.62, ix: 54300, rx: 12.0 },
  { size: 40, t: 6, area: 448.0, weight: 3.58, ys: 12.02, ix: 63100, rx: 11.9 },
  // 45 x 45: 4, 5
  { size: 45, t: 4, area: 348.0, weight: 2.78, ys: 12.44, ix: 65000, rx: 13.7 },
  { size: 45, t: 5, area: 429.0, weight: 3.43, ys: 12.87, ix: 79000, rx: 13.6 },
  // 50 x 50: 3, 4, 5, 6
  { size: 50, t: 3, area: 296.0, weight: 2.37, ys: 13.08, ix: 68600, rx: 15.2 },
  { size: 50, t: 4, area: 389.0, weight: 3.11, ys: 13.59, ix: 89700, rx: 15.2 },
  { size: 50, t: 5, area: 480.0, weight: 3.84, ys: 14.04, ix: 109600, rx: 15.1 },
  { size: 50, t: 6, area: 569.0, weight: 4.55, ys: 14.45, ix: 128400, rx: 15.0 },
  // 60 x 60: 6
  { size: 60, t: 6, area: 691.0, weight: 5.53, ys: 16.88, ix: 227900, rx: 18.2 },
  // 65 x 65: 6, 8, 9
  { size: 65, t: 6, area: 753.0, weight: 6.02, ys: 18.04, ix: 291900, rx: 19.7 },
  { size: 65, t: 8, area: 985.0, weight: 7.88, ys: 18.88, ix: 374900, rx: 19.5 },
  { size: 65, t: 9, area: 1098.0, weight: 8.78, ys: 19.28, ix: 413700, rx: 19.4 },
  // 75 x 75: 6, 8, 9, 10
  { size: 75, t: 6, area: 873.0, weight: 6.98, ys: 20.53, ix: 458300, rx: 22.9 },
  { size: 75, t: 8, area: 1145.0, weight: 9.16, ys: 21.37, ix: 591300, rx: 22.7 },
  { size: 75, t: 9, area: 1278.0, weight: 10.22, ys: 21.77, ix: 654000, rx: 22.6 },
  { size: 75, t: 10, area: 1409.0, weight: 11.27, ys: 22.16, ix: 714300, rx: 22.5 },
  // 80 x 80: 6, 8
  { size: 80, t: 6, area: 935.0, weight: 7.48, ys: 21.67, ix: 558200, rx: 24.4 },
  { size: 80, t: 8, area: 1227.0, weight: 9.81, ys: 22.55, ix: 722500, rx: 24.3 },
  // 90 x 90: 9
  { size: 90, t: 9, area: 1550.0, weight: 12.40, ys: 25.46, ix: 1162400, rx: 27.4 },
  // 100 x 100: 6, 8, 9, 10
  { size: 100, t: 6, area: 1179.0, weight: 9.44, ys: 26.42, ix: 1110500, rx: 30.7 },
  { size: 100, t: 8, area: 1551.0, weight: 12.41, ys: 27.37, ix: 1448400, rx: 30.6 },
  { size: 100, t: 9, area: 1734.0, weight: 13.88, ys: 27.80, ix: 1609900, rx: 30.5 },
  { size: 100, t: 10, area: 1915.0, weight: 15.32, ys: 28.22, ix: 1766800, rx: 30.4 },
  // 120 x 120: 8, 10, 12, 15
  { size: 120, t: 8, area: 1856.0, weight: 14.85, ys: 32.95, ix: 2608900, rx: 37.5 },
  { size: 120, t: 10, area: 2315.0, weight: 18.52, ys: 33.22, ix: 3137900, rx: 36.8 },
  { size: 120, t: 12, area: 2736.0, weight: 21.89, ys: 34.41, ix: 3731300, rx: 36.9 },
  { size: 120, t: 15, area: 3375.0, weight: 27.00, ys: 35.49, ix: 4503500, rx: 36.5 }
];

const s_gap = 10; // Standard 10mm gusset plates used as double-angle spacer in the PH

export function makeDoubleAngleProfile(single: RawAngleInfo): SectionProfile {
  const d_double = single.size; // vertical leg width (depth)
  const b_double = 2 * single.size + s_gap; // combined horizontal width including gusset gap
  const t_double = single.t;

  const area_double = 2 * single.area; // combined cross sectional area (mm^2)
  const weight_double = 2 * single.weight; // combined weight (kg/m)

  // Moment of Inertia about horizontal axis X-X: ix = 2 * ix_single
  const ix_double = 2 * single.ix;

  // Moment of Inertia about vertical axis Y-Y: iy = 2 * (iy_single + area * (ys + s/2)^2)
  // Since legs are equal, iy_single = ix_single
  const iy_double = 2 * (single.ix + single.area * Math.pow(single.ys + s_gap / 2, 2));

  // Section modulus major: sx = ix_double / c_x, where c_x is max(ys, size - ys)
  const cx = Math.max(single.ys, single.size - single.ys);
  const sx_double = ix_double / cx;

  // Section modulus minor: sy = iy_double / c_y, where c_y is outer horizontal extremity = size + s_gap / 2
  const cy = single.size + s_gap / 2;
  const sy_double = iy_double / cy;

  // Radii of gyration: rx_double = rx_single; ry_double = sqrt(iy_double / area_double)
  const rx_double = single.rx;
  const ry_double = Math.sqrt(iy_double / area_double);

  return {
    name: `2L-${single.size}×${single.size}×${single.t}mm`,
    d: d_double,
    b: b_double,
    t: t_double,
    area: parseFloat(area_double.toFixed(1)),
    weight: parseFloat(weight_double.toFixed(2)),
    ix: parseFloat(ix_double.toFixed(1)),
    iy: parseFloat(iy_double.toFixed(1)),
    sx: parseFloat(sx_double.toFixed(1)),
    sy: parseFloat(sy_double.toFixed(1)),
    rx: parseFloat(rx_double.toFixed(2)),
    ry: parseFloat(ry_double.toFixed(2))
  };
}

export const STANDARD_ANGLES: SectionProfile[] = RAW_SINGLE_ANGLES.map(makeDoubleAngleProfile);

export const STANDARD_PIPES: SectionProfile[] = [
  { name: 'Pipe NPS 1-1/2 (Ø48.3x3.7)', d: 48.3, b: 48.3, t: 3.7, area: 518, weight: 4.07, ix: 129000, iy: 129000, sx: 5340, sy: 5340, rx: 15.8, ry: 15.8 },
  { name: 'Pipe NPS 2 (Ø60.3x3.9)', d: 60.3, b: 60.3, t: 3.9, area: 692, weight: 5.43, ix: 275000, iy: 275000, sx: 9120, sy: 9120, rx: 19.9, ry: 19.9 },
  { name: 'Pipe NPS 2-1/2 (Ø73.0x5.2)', d: 73.0, b: 73.0, t: 5.2, area: 1110, weight: 8.71, ix: 630000, iy: 630000, sx: 17260, sy: 17260, rx: 23.8, ry: 23.8 },
  { name: 'Pipe NPS 3 (Ø88.9x5.5)', d: 88.9, b: 88.9, t: 5.5, area: 1440, weight: 11.31, ix: 1250000, iy: 1250000, sx: 28120, sy: 28120, rx: 29.5, ry: 29.5 }
];

export const STANDARD_WF_SECTIONS: SectionProfile[] = [
  { name: 'W 150 x 14 (H150x100)', d: 150, b: 100, t: 5.5, t_web: 4.3, area: 1785, weight: 14.0, ix: 9170000, iy: 918000, sx: 122000, sy: 18400, rx: 71.7, ry: 22.7 },
  { name: 'W 200 x 15 (H200x100)', d: 200, b: 100, t: 5.2, t_web: 4.5, area: 1910, weight: 15.0, ix: 13300000, iy: 860000, sx: 133000, sy: 17200, rx: 83.4, ry: 21.2 },
  { name: 'W 200 x 22 (H200x150)', d: 200, b: 150, t: 9.0, t_web: 6.0, area: 2860, weight: 22.5, ix: 26300000, iy: 5070000, sx: 263000, sy: 67600, rx: 95.8, ry: 42.1 }
];

export interface ProvinceWindSetting {
  province: string;
  region: string;
  zone: 1 | 2 | 3;
  windSpeed: number; // kph, NSCP 2015
}

/**
 * NSCP 2015 Map-based Local Wind Speeds for Philippine Provinces
 */
export const PHILIPPINE_PROVINCES_WIND: ProvinceWindSetting[] = [
  { province: 'Metro Manila', region: 'NCR', zone: 2, windSpeed: 290 },
  { province: 'Albay', region: 'Bicol (Region V)', zone: 1, windSpeed: 315 },
  { province: 'Aurora', region: 'Central Luzon (Region III)', zone: 1, windSpeed: 315 },
  { province: 'Bataan', region: 'Central Luzon (Region III)', zone: 2, windSpeed: 290 },
  { province: 'Batanes', region: 'Cagayan Valley (Region II)', zone: 1, windSpeed: 315 },
  { province: 'Batangas', region: 'CALABARZON (Region IV-A)', zone: 2, windSpeed: 290 },
  { province: 'Benguet', region: 'CAR', zone: 2, windSpeed: 290 },
  { province: 'Bohol', region: 'Central Visayas (Region VII)', zone: 2, windSpeed: 290 },
  { province: 'Bulacan', region: 'Central Luzon (Region III)', zone: 2, windSpeed: 290 },
  { province: 'Cagayan', region: 'Cagayan Valley (Region II)', zone: 1, windSpeed: 315 },
  { province: 'Camarines Sur', region: 'Bicol (Region V)', zone: 1, windSpeed: 315 },
  { province: 'Cavite', region: 'CALABARZON (Region IV-A)', zone: 2, windSpeed: 290 },
  { province: 'Cebu', region: 'Central Visayas (Region VII)', zone: 2, windSpeed: 290 },
  { province: 'Davao del Sur', region: 'Davao (Region XI)', zone: 3, windSpeed: 200 },
  { province: 'Ilim / Sablayan (Mindoro)', region: 'MIMAROPA (Region IV-B)', zone: 2, windSpeed: 290 },
  { province: 'Ilocos Norte', region: 'Ilocos (Region I)', zone: 2, windSpeed: 290 },
  { province: 'Iloilo', region: 'Western Visayas (Region VI)', zone: 2, windSpeed: 290 },
  { province: 'Isabela', region: 'Cagayan Valley (Region II)', zone: 1, windSpeed: 315 },
  { province: 'Laguna', region: 'CALABARZON (Region IV-A)', zone: 2, windSpeed: 290 },
  { province: 'Leyte', region: 'Eastern Visayas (Region VIII)', zone: 1, windSpeed: 315 },
  { province: 'Masbate', region: 'Bicol (Region V)', zone: 2, windSpeed: 290 },
  { province: 'Negros Occidental', region: 'Western Visayas (Region VI)', zone: 2, windSpeed: 290 },
  { province: 'Nueva Ecija', region: 'Central Luzon (Region III)', zone: 2, windSpeed: 290 },
  { province: 'Palawan', region: 'MIMAROPA (Region IV-B)', zone: 3, windSpeed: 200 },
  { province: 'Pampanga', region: 'Central Luzon (Region III)', zone: 2, windSpeed: 290 },
  { province: 'Pangasinan', region: 'Ilocos (Region I)', zone: 2, windSpeed: 290 },
  { province: 'Quezon', region: 'CALABARZON (Region IV-A)', zone: 1, windSpeed: 315 },
  { province: 'Rizal', region: 'CALABARZON (Region IV-A)', zone: 2, windSpeed: 290 },
  { province: 'Sorsogon', region: 'Bicol (Region V)', zone: 1, windSpeed: 315 },
  { province: 'Samar', region: 'Eastern Visayas (Region VIII)', zone: 1, windSpeed: 315 },
  { province: 'Tarlac', region: 'Central Luzon (Region III)', zone: 2, windSpeed: 290 },
  { province: 'Zamboanga del Sur', region: 'Zamboanga (Region IX)', zone: 3, windSpeed: 200 }
];

export const TOP_CHORD_SECTIONS: SectionProfile[] = [...STANDARD_ANGLES, ...STANDARD_RHS];
export const BOTTOM_CHORD_SECTIONS: SectionProfile[] = [...STANDARD_ANGLES, ...STANDARD_RHS];
export const WEB_SECTIONS: SectionProfile[] = [...STANDARD_ANGLES, ...STANDARD_RHS];

export const ROOF_CLADDING_DBS = [
  { name: 'Corrugated G.I. Sheeting (0.4mm)', weight: 0.08 }, // kPa
  { name: 'Corrugated G.I. Sheeting (0.6mm)', weight: 0.12 }, // kPa
  { name: 'Prepainted Rib Type Long Span (0.5mm)', weight: 0.10 }, // kPa
  { name: 'Asbestos Corrugated Sheet (6mm)', weight: 0.15 }, // kPa
  { name: 'Clay Tiles (framed on battens)', weight: 0.55 }, // kPa
  { name: 'Concrete Roof Tiles', weight: 0.65 }, // kPa
  { name: 'Asphalt Shingles on 12mm Plywood', weight: 0.18 }, // kPa
  { name: 'Custom Roof Panels', weight: 0.10 }, // kPa
];
