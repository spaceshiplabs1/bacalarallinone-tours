// Generate images for bacalarallinone.tours via Gemini 3.1 Flash Image (Nano Banana 2).
// Usage:
//   node scripts/generate-image.mjs <preset>          # generate one preset
//   node scripts/generate-image.mjs --all             # generate every preset sequentially
//   node scripts/generate-image.mjs --resize <preset> # only re-derive sizes from existing master
//   node scripts/generate-image.mjs --list            # list all available presets
//
// Rules:
//   - 1 Gemini call per image. Derived sizes (thumbs) are done locally via sharp.
//   - Gemini returns JPEG; we save master as WebP (quality 88) and derivatives as WebP.
//   - For visual consistency (e.g. brand wordmark across multiple shots), define a ref preset
//     (size "1K"), then list it in `refs:` of downstream presets — it is sent as inlineData
//     as a multimodal part BEFORE the prompt.

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY in .env");
  process.exit(1);
}

const OUT_DIR = "images";
const MODEL = "gemini-3.1-flash-image-preview";

// Shared stylistic DNA for every shot on this site.
const EDITORIAL_BASE = `Photorealistic editorial travel photograph, Condé Nast Traveler meets National Geographic aesthetic, ultra-sharp, natural color grading, no text, no watermarks, no logos, no people unless explicitly described.`;

// Bacalar water palette — recurring prompt fragment.
const BACALAR_WATER = `the unmistakable seven shades of turquoise Laguna de Bacalar freshwater — from palest cyan in the shallows over white limestone sand, through electric teal and jade, deepening into sapphire over the deeper basin.`;

const PRESETS = {
  // ── Brand wordmark reference (1K). Referenced by branded shots if needed. ──
  "logo-mark": {
    aspectRatio: "1:1",
    size: "1K",
    derive: false,
    prompt: `Clean minimalist editorial travel-brand wordmark logo: the words "bacalarallinone.tours" in lowercase, set on a single horizontal line, in an elegant contemporary sans-serif typeface with subtle letterspacing. Warm off-white bone background (#f6f1e6). The text is a deep teal-navy ink color (#0c2a2e). Generous whitespace around the wordmark, centered, no other graphic elements, no icons, no frames, no decorations, no tagline. Like the wordmark of a high-end boutique travel agency. 1:1 square ratio, flat, print-quality, ultra-sharp.`,
  },

  // ── HERO (home landing) ──
  "hero-lagoon": {
    aspectRatio: "16:9",
    size: "2K",
    prompt: `Cinematic editorial aerial photograph of Laguna de Bacalar, Quintana Roo, Mexico, shot from a drone at about 60° angle at the start of golden hour. ${BACALAR_WATER} A single modern white-hulled fiberglass recreational sailboat (around 32–40 ft, sleek contemporary lines, white monohull with subtle navy or light-grey trim, white furled Dacron sails on a tall aluminium mast, small bimini shade — NOT a vintage wooden boat, NOT a traditional craft with varnished wood or cream canvas) drifts along a lighter cyan channel in the mid-ground, leaving a faint wake. Below the surface, clearly visible from above, a cluster of rounded grey-green stromatolite colonies in the shallows. A long bleached-wood pier extends from the palm-lined emerald shore in the lower-left. Soft warm light, glassy water, misty distant shore. ${EDITORIAL_BASE} 16:9 ratio, 2K.`,
  },

  // ── TOURS ──
  "sailboat-bacalar": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial travel photograph of a modern white-hulled recreational sailboat gliding across Laguna de Bacalar at late-afternoon golden hour. The boat is a contemporary fiberglass monohull around 32–40 ft, sleek clean lines, glossy white hull (NOT wooden, NOT vintage, NOT traditional), white Dacron mainsail hoisted on a tall aluminium mast with matching white jib, a small bimini shade over the cockpit, subtle navy or light-grey trim on the hull — the kind of boat used by boutique charter operators on the lagoon today, not a historic craft. Shot from water level on a nearby small boat, 35mm lens, the sailboat in three-quarter view filling the mid-ground. ${BACALAR_WATER} Soft silhouettes of a few passengers relaxing on deck in casual modern beachwear (not the main focus). Warm low-angle sunlight catching the sail edges, long reflections streaking across the glassy turquoise water toward the camera. Palm-lined distant shore in the background, sky shifting from peach to lavender. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "pontoon-rapids": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial aerial photograph of the Canal de los Piratas in Bacalar — a narrow shallow turquoise rapids channel cutting between two low emerald mangrove islands. A private white pontoon boat with a soft canvas bimini shade drifts slowly through the channel, a couple of silhouetted guests leaning over the bow looking into the crystal-clear water. Shot from drone at 30° angle, mid-morning, water so translucent the pale sandy-limestone bottom is fully visible. A small floating table with ceviche bowls visible on the pontoon deck for scale. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "kayak-sunrise": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial aerial photograph of two clear-hulled kayaks and one stand-up paddleboard gliding across Laguna de Bacalar at first light. Shot from above at a 30° angle, revealing the perfectly transparent turquoise water, the pale sandy bottom, and a cluster of rounded stromatolite colonies just below the surface — directly beside the kayaks. Kayakers are silhouettes backlit by the low golden sunrise, long glowing reflections streaking across the glassy water. Misty pink-gold dawn sky, a thin line of palms on the shoreline, zero crowds. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "cenotes-tour": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Cinematic editorial photograph inside a Yucatán jungle cenote near Bacalar — a limestone sinkhole with a circular jungle-fringed opening above. Shafts of warm midday sunlight pierce down through the opening onto turquoise-green water, creating dramatic god rays through the mineral-misted air. Tree roots and vines drape from the rim down toward the water. In the lower half of the frame, the pool with a clear ladder-rope and a single swimmer surfacing, ripples fanning out. Rich deep teal shadows around the edges of the frame. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "chacchoben-port": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial photograph of the Chacchoben Mayan archaeological site deep in the Quintana Roo jungle — a stepped stone pyramid half-reclaimed by tropical vegetation, weathered limestone in warm cream-and-ochre tones, moss softening the upper terraces. Shot from the base at a slight upward angle, late-afternoon golden side light carving the steps. Dense lush jungle pressing in from either side of the plaza, broad palms and ferns in the foreground. No crowds. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "kohunlich": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial archaeological photograph of the Kohunlich Temple of the Masks in the southern Yucatán jungle — a weathered Maya pyramid staircase with five large carved stucco masks of the sun god K'inich Ajaw flanking the stairs, each mask about 2m tall with stylized crossed-eye features and ornate headdresses. Warm late-afternoon side light sculpts the masks, casting long shadows. Dense jungle pressing in from either side, a stone plaza in the foreground. No people. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "tulum-day": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Cinematic editorial photograph of the Tulum Mayan ruins at dawn, shot from the cliff edge looking out to the turquoise Caribbean sea. The iconic El Castillo stone temple sits silhouetted warm on the cliff against a soft peach-and-lavender pre-sunrise sky. Limestone walls of the walled city in the mid-ground, palms swaying, pale sand beach with gentle turquoise surf below. Long shadows, warm golden first light just catching the stone. Empty of crowds. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "chichen-itza": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Cinematic editorial photograph of El Castillo pyramid (Kukulcán) at Chichén Itzá in Yucatán, early morning private access before tourists arrive. Shot at a respectful three-quarter angle from the grass plaza, the stepped pyramid dominating the frame, carved serpent heads at the base catching the first warm sunlight. Thin ground mist drifts across the emerald lawn. Dramatic low golden-hour side light carves the steps, long shadows cascade down. Behind, the Yucatán jungle and dawn sky in a soft rose-and-blue gradient. No people, no crowds. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "mahahual-beach-club": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial photograph of a boutique beach club on the Mahahual Caribbean coast at late morning — pale cream linen-shaded sun beds arranged in an airy line on powdery white sand, a long bleached-wood pier extending into the turquoise Caribbean sea in the background, palms arching overhead. A few thatched palapas for shade, a small beach bar in weathered wood. Two silhouetted guests walking toward the water in the mid-ground. Saturated turquoise sea, bright clean colors, relaxed boutique-resort vibe. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "atv-jungle": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Cinematic editorial photograph of two ATVs splashing through a muddy jungle trail near Mahahual, Quintana Roo — thick tropical canopy closing over the trail, dappled golden sunlight filtering through, mud splatters mid-air frozen by a fast shutter. Helmeted riders in neutral earth-tone gear (no faces readable), movement-forward composition, shallow depth of field, motion blur on the wheels. Lush green ferns, vines, and palms crowding the trail. Warm, adrenaline-forward but cinematic, not commercial. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "snorkel-reef": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial underwater photograph on the Mesoamerican Barrier Reef off Mahahual, Quintana Roo — vibrant living hard corals in yellows, oranges, and purples carpeting the reef floor, a school of iridescent blue-and-yellow queen angelfish drifting through the frame. A single snorkeler in silhouette near the surface above, backlit, sun rays piercing down through the crystalline Caribbean water. Pristine saturated reef colors, visibility easily 20m. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "transfer-cun": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial travel photograph of a clean modern premium passenger van (neutral dark-charcoal color, unbranded) parked on a palm-lined coastal highway in Quintana Roo, Mexico at golden hour. The Caribbean sea visible in the background between the palms, long warm side light, soft shadows. A leather duffle and a small carry-on sit on the asphalt beside the open side door, suggesting door-to-door service. Clean, boutique, calm, nothing corporate. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "transfer-tulum": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial travel photograph of a clean modern premium passenger van (neutral bone-white color, unbranded) on a jungle-lined highway between Tulum and Bacalar at soft early morning light. Low mist rising off the road, tall palms and dense green jungle walls on both sides, a warm golden shaft of first sun hitting the van's windshield. A single pair of huaraches and a linen sun-hat on the back bumper suggesting a relaxed guest just stepping out. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  // ── MAP: illustrated territory map used as MiniMap background (4:3). ──
  // Has baked-in tiny pin markers + labels for each town so the interactive
  // overlay dots sit on top of the same positions. Framing matches MAP_PINS.
  "territory-map": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial hand-drawn illustrated map of the Mexican Caribbean / Yucatán peninsula, viewed from straight above (top-down orthographic, flat — NOT isometric, NOT 3D). Vintage explorer's field-journal aesthetic reminiscent of a boutique travel brand.

Framing:
- TOP edge: the northern Caribbean coast around Cancún and Isla Mujeres
- BOTTOM edge: southern Quintana Roo past Kohunlich and Chetumal
- LEFT edge: inland Yucatán just past Chichén Itzá
- RIGHT edge: open Caribbean Sea with a faint hint of Banco Chinchorro reef offshore from Mahahual
- Coastline should curve: bulging east near Cancún/Tulum, cutting back west near the Sian Ka'an reserve, pushing east again at Mahahual — matching real geography

Terrain & style:
- Warm bone/cream aged-paper background (#f6f1e6) with subtle fiber texture and corner vignette
- Jungle interior: muted olive-green and sage watercolor washes (#7a8f5a, #9cae7d) with stippled ink dots for canopy; slightly warmer ochre stippling around ancient ruin clusters
- Caribbean Sea: graded wash from pale cyan (#bfe6df) near shore to deeper sapphire (#2f7d91) offshore, with a few delicate hand-drawn wave lines and a subtle reef dotted line parallel to shore
- Laguna de Bacalar: distinct elongated ribbon in seven bands of turquoise (#c6ecd8 → #0a4f5a), slightly exaggerated, clearly legible
- Mangrove/wetland stippling along Sian Ka'an and the Bacalar–Mahahual corridor
- Small ornamental compass rose in the upper-right corner
- Tiny hand-drawn scale bar in the lower-left, cream and navy
- Faint topographic contour lines inland, barely visible
- Very subtle hand-drawn route dashes connecting Bacalar outward toward Mahahual and Tulum

LOCATION MARKERS (IMPORTANT — bake exactly this set of tiny markers into the illustration, each with a matching ink label in an elegant italic serif nearby, sized small so an interactive overlay pin can cover it. Use a small filled ink-navy dot (~0.3% of frame width) for coastal towns, and a tiny 3-step pyramid icon in warm ochre-ink for Mayan ruin sites. Place by real geography within the framing above):

COASTAL TOWNS (dot + italic label):
- Cancún — upper-right-of-centre, on the north-east coast
- Isla Mujeres — tiny offshore island just east of Cancún
- Tulum — mid-east coast, ~40% down the east coastline
- Bacalar — centre-lower, adjacent to the seven-colour lagoon ribbon (label "Bacalar" beside the dot, plus small italic "Laguna de Bacalar" parallel to the lagoon shape)
- Mahahual — lower-right coast, on the Caribbean edge south of Sian Ka'an
- Chetumal — bottom-right corner, at the bay

MAYAN RUIN SITES (tiny pyramid icon + italic label):
- Chichén Itzá — far upper-left, inland (MUST include — this is the flagship ruin)
- Cobá — between Chichén Itzá and Tulum, mid-upper inland
- Muyil — inside Sian Ka'an reserve, south of Tulum, along a visible narrow turquoise canal cutting through mangrove stippling (MUST include — it is a ruin site AND the canal is part of the marker)
- Chacchoben — between Bacalar and Mahahual, slightly north of Bacalar (MUST include — previous version omitted this)
- Ichkabal — south-south-west of Bacalar, emerging from dense jungle stipple (MUST include — newly opened 2024 site)
- Dzibanché — lower-left inland, between Bacalar and Kohunlich (MUST include)
- Kohunlich — lower-left, deep southern jungle

Palette (stick to this — matches site CSS tokens):
- Bone/cream paper: #f6f1e6 / #efe8d6
- Ink navy: #0c2a2e (line art, compass, scale bar, town dots, all labels)
- Lagoon turquoise: #c6ecd8, #9fd9cc, #5bc0c2, #2fa7a7, #1b7d8a, #0e5f75, #0a4f5a
- Olive/sage jungle: #7a8f5a, #9cae7d, #5f7443
- Ochre (ruin pyramid icons): #b8762e
- Clay accent (sparse ornament only): #c4651e

STRICT RULES:
- EXACTLY ONE marker per named location above — a single dot or a single pyramid icon, nothing else. No decorative extra dots, no unnamed pins, no extra cities.
- All markers must be small and subtle so a ~14px interactive dot overlay can cover them.
- DO NOT add country borders, latitude/longitude grid, modern road icons, airports, hotels, or legend boxes.
- DO NOT render as 3D or isometric — strictly flat top-down watercolor-and-ink illustration.

Editorial hand-painted watercolor and ink illustration, ultra-sharp, boutique travel-brand aesthetic. 4:3 ratio, 2K.`,
  },

  // ── MAP (wide): 16:9 hero version, same baked markers, same framing left→right. ──
  "territory-map-wide": {
    aspectRatio: "16:9",
    size: "2K",
    prompt: `Editorial hand-drawn illustrated map of the Mexican Caribbean / Yucatán peninsula, reframed horizontally for a wide section banner. Flat top-down orthographic. Same style as the 4:3 version.

Framing: Chichén Itzá far left inland, Cancún upper-right-of-centre, Tulum mid-east, Bacalar centre-slightly-left next to its seven-colour lagoon ribbon, Mahahual right on the Caribbean, Kohunlich lower-left, Chetumal lower-right. The Caribbean Sea takes the right third in the teal-to-sapphire gradient with a faint offshore reef dashed line parallel to the shore.

Style: warm bone/cream aged-paper (#f6f1e6) with subtle fiber texture; olive-and-sage jungle watercolor with ink stippling; seven-band turquoise Bacalar lagoon; mangrove stippling along Sian Ka'an and Bacalar–Mahahual corridor; compass rose upper-right; scale bar lower-left.

BAKED LOCATION MARKERS (include exactly these, each as a tiny filled ink-navy dot for coastal towns or a small 3-step ochre-ink pyramid for ruin sites, with matching italic serif label beside):
- Towns: Cancún, Isla Mujeres, Tulum, Bacalar, Mahahual, Chetumal
- Ruins: Chichén Itzá, Cobá, Muyil (inside Sian Ka'an with visible canal), Chacchoben, Ichkabal, Dzibanché, Kohunlich

Palette: bone #f6f1e6, ink #0c2a2e, lagoon #c6ecd8→#0a4f5a, olive jungle #7a8f5a→#5f7443, ochre #b8762e (ruin icons), clay #c4651e (ornament only). Markers small so interactive overlays can cover them. No extra unnamed dots, no borders, no legends, no 3D. 16:9 ratio, 2K.`,
  },

  // ── NEW TOURS ──
  "ichkabal": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Cinematic editorial photograph of the Ichkabal Mayan archaeological site in southern Quintana Roo — a massive newly-excavated (opened 2024) stepped limestone pyramid emerging dramatically from dense unbroken Yucatec tropical rainforest. The pyramid is partially reclaimed by jungle: vines and roots draping from the upper terraces, green moss softening the stones, creeping ferns along the platforms, pockets of raw bleached-limestone exposed where recent excavation cleared the growth. A steep ceremonial staircase rises straight up the structure, flanked by swallowed vegetation. Misty pre-dawn atmosphere with low fog clinging to the tree canopy, warm peach-and-gold first sunlight breaking through in long shafts, lighting the pyramid face and catching the mist. Mood: the feeling of rediscovery, an ancient city only just revealed. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "muyil-float": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Cinematic aerial editorial photograph of the Muyil / Sian Ka'an biosphere reserve ancient Maya trade canal — a narrow ribbon of translucent turquoise freshwater cutting perfectly straight through emerald-green mangrove islands. Shot from a drone at about 30° angle at mid-morning. Three small groups of travellers in bright-orange life vests are floating peacefully down the canal carried by gentle current, a rope-line of swimmers bobbing through the glassy water, little V-shaped ripples trailing behind each. The water is so clear the pale limestone and seagrass bottom is visible. Dense mangrove canopy on both sides with stippled texture, a few white herons in the shallows. Soft golden sunlight, misty-warm atmosphere, untouched wilderness feel. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },

  "dzibanche": {
    aspectRatio: "4:3",
    size: "2K",
    prompt: `Editorial archaeological photograph of the Dzibanché Maya site (Quintana Roo, southern Yucatán peninsula) — the Temple of the Owl / Temple VI acropolis rising through a clearing in tall jungle, a stately three-stage pyramid with a wide stone plaza in the foreground and a steep ceremonial staircase climbing up its facade. Grey-cream weathered limestone with ochre-tinted stone courses, selective patches of moss and vine on the upper temple. Shot from low ground-level angle at late-afternoon golden hour, warm raking side light carving the staircase and casting long shadows across the plaza. Dense Yucatec jungle presses in on both sides of the frame, distant sister pyramid of Kinichná silhouetted through the canopy far-right. No tourists, no crowds, quiet archaeological atmosphere, documentary National Geographic feel. ${EDITORIAL_BASE} 4:3 ratio, 2K.`,
  },
};

async function loadRef(key) {
  // Prefer webp (our saved master), then jpg, then png.
  for (const ext of ["webp", "jpg", "png"]) {
    const p = path.resolve(OUT_DIR, `${key}.${ext}`);
    try {
      const buf = await fs.readFile(p);
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      return { inlineData: { data: buf.toString("base64"), mimeType: mime } };
    } catch {}
  }
  throw new Error(`Reference image not found for ${key} (tried .webp .jpg .png in ${OUT_DIR}/)`);
}

async function generateMaster(preset, key) {
  const client = new GoogleGenAI({ apiKey });
  const { prompt, aspectRatio, size, refs = [] } = preset;

  const parts = [];
  for (const refKey of refs) {
    parts.push({ text: `[REF:${refKey}] — reference image, match visual consistency exactly.` });
    parts.push(await loadRef(refKey));
  }
  parts.push({ text: prompt });

  console.log(`→ [${key}] generating ${aspectRatio} ${size} master${refs.length ? ` (refs: ${refs.join(", ")})` : ""}…`);
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: size, aspectRatio },
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) throw new Error("No response content");
  let jpegBuf = null;
  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) { jpegBuf = Buffer.from(part.inlineData.data, "base64"); break; }
  }
  if (!jpegBuf) throw new Error("No image data in response");

  // Gemini returns JPEG → convert master to WebP locally.
  const masterPath = path.resolve(OUT_DIR, `${key}.webp`);
  await fs.mkdir(path.dirname(masterPath), { recursive: true });
  await sharp(jpegBuf).webp({ quality: 88 }).toFile(masterPath);

  const { size: bytes } = await fs.stat(masterPath);
  const usage = response.usageMetadata || {};
  console.log(`  ✓ master saved ${masterPath} (${(bytes / 1024).toFixed(0)} KB, input:${usage.promptTokenCount || 0} output:${usage.candidatesTokenCount || 0})`);
  return masterPath;
}

async function deriveSizes(masterPath, key) {
  // Three breakpoints to support responsive srcset:
  //   -1600 → desktop 2x-retina (up to 800px display)
  //   -800  → tablet / desktop 1x (up to 600px display, mobile 2x-retina up to 400)
  //   -400  → phone 1x (up to 400px), thumbnails, card-in-cart
  // WebP already handles quality well; we keep q between 78–82.
  const variants = [
    { suffix: "-1600", width: 1600, quality: 82 },
    { suffix: "-800",  width: 800,  quality: 80 },
    { suffix: "-400",  width: 400,  quality: 78 }
  ];
  for (const v of variants) {
    const outPath = path.resolve(OUT_DIR, `${key}${v.suffix}.webp`);
    await sharp(masterPath)
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality })
      .toFile(outPath);
    const { size } = await fs.stat(outPath);
    console.log(`  ✓ derivative ${path.basename(outPath)} (${(size / 1024).toFixed(0)} KB)`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--list" || args[0] === "-h" || args[0] === "--help") {
    console.log("Usage: node scripts/generate-image.mjs <preset> | --all | --resize <preset>");
    console.log(`Presets (${Object.keys(PRESETS).length}):`);
    for (const k of Object.keys(PRESETS)) console.log(`  - ${k}`);
    process.exit(args[0] ? 0 : 1);
  }

  if (args[0] === "--all") {
    for (const key of Object.keys(PRESETS)) {
      const preset = PRESETS[key];
      const master = path.resolve(OUT_DIR, `${key}.webp`);
      try {
        await fs.access(master);
        console.log(`• ${key}: master exists, re-deriving sizes only`);
        if (preset.derive !== false) await deriveSizes(master, key);
        continue;
      } catch {}
      const p = await generateMaster(preset, key);
      if (preset.derive !== false) await deriveSizes(p, key);
    }
    console.log("✓ all presets done");
    return;
  }

  if (args[0] === "--resize") {
    const key = args[1];
    if (!key || !PRESETS[key]) { console.error(`Unknown preset: ${key}`); process.exit(1); }
    const master = path.resolve(OUT_DIR, `${key}.webp`);
    await deriveSizes(master, key);
    return;
  }

  const key = args[0];
  const preset = PRESETS[key];
  if (!preset) {
    console.error(`Unknown preset: ${key}`);
    console.error(`Presets: ${Object.keys(PRESETS).join(", ")}`);
    process.exit(1);
  }
  const masterPath = await generateMaster(preset, key);
  if (preset.derive !== false) await deriveSizes(masterPath, key);
}

main().catch((err) => {
  console.error("Generation failed:", err?.message || err);
  process.exit(1);
});
