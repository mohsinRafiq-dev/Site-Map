// Baserow deep-link plan fetch.
//
// Powers the "Place on my lot" button on aduplans.com: a customer clicks it on a
// plan and lands on the tool at  ?plan=<PlanID> . We fetch that single plan row
// from Baserow (table 523542) and normalize it into the shape the wizard + map
// expect (same fields a Firestore plan has), so it places to scale immediately.
//
// The to-scale footprint dimensions live in the "Lot-Specific Floor Plans"
// filename — e.g.  00022_25x28.png  → 25 ft × 28 ft  (same  <id>_WxD.png  format
// the migrate script already parses). A plan WITHOUT that file is not placeable.

const TOKEN = import.meta.env.VITE_BASEROW_TOKEN;
const TABLE = import.meta.env.VITE_BASEROW_TABLE_ID || "523542";
const PLAN_ID_FIELD = "field_4163058"; // the "Plan ID" formula column

// "00022_25x28.png" / "00025_35x28.6.png" → { width, depth }. Accepts x / X / ×.
function parseDimsFromFilename(name) {
  if (!name) return null;
  const m = name.match(/_([\d.]+)\s*[x×X]\s*([\d.]+)\s*\.png$/i);
  if (!m) return null;
  const width = parseFloat(m[1]);
  const depth = parseFloat(m[2]);
  if (!width || !depth) return null;
  return { width, depth };
}

// "Studio 1 Bath" → { bedrooms:"Studio", bathrooms:1 }
// "3 Bed 2 Bath"  → { bedrooms:3, bathrooms:2 }
function parseBedsBaths(label) {
  if (!label) return { bedrooms: "See plan", bathrooms: "See plan" };
  const bath = label.match(/(\d+)\s*Bath/i);
  if (/studio/i.test(label)) {
    return { bedrooms: "Studio", bathrooms: bath ? parseInt(bath[1], 10) : 1 };
  }
  const bed = label.match(/(\d+)\s*Bed/i);
  return {
    bedrooms: bed ? parseInt(bed[1], 10) : "See plan",
    bathrooms: bath ? parseInt(bath[1], 10) : "See plan",
  };
}

// Single-select cells come back as { id, value, color }; plain text as a string.
function selVal(v) {
  return v && typeof v === "object" ? v.value : v;
}

// Baserow row (user_field_names=true) → tool plan object, or null if the plan
// has no to-scale floor-plan file and therefore can't be placed.
export function normalizeBaserowPlan(row) {
  if (!row) return null;
  const lsf = (row["Lot-Specific Floor Plans"] || [])[0];
  if (!lsf) return null;
  const dims = parseDimsFromFilename(lsf.visible_name || lsf.name);
  if (!dims) return null;

  const planId = String(row["Plan ID"] ?? "").trim();
  const sqft = parseInt(row["Sq-Ft"], 10) || Math.round(dims.width * dims.depth);
  const jurisdiction = row["Jurisdiction"] || selVal(row["State"]) || "ADU Plan";
  const style = (row["Elevation Style or Name"] || "").trim();
  const floorPlanLabel = selVal(row["Floor-plan"]);
  const { bedrooms, bathrooms } = parseBedsBaths(floorPlanLabel);

  return {
    id: planId,
    series: jurisdiction,
    name: style || `Plan ${planId}`,
    tagline: [floorPlanLabel, `${sqft.toLocaleString()} sq ft`, jurisdiction]
      .filter(Boolean)
      .join(" · "),
    width: dims.width,
    depth: dims.depth,
    sqft,
    image: lsf.url,
    keySpecs: {
      livableSqft: sqft,
      bedrooms,
      bathrooms,
      floors: selVal(row["1-or-2-Story"]) === "2-Story" ? 2 : 1,
      garage: /yes/i.test(selVal(row["Garage"]) || "") ? 1 : 0,
      studs: "See plan",
    },
    source: "baserow",
  };
}

// Fetch one plan by its Baserow "Plan ID" (e.g. "00022"). Returns a normalized
// plan object, or null if not found / not placeable.
export async function fetchPlanById(planId) {
  if (!TOKEN) throw new Error("VITE_BASEROW_TOKEN is not configured");
  const id = String(planId).trim();
  if (!id) return null;

  const url =
    `https://api.baserow.io/api/database/rows/table/${TABLE}/` +
    `?user_field_names=true&size=1&filter__${PLAN_ID_FIELD}__equal=${encodeURIComponent(id)}`;

  const res = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` } });
  if (!res.ok) throw new Error(`Baserow HTTP ${res.status}`);
  const data = await res.json();
  return normalizeBaserowPlan((data.results || [])[0]);
}
