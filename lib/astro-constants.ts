// ─── Nakshatras ──────────────────────────────────────────────────────────────
export const NAKSHATRAS = [
  "Ashwini (Aswathy)",
  "Bharani (Bharani)",
  "Krittika (Karthika)",
  "Rohini (Rohini)",
  "Mrigashira (Makayiram)",
  "Ardra (Thiruvathira)",
  "Punarvasu (Punartham)",
  "Pushya (Pooyam)",
  "Ashlesha (Ayilyam)",
  "Magha (Makam)",
  "Purva Phalguni (Pooram)",
  "Uttara Phalguni (Uthram)",
  "Hasta (Atham)",
  "Chitra (Chithira)",
  "Swati (Chothi)",
  "Vishakha (Vishakham)",
  "Anuradha (Anizham)",
  "Jyeshtha (Thrikketta)",
  "Mula (Moolam)",
  "Purva Ashadha (Pooradam)",
  "Uttara Ashadha (Uthradam)",
  "Shravana (Thiruvonam)",
  "Dhanishta (Avittam)",
  "Shatabhisha (Chathayam)",
  "Purva Bhadrapada (Pooruruttathy)",
  "Uttara Bhadrapada (Uthruttathy)",
  "Revati (Revathi)",
];

// ─── Rashis ───────────────────────────────────────────────────────────────────
export const RASHIS = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrischika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
];

// ─── Rashi Lordships (traditional Vedic, 0=Mesha…11=Meena) ───────────────────
// These are permanent astrological constants — not date-dependent.
export const RASHI_LORDS: Record<number, string> = {
  0: "Mars", // Mesha
  1: "Venus", // Vrishabha
  2: "Mercury", // Mithuna
  3: "Moon", // Karka
  4: "Sun", // Simha
  5: "Mercury", // Kanya
  6: "Venus", // Tula
  7: "Mars", // Vrischika
  8: "Jupiter", // Dhanu
  9: "Saturn", // Makara
  10: "Saturn", // Kumbha
  11: "Jupiter", // Meena
};

// ─── Nakshatra Lords (Vimshottari Dasha sequence, 0-indexed) ─────────────────
// Repeating sequence: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
export const NAKSHATRA_LORDS: string[] = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];

// ─── Planet Dignity Definitions ───────────────────────────────────────────────
// All dignity data is a fixed astrological constant, never date-dependent.
type PlanetDignityDef = {
  exaltation: number;
  debilitation: number;
  moolatrikona: number[];
  ownSign: number[];
};

export const PLANET_DIGNITY_TABLE: Record<string, PlanetDignityDef> = {
  Sun: { exaltation: 0, debilitation: 6, moolatrikona: [4], ownSign: [4] },
  Moon: { exaltation: 1, debilitation: 7, moolatrikona: [3], ownSign: [3] },
  Mars: { exaltation: 9, debilitation: 3, moolatrikona: [0], ownSign: [0, 7] },
  Mercury: {
    exaltation: 5,
    debilitation: 11,
    moolatrikona: [5],
    ownSign: [2, 5],
  },
  Jupiter: {
    exaltation: 3,
    debilitation: 9,
    moolatrikona: [8],
    ownSign: [8, 11],
  },
  Venus: {
    exaltation: 11,
    debilitation: 5,
    moolatrikona: [6],
    ownSign: [1, 6],
  },
  Saturn: {
    exaltation: 6,
    debilitation: 0,
    moolatrikona: [10],
    ownSign: [9, 10],
  },
};

/**
 * Computes the dignity of a planet in a given rashi (by index).
 * Pass `longitude` (0–360 sidereal) to get degree-accurate Moolatrikona
 * vs Own Sign for the Sun (0°–20° Leo = Moolatrikona; 20°–30° = Own Sign)
 * and Moon (0°–3° Cancer = Moolatrikona; 3°–30° = Own Sign).
 * All inputs are computed from the live ephemeris — nothing is hardcoded.
 */
export function computeDignity(
  planetName: string,
  rashiIndex: number,
  longitude?: number,
): string {
  const def = PLANET_DIGNITY_TABLE[planetName];
  if (!def) return ""; // Rahu, Ketu, Ascendant have no standard dignity
  if (rashiIndex === def.exaltation) return "Exalted (Uccha)";
  if (rashiIndex === def.debilitation) return "Debilitated (Neecha)";
  if (def.moolatrikona.includes(rashiIndex)) {
    // Degree-aware split for Sun and Moon when longitude is available
    if (longitude !== undefined) {
      const degInSign = longitude % 30;
      if (planetName === "Sun" && degInSign >= 20) return "Own Sign (Swa)";  // Leo 20°–30°
      if (planetName === "Moon" && degInSign >= 3)  return "Own Sign (Swa)";  // Cancer 3°–30°
    }
    return "Moolatrikona";
  }
  if (def.ownSign.includes(rashiIndex)) return "Own Sign (Swa)";
  return "Neutral";
}

// ─── Shani Transits (Sade Sati, Dhaiya, etc.) ─────────────────────────────────────

export type ShaniTransitPhase =
  | "Pre-Sade Sati"
  | "Peak Sade Sati"
  | "Post-Sade Sati (Concluding)"
  | "Kantaka Shani (4th)"
  | "Kantaka Shani (7th)"
  | "Kantaka Shani (10th)"
  | "Ashtama Shani (8th)"
  | "None";

export type ShaniTransitResult = {
  phase: ShaniTransitPhase;
  houseFromMoon: number; // Saturn's house number counted from natal Moon (1–12)
  description: string;
};

/**
 * Dynamically computes the Shani transit phase for ANY date.
 * Both indices come from live Swiss Ephemeris calculations — nothing is hardcoded.
 *
 * @param natalMoonRashiIndex - from natal chart (0–11)
 * @param transitSaturnRashiIndex - from transit chart computed for the reading date (0–11)
 */
export function computeShaniTransitPhase(
  natalMoonRashiIndex: number,
  transitSaturnRashiIndex: number,
): ShaniTransitResult {
  const houseFromMoon =
    ((transitSaturnRashiIndex - natalMoonRashiIndex + 12) % 12) + 1;

  switch (houseFromMoon) {
    case 12:
      return {
        phase: "Pre-Sade Sati",
        houseFromMoon,
        description:
          "Saturn transits the 12th house from your natal Moon — the opening phase of Sade Sati. Themes of introspection, hidden expenses, foreign travel, and spiritual awakening emerge. Rest and preparation are key.",
      };
    case 1:
      return {
        phase: "Peak Sade Sati",
        houseFromMoon,
        description:
          "Saturn transits your natal Moon sign — the most intense, transformative phase of Sade Sati. Your sense of identity, mental resilience, and core life foundations are being tested and refined. Slowdowns are Saturn's teaching.",
      };
    case 2:
      return {
        phase: "Post-Sade Sati (Concluding)",
        houseFromMoon,
        description:
          "Saturn transits the 2nd house from your natal Moon — the concluding phase of Sade Sati. Hard-earned wisdom is stabilizing. Speech, finances, and family dynamics come into gradual order.",
      };
    case 4:
      return {
        phase: "Kantaka Shani (4th)",
        houseFromMoon,
        description:
          "Ardh-Ashtama Shani is active — Saturn transits your 4th from natal Moon, pressuring home environment, emotional security, property matters, and the maternal relationship.",
      };
    case 7:
      return {
        phase: "Kantaka Shani (7th)",
        houseFromMoon,
        description:
          "Kantaka Shani is active — Saturn transits your 7th from natal Moon, bringing challenges and necessary restructuring to partnerships, marriage, and public image.",
      };
    case 10:
      return {
        phase: "Kantaka Shani (10th)",
        houseFromMoon,
        description:
          "Kantaka Shani is active — Saturn transits your 10th from natal Moon, demanding intense focus, discipline, and patience in career and social standing.",
      };
    case 8:
      return {
        phase: "Ashtama Shani (8th)",
        houseFromMoon,
        description:
          "Ashtama Shani is active — Saturn transits your 8th from natal Moon, triggering sudden changes, hidden debts, health concerns, and deep psychological transformation.",
      };
    default:
      return {
        phase: "None",
        houseFromMoon,
        description: `Saturn transits the ${houseFromMoon}th house from your natal Moon — an auspicious or neutral transit with no major Shani Dosha in effect for this period.`,
      };
  }
}

// ─── Nakshatra Info ───────────────────────────────────────────────────────────
// Each nakshatra spans exactly 360°/27 = 13°20'. Using integer division (360/27)
// avoids floating-point accumulation that can drift at exact pada boundaries.
const NAKSHATRA_SPAN = 360 / 27;   // 13.333...°
const PADA_SPAN      = NAKSHATRA_SPAN / 4; // 3.333...°

export const getNakshatraInfo = (moonLongitude: number) => {
  const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
  const remainder      = moonLongitude % NAKSHATRA_SPAN;
  const pada           = Math.min(Math.floor(remainder / PADA_SPAN) + 1, 4);

  return {
    name:  NAKSHATRAS[nakshatraIndex],
    index: nakshatraIndex,
    pada,
  };
};
