// ---------------------------------------------------------------------------
// Physical build specifications for tote storage rack systems.
// Source: storagenetwork configurator (buildEngine / tote-data).
// All dimensions in inches unless noted.
// ---------------------------------------------------------------------------

export const TOTE = {
  name: "HDX 27-Gallon Tough Storage Tote",
  gallons: 27,
  bodyWidth: 19.75,
  bodyDepth: 28.6, // with lid
  bodyHeight: 11,
  rimHeight: 1,
  rimOverhang: 1, // per side
  bodyTaperRatio: 0.85,
  toleranceGap: 0.25, // per side
  /** Slot opening = bodyWidth − 2×rimOverhang + 2×toleranceGap */
  get slotOpening() {
    return this.bodyWidth - 2 * this.rimOverhang + 2 * this.toleranceGap;
  },
} as const;

export const RAILS = {
  material: '3/4" plywood rip',
  thickness: 0.75,
  stripHeight: 1.875, // 1-7/8"
  depth: 30,
  stripsPerSheet: 16, // from a 4×8 sheet at 1-7/8" × 30"
} as const;

export const VERTICAL_SPACING = {
  firstRailHeight: 13, // from bottom plate
  tierSpacing: 16, // center-to-center
  railThickness: RAILS.thickness,
  topGap: 2.5, // above last rail
  /** Clear space between rail surfaces per tier */
  get clearPerTier() {
    return this.tierSpacing - this.railThickness;
  },
} as const;

export const POSTS = {
  stock: "2×4",
  narrowFace: 1.5, // visible width
  depth: 3.5,
  gapBetweenBays: 1.5,
} as const;

export const FRAME = {
  bottomPlateHeight: 1.5, // 2×4 flat
  topPlateHeight: 1.5,
  unitDepth: 30,
  /** Upright height for a given number of rows */
  uprightHeight: (rows: number) => rows * VERTICAL_SPACING.tierSpacing,
  /** Total frame height including plates and top gap */
  frameHeight: (rows: number) =>
    rows * VERTICAL_SPACING.tierSpacing +
    1.5 + // bottom plate
    1.5 + // top plate
    VERTICAL_SPACING.topGap,
  /** Module width for a given number of columns */
  moduleWidth: (cols: number) =>
    cols * TOTE.bodyWidth + (cols + 1) * POSTS.narrowFace,
  /** Max columns per single module before auto-split */
  maxColsPerModule: 4,
} as const;

export const FASTENERS = {
  railScrews: {
    spec: '#9 × 1-5/8" T-25 star drive',
    perRailEnd: 2,
  },
  frameScrews: {
    spec: '#9 × 3" T-25 star drive',
    note: "Through plates into post end-grain",
  },
  casterLags: {
    spec: '1/4" × 1-1/2" lag screws',
    perCaster: 4,
  },
} as const;

export const CASTERS = {
  totalHeight: 5.9,
  wheelDiameter: 5.1,
  mountingPlate: 2.44, // square
  wallFitDeduction: 2.75,
} as const;

export const PLYWOOD_TOP = {
  thickness: 0.75,
  depth: 30,
  /** Number of sheets needed for a given unit width */
  sheetsNeeded: (unitWidth: number) => (unitWidth <= 96 ? 1 : 2),
} as const;

// ---------------------------------------------------------------------------
// Tote alternatives by retailer
// ---------------------------------------------------------------------------
export const TOTE_BRANDS = [
  { retailer: "Home Depot", name: "HDX 27-Gallon Tough Storage Tote", note: "black/yellow lid — gold standard" },
  { retailer: "Costco", name: "GreenMade 27-Gallon Storage Bin", note: null },
  { retailer: "Lowe's", name: "Style Selections 27-Gallon", note: null },
  { retailer: "Walmart", name: "Hefty Hi-Rise 27-Gallon", note: null },
] as const;

// ---------------------------------------------------------------------------
// Example: 15-tote unit (5 cols × 3 rows)
// ---------------------------------------------------------------------------
export const EXAMPLE_15_TOTE = {
  cols: 5,
  rows: 3,
  totes: 15,
  moduleWidth: FRAME.moduleWidth(5), // 107.75"
  frameHeight: FRAME.frameHeight(3), // 53.5"
  depth: FRAME.unitDepth,
  uprightLength: FRAME.uprightHeight(3), // 48"
  splitNote: "5 cols exceeds max 4 per module → builds as 4+1 split",
} as const;
