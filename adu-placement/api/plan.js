// Server-side Baserow plan lookup.
//
// Powers the "See This Plan on Your Property" button on frameupnow.com and
// aduplans.com: the site sends only a Plan ID (?plan=00159) and this endpoint
// resolves it to the plan's to-scale footprint and lot-based floor plan.
//
// The token lives in BASEROW_TOKEN (server-side, NOT a VITE_ variable) so it
// never reaches the browser — a Vite-exposed token would hand every visitor
// read/write access to the plans table.

const TABLE = process.env.BASEROW_TABLE_ID || "523542";
const PLAN_ID_FIELD = "field_4163058"; // the "Plan ID" formula column

// "00022_25x28.png" / "00025_35x28.6.png" -> { width, depth } in feet.
// NOTE: a fractional part of .10 or .11 can only be inches (nobody writes a
// decimal as "45.10"), so those are read as feet-and-inches. Everything else is
// read as decimal feet, matching how the rest of the catalogue is named.
function parseDimsFromFilename(name) {
  if (!name) return null;
  const m = name.match(/_([\d.]+)\s*[x×X]\s*([\d.]+)\s*\.(?:png|jpe?g)$/i);
  if (!m) return null;
  const val = (s) => {
    const parts = String(s).split(".");
    if (parts.length === 2 && (parts[1] === "10" || parts[1] === "11")) {
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 12;
    }
    return parseFloat(s);
  };
  const width = val(m[1]);
  const depth = val(m[2]);
  if (!width || !depth) return null;
  return { width, depth };
}

function parseBedsBaths(label) {
  if (!label) return { bedrooms: "See plan", bathrooms: "See plan" };
  const bath = label.match(/([\d.]+)\s*Bath/i);
  if (/studio/i.test(label)) {
    return { bedrooms: "Studio", bathrooms: bath ? parseFloat(bath[1]) : 1 };
  }
  const bed = label.match(/(\d+)\s*Bed/i);
  return {
    bedrooms: bed ? parseInt(bed[1], 10) : "See plan",
    bathrooms: bath ? parseFloat(bath[1]) : "See plan",
  };
}

const selVal = (v) => (v && typeof v === "object" ? v.value : v);

function normalize(row) {
  if (!row) return null;
  const lsf = (row["Lot-Specific Floor Plans"] || [])[0];
  if (!lsf) return null;                       // no to-scale drawing -> not placeable
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

export default async function handler(req, res) {
  const id = String(req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "missing id" });

  const token = process.env.BASEROW_TOKEN;
  if (!token) return res.status(500).json({ error: "BASEROW_TOKEN is not configured" });

  const url =
    `https://api.baserow.io/api/database/rows/table/${TABLE}/` +
    `?user_field_names=true&size=1&filter__${PLAN_ID_FIELD}__equal=${encodeURIComponent(id)}`;

  try {
    const upstream = await fetch(url, { headers: { Authorization: `Token ${token}` } });
    if (!upstream.ok) return res.status(502).json({ error: `Baserow HTTP ${upstream.status}` });
    const data = await upstream.json();
    const plan = normalize((data.results || [])[0]);
    if (!plan) return res.status(404).json({ error: "plan not found, or has no to-scale floor plan" });
    // The catalogue changes rarely; let the CDN absorb repeat clicks.
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    return res.status(200).json(plan);
  } catch {
    return res.status(502).json({ error: "lookup failed" });
  }
}
