// Mixer-to-holder adapter -- JSCAD v2, all dimensions in millimetres.
// Open in https://jscad.app/; edit parameters, render, then export STL.
// Assumption: holderWidth/Depth are the INSIDE dimensions of a pocket.
// X = width; Y = depth (front = negative Y); Z = height.
// Two stacked rectangles: a lower locating block and an upper support tray.
// The tray has a continuous floor, side walls, and only short corner tabs
// across its front/back. The central front/back openings run down to the floor.
// The mixer sits on the floor; it is not meant to pass through the adapter.
// Print with lower block on bed; support the tray's projecting side wings.
// Confirm dimensions, feet/vents and connector positions before a full print.

const { primitives, booleans, modifiers } = require('@jscad/modeling')
const { cuboid, roundedCuboid, cylinder } = primitives
const { union, subtract } = booleans

const getParameterDefinitions = () => [
  { name: 'holderWidth', type: 'float', initial: 109, caption: 'Holder inside width (mm)' },
  { name: 'holderDepth', type: 'float', initial: 118, caption: 'Holder inside depth (mm)' },
  { name: 'holderHeight', type: 'float', initial: 16, caption: 'Lower locating block height (mm)' },
  { name: 'holderClearance', type: 'float', initial: 0.3, caption: 'Holder clearance PER SIDE (mm)' },
  { name: 'mixerWidth', type: 'float', initial: 142, caption: 'Mixer body width (mm)' },
  { name: 'mixerDepth', type: 'float', initial: 95, caption: 'Mixer body depth (mm)' },
  { name: 'mixerClearance', type: 'float', initial: 0.3, caption: 'Mixer clearance PER SIDE (mm; 0 = exact cut)' },
  { name: 'floorThickness', type: 'float', initial: 3, caption: 'Support floor thickness (mm)' },
  { name: 'wallThickness', type: 'float', initial: 3, caption: 'Tray wall thickness (mm)' },
  { name: 'wallHeight', type: 'float', initial: 10, caption: 'Retaining wall height ABOVE floor (mm)' },
  { name: 'cornerTab', type: 'float', initial: 5, caption: 'Front/back tabs INTO opening from each side (mm)' }
]

const box = (w, d, h, x, y, z) => cuboid({ size: [w, d, h], center: [x, y, z] })
const roundedBox = (w, d, h, x, y, z, r) => roundedCuboid({ size: [w, d, h], center: [x, y, z], segments: 12, roundedRadius: r })

// Same first six arguments as box().
// reliefRadius: extra corner clearance in mm.
// segments: cylinder resolution; 12 is usually sufficient.
const boxWithCornerRelief = (
  w, d, h,
  x = 0, y = 0, z = 0,
  reliefRadius = 0.5,
  segments = 12
) => {
  const rectangle = box(w, d, h, x, y, z)

  if (reliefRadius <= 0) return rectangle

  const corners = [
    [x - w / 2, y - d / 2],
    [x + w / 2, y - d / 2],
    [x + w / 2, y + d / 2],
    [x - w / 2, y + d / 2]
  ]

  const reliefs = corners.map(([cx, cy]) =>
    cylinder({
      center: [cx, cy, z],
      height: h,
      radius: reliefRadius,
      segments
    })
  )

  return union(rectangle, ...reliefs)
}

// Same first six arguments as box().
// Overall dimensions, including ribs, remain w × d × h.
const boxWithFitRibs = (
  w, d, h,
  x = 0, y = 0, z = 0,
  recess = 2,
  ribWidth = 0.8,
  ribSpacing = 30
) => {
  if (recess <= 0 || 2 * recess >= d) {
    throw new Error('recess must be positive and smaller than half the depth')
  }
  if (ribWidth <= 0 || ribWidth > w || ribSpacing <= 0) {
    throw new Error('Invalid rib width or spacing')
  }

  // Recess front and back, leaving the width unchanged.
  const core = box(w, d - 2 * recess, h, x, y, z)

  // Distribute ribs evenly, approximately ribSpacing apart.
  const ribCount = Math.max(1, Math.round(w / ribSpacing))
  const actualSpacing = w / ribCount

  // Slight overlap ensures each rib joins the core.
  const overlap = 1.0
  const ribDepth = recess + overlap
  const ribs = []

  for (let i = 0; i < ribCount; i++) {
    const ribX = x - w / 2 + (i + 0.5) * actualSpacing

    for (const side of [-1, 1]) {
      const ribY = y + side * (d / 2 - ribDepth / 2)

      ribs.push(
        roundedBox(ribWidth, ribDepth, h, ribX, ribY, z, 1)
      )
    }
  }

  return union(core, ...ribs)
}


const main = (parameters = {}) => {
  // Defaults also permit main() in a local Node.js workflow.
  const p = Object.fromEntries(getParameterDefinitions().map(d => [d.name, d.initial]))
  Object.assign(p, parameters)
  for (const [name, value] of Object.entries(p)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(name + ' must be a finite number')
    }
  }
  for (const name of ['holderWidth', 'holderDepth', 'holderHeight', 'mixerWidth',
    'mixerDepth', 'floorThickness', 'wallThickness', 'wallHeight']) {
    if (p[name] <= 0) throw new Error(name + ' must be positive')
  }
  if (p.holderClearance < 0 || p.mixerClearance < 0 || p.cornerTab < 0) {
    throw new Error('Clearances and cornerTab must be nonnegative')
  }

  const lowerW = p.holderWidth - 2 * p.holderClearance
  const lowerD = p.holderDepth - 2 * p.holderClearance
  const innerW = p.mixerWidth + 2 * p.mixerClearance
  const innerD = p.mixerDepth + 2 * p.mixerClearance
  const outerW = innerW + 2 * p.wallThickness
  const outerD = innerD + 2 * p.wallThickness
  if (lowerW <= 0 || lowerD <= 0) throw new Error('Holder clearance consumes lower block')
  if (2 * p.cornerTab >= innerW) throw new Error('Corner tabs must leave an open front/back')

  const floorZ = p.holderHeight + p.floorThickness
  const lower = boxWithFitRibs(
    lowerW, lowerD, p.holderHeight,
    0, 0, p.holderHeight / 2,
    1,   // Front/back recess, per side
    0.8, // Rib thickness
    30   // Approximate distance between ribs
  )
  const floor = box(outerW, outerD, p.floorThickness, 0, 0,
    p.holderHeight + p.floorThickness / 2)

  // Make one rectangular ring, then remove the front/back middle sections.
  // Small overlaps with floor guarantee a single connected printable solid.
  const eps = 0.01
  const wallBottom = floorZ - eps
  const wallH = p.wallHeight + eps
  const wallZ = wallBottom + wallH / 2
  const outside = box(outerW, outerD, wallH, 0, 0, wallZ)
  // box(innerW, innerD, wallH + 2 * eps, 0, 0, wallZ)
  const insideCut = boxWithCornerRelief(
    innerW, innerD, wallH + 2 * eps,
    0, 0, wallZ,
    0.5, // Corner relief radius in mm
    12   // Cylinder segments
  )
  const frontBackCut = box(innerW - 2 * p.cornerTab, outerD + 2 * eps,
    wallH + 2 * eps, 0, 0, wallZ)
  const walls = subtract(outside, insideCut, frontBackCut)

  // Resolve boolean T-junctions into a closed triangle mesh for STL export.
  return modifiers.generalize({ snap: true, simplify: true, triangulate: true },
    union(lower, floor, walls))
}

module.exports = { main, getParameterDefinitions }