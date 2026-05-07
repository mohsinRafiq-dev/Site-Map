# FrameUpNow ADU Tool — Client Implementation Q&A

**Prepared for:** Rodger / FrameUpNow  
**Date:** May 2026

---

## On Floor Plan Files

No external dimensions needed. The tool stores the dimensions as data (width × depth in feet) separately from the image. The image that sits on the map should be clean — just walls, rooms, and doors. The math that scales it to real-world size is handled in the code, not in the image itself.

---

## Question 1 — Hide the Floor Plan on the Home Page / "Click to Place" Flow

**Yes, fully implementable.** The way it would work:

- Your marketing page shows the floor plan image as a product photo
- A button below it says **"Place this floor plan on your lot →"**
- Clicking it opens the tool with that plan pre-selected and ready to drop on the map
- The customer just types their address and the plan lands on their property instantly

We can pass the selected plan ID through the URL (e.g. `?plan=absolute-30x18`) so the tool knows which one to load automatically.

---

## Question 2 — Scale: How the Floor Plan Matches Satellite Imagery

This is the most important question and the answer is already built into the tool.

**Here is exactly how it works:**

We know the floor plan is **30 feet wide × 18 feet deep**. The satellite map uses real-world latitude/longitude coordinates. When we place the floor plan on the map, we calculate the 4 corner coordinates in latitude/longitude using Earth's geometry:

- 1 degree of latitude = 111,320 meters everywhere
- 1 degree of longitude = 111,320 × cos(latitude) meters (varies by location)
- So 30 feet converts to a precise number of degrees

The result: the image is pinned to **4 exact GPS coordinates** that are precisely 30 feet apart east-west and 18 feet apart north-south. The satellite image underneath is also georeferenced at real-world scale. So the floor plan **always appears at exactly the correct scale** relative to the satellite — no guessing, no manual scaling.

This works at any address in the world. Whether the lot is in Arizona or Vermont, the math adjusts for latitude automatically.

---

## Question 3 — Rotation Within the Buildable Area + Setbacks

**Already fully built.** The tool:

- Draws the **lot boundary** (blue outline) from the dimensions the customer enters
- Calculates the **buildable area** (dashed yellow line) by subtracting front/back/left/right setbacks
- The floor plan can be **dragged freely** within the buildable area
- **Snap-to-setbacks** keeps it from crossing the legal boundary
- **Rotate buttons** let the customer spin the plan in 1°, 15°, or 90° increments
- **"Align to street"** automatically rotates it to face the nearest road
- **Setback inputs** are adjustable — if the customer knows their local setbacks differ from the defaults, they update the numbers and the buildable area redraws instantly

---

## Bottom Line

Yes, this is all implementable. The scale problem (Question 2) is the one that stops most people, but it is already solved because both the satellite imagery and the floor plan overlay use the same real-world coordinate system. There is no manual calibration required.
