// Catalog of ADU floor plans.
// Geometry is authored in real-world feet (origin = bottom-left of the footprint),
// so rooms, walls, doors and decks render at true scale on map overlays.
//
// Each plan exposes:
//   - dimensions (footprint W × D, livable sf)
//   - keySpecs (the marketing block: bedrooms / bathrooms / floors / etc.)
//   - description + features (long-form copy for the detail panel)
//   - layout (rooms, walls, doors, decks) used by FloorPlanSvg.jsx
//   - image (optional) — Vite-imported asset URL used everywhere instead of SVG renderer
//
// Notes:
//   - Bottom edge (y = 0) is the FRONT of the home (front door / street side).
//   - Back deck sits along the top edge (y = depth).
//   - Coordinates use feet; SVG viewBox in the renderer matches W × D.

import absoluteFloorPlanImage from "../Floor Plans/Floor Plan Absolute.jpg";

// --- Joshua's batch (review samples, 2026-05-20) ---
import sample_1055 from "../../Sample Floor Plans/1055_17x35.png";
import sample_1056 from "../../Sample Floor Plans/1056_17x35.png";
import sample_1057 from "../../Sample Floor Plans/1057_31x40.png";
import sample_1058 from "../../Sample Floor Plans/1058_31x40.png";
import sample_1059 from "../../Sample Floor Plans/1059_44x46.png";
import sample_1060 from "../../Sample Floor Plans/1060_44x46.png";
import sample_5712 from "../../Sample Floor Plans/5712_23x25.png";
import sample_5713 from "../../Sample Floor Plans/5713_24x32.png";
import sample_5714 from "../../Sample Floor Plans/5714_35x28.png";
import sample_5715 from "../../Sample Floor Plans/5715_37x27.png";

function sampleEntry(id, image, width, depth, label) {
  return {
    id: `sample-${id}`,
    series: "Joshua Batch",
    name: `Sample ${id}${label ? ` (${label})` : ""}`,
    tagline: `${width}' × ${depth}' — review sample`,
    width,
    depth,
    sqft: width * depth,
    image,
    keySpecs: {
      livableSqft: width * depth,
      bedrooms: "-",
      bathrooms: "-",
      floors: 1,
      garage: 0,
      studs: "-",
    },
    description: `Joshua's sample ${id}. Declared ${width} ft (W) × ${depth} ft (D).`,
    features: [],
    layout: { rooms: [], decks: [], doors: [] },
  };
}

export const SAMPLE_PLANS = [
  sampleEntry("1055", sample_1055, 17, 35, "open corners"),
  sampleEntry("1056", sample_1056, 17, 35, "closed corners"),
  sampleEntry("1057", sample_1057, 31, 40, "L clean"),
  sampleEntry("1058", sample_1058, 31, 40, "L floating walls"),
  sampleEntry("1059", sample_1059, 44, 46, "L A"),
  sampleEntry("1060", sample_1060, 44, 46, "L B"),
  sampleEntry("5712", sample_5712, 23, 25),
  sampleEntry("5713", sample_5713, 24, 32, "high-res"),
  sampleEntry("5714", sample_5714, 35, 28),
  sampleEntry("5715", sample_5715, 37, 27, "aspect mismatch"),
];

export const FLOOR_PLANS = [
  {
    id: "absolute-30x18",
    series: "FUN Collection",
    name: "Absolute",
    tagline: "Compact 1-bed retreat with two decks",
    width: 30,
    depth: 18,
    sqft: 774,
    customRenderer: "absolute",
    image: absoluteFloorPlanImage,
    frontVector: [0, 1], // front door is on the +y (south) edge of the SVG
    keySpecs: {
      livableSqft: 774,
      bedrooms: 1,
      bathrooms: 1,
      floors: 1,
      garage: 0,
      studs: "2 x 4",
    },
    description:
      "A perfectly compact yet spacious 1-bedroom layout that lives much larger than its footprint. An open kitchen flows into a sun-filled living + dining space, with a private bedroom tucked behind a hall closet. Step out onto generous front and back decks for true indoor-outdoor living — perfect for guests, rental income, or a quiet creative studio.",
    features: [
      "Open-concept Kitchen + Living + Dining (283 sf combined)",
      "Private bedroom with deep walk-in closet",
      "Full bathroom with soaking tub & shower",
      "In-unit stackable washer / dryer",
      "Front entry deck (28 sf) + back lounge deck (180 sf)",
      "Energy-efficient 2x4 framed exterior",
    ],
    layout: {
      rooms: [
        { id: "bath",   label: "BATHROOM",      sqft: 36,  x: 0,    y: 12,  w: 6,  d: 6 },
        { id: "hall",   label: "HALL",          sqft: 19,  x: 6,    y: 12,  w: 4,  d: 6,  small: true },
        { id: "wd",     label: "W/D",           sqft: 9,   x: 10,   y: 14,  w: 3,  d: 3,  small: true },
        { id: "kitchen",label: "KITCHEN",       sqft: 120, x: 13,   y: 7,   w: 7,  d: 11 },
        { id: "living", label: "LIVING + DINING", sqft: 163, x: 20, y: 3,   w: 10, d: 15 },
        { id: "bed",    label: "BEDROOM",       sqft: 103, x: 0,    y: 3,   w: 9,  d: 9 },
        { id: "closet", label: "CLOSET",        sqft: 19,  x: 9,    y: 3,   w: 4,  d: 5,  small: true },
        { id: "foyer",  label: "FOYER",         sqft: 12,  x: 13,   y: 3,   w: 7,  d: 4,  small: true },
      ],
      decks: [
        { id: "deck-front", label: "DECK", sqft: 28,  x: 13, y: -2.5, w: 7,  d: 2.5,  side: "front" },
        { id: "deck-back",  label: "DECK", sqft: 180, x: 5,  y: 18,   w: 20, d: 4,    side: "back" },
      ],
      doors: [
        { x: 16, y: 0,   facing: "south" },   // front entry
        { x: 16, y: 18,  facing: "north" },   // back to deck
        { x: 25, y: 18,  facing: "north" },   // living to back deck
      ],
    },
  },
  {
    id: "refuge-24x32",
    series: "COZY Collection",
    name: "Refuge",
    tagline: "True 1-bed cottage with covered porch",
    width: 24,
    depth: 32,
    sqft: 712,
    keySpecs: {
      livableSqft: 712,
      bedrooms: 1,
      bathrooms: 1,
      floors: 1,
      garage: 0,
      studs: "2 x 6",
    },
    description:
      "Refuge is a true 1-bedroom cottage built for slow living. A covered front porch invites you into an open kitchen and living room with vaulted ceiling potential. A spacious primary bedroom anchors the rear, with a generous walk-in closet and full bathroom — all wrapped in efficient 2x6 exterior framing for year-round comfort.",
    features: [
      "Covered front porch (96 sf)",
      "Vaulted-ready open kitchen + living",
      "Primary bedroom with walk-in closet",
      "Full bathroom with double vanity",
      "Energy-efficient 2x6 exterior walls",
      "Roughed-in for ductless mini-split",
    ],
    layout: {
      rooms: [
        { id: "porch-room", label: "PORCH",  sqft: 96,  x: 0,  y: 0,   w: 24, d: 4, isPorch: true },
        { id: "living",     label: "LIVING + KITCHEN", sqft: 280, x: 0, y: 4, w: 24, d: 14 },
        { id: "hall",       label: "HALL",   sqft: 28,  x: 8,  y: 18,  w: 8,  d: 4, small: true },
        { id: "bath",       label: "BATH",   sqft: 56,  x: 0,  y: 18,  w: 8,  d: 7 },
        { id: "closet",     label: "CLOSET", sqft: 24,  x: 16, y: 18,  w: 8,  d: 4, small: true },
        { id: "bed",        label: "BEDROOM",sqft: 154, x: 0,  y: 25,  w: 24, d: 7 },
      ],
      decks: [
        { id: "porch", label: "COVERED PORCH", sqft: 96, x: 0, y: -3, w: 24, d: 3, side: "front" },
      ],
      doors: [
        { x: 12, y: 4, facing: "south" },
        { x: 4,  y: 25, facing: "south" },
      ],
    },
  },
  {
    id: "horizon-36x24",
    series: "VIEW Collection",
    name: "Horizon",
    tagline: "2-bed with great-room and view wall",
    width: 36,
    depth: 24,
    sqft: 864,
    keySpecs: {
      livableSqft: 864,
      bedrooms: 2,
      bathrooms: 1,
      floors: 1,
      garage: 0,
      studs: "2 x 6",
    },
    description:
      "Built around a southern \"view wall\" of windows, Horizon delivers a true 2-bedroom layout with a generous great-room. Two private bedrooms share a centered bathroom, while the open kitchen and dining flow onto a long rear deck. Designed for families, multi-generational living, or premium short-term rental.",
    features: [
      "Two private bedrooms, both with closets",
      "Great-room with south-facing view wall",
      "Open kitchen with island seating",
      "Bathroom with separate tub + walk-in shower",
      "Wraparound rear deck (216 sf)",
      "Pre-wired for EV charger",
    ],
    layout: {
      rooms: [
        { id: "bed1",   label: "BEDROOM 1", sqft: 130, x: 0,  y: 14, w: 11, d: 10 },
        { id: "closet1",label: "CLOSET",    sqft: 14,  x: 11, y: 14, w: 3,  d: 4,  small: true },
        { id: "bath",   label: "BATH",      sqft: 60,  x: 11, y: 18, w: 6,  d: 6 },
        { id: "hall",   label: "HALL",      sqft: 24,  x: 14, y: 14, w: 8,  d: 3, small: true },
        { id: "closet2",label: "CLOSET",    sqft: 14,  x: 22, y: 14, w: 3,  d: 4,  small: true },
        { id: "bed2",   label: "BEDROOM 2", sqft: 110, x: 25, y: 14, w: 11, d: 10 },
        { id: "kitchen",label: "KITCHEN",   sqft: 130, x: 0,  y: 0,  w: 13, d: 10 },
        { id: "living", label: "GREAT ROOM",sqft: 230, x: 13, y: 0,  w: 23, d: 10 },
        { id: "wd",     label: "W/D",       sqft: 12,  x: 17, y: 17, w: 4,  d: 3,  small: true },
        { id: "foyer",  label: "FOYER",     sqft: 18,  x: 17, y: 10, w: 6,  d: 3, small: true },
      ],
      decks: [
        { id: "deck-back", label: "DECK", sqft: 216, x: 0, y: 24, w: 36, d: 6, side: "back" },
      ],
      doors: [
        { x: 20, y: 0, facing: "south" },
        { x: 8,  y: 24, facing: "north" },
        { x: 28, y: 24, facing: "north" },
      ],
    },
  },
  ...SAMPLE_PLANS,
];

export function getFloorPlanById(id) {
  return FLOOR_PLANS.find((p) => p.id === id) || null;
}
