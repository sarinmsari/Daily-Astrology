import SwissEph from "swisseph-wasm";
import {
  getNakshatraInfo,
  RASHIS,
  RASHI_LORDS,
  NAKSHATRA_LORDS,
  computeDignity,
  computeSadeSatiPhase,
} from "./astro-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanetPosition = {
  name: string;
  longitude: number;
  rashi: string;
  rashiIndex: number;
  dignity?: string; // populated in natal chart
};

export type FullChart = {
  positions: PlanetPosition[];
  ascendant: {
    longitude: number;
    rashi: string;
    rashiIndex: number;
  };
  houses: number[];
};

// ─── Birth Star ───────────────────────────────────────────────────────────────

export const calculateBirthStar = async (
  date: Date,
  _lat: number,
  _lng: number
) => {
  const swe = new SwissEph();
  try {
    await swe.initSwissEph();

    // Set Lahiri Ayanamsa (SE_SIDM_LAHIRI is 1)
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

    // Convert to UTC
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();
    const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    const julianDay = swe.julday(utcYear, utcMonth, utcDay, utcHour);

    const SEFLG_SIDEREAL = swe.SEFLG_SIDEREAL;
    const SEFLG_SWIEPH = swe.SEFLG_SWIEPH;

    const result = swe.calc_ut(julianDay, swe.SE_MOON, SEFLG_SWIEPH | SEFLG_SIDEREAL);

    if (!result || result.length < 1) {
      throw new Error("Failed to calculate moon position");
    }

    const moonLongitude = result[0];
    const nakshatra = getNakshatraInfo(moonLongitude);

    return {
      moonLongitude,
      ...nakshatra,
    };
  } catch (error: unknown) {
    console.error("SwissEph Calculation Error:", error);
    throw error;
  } finally {
    swe.close();
  }
};

// ─── Full Chart ───────────────────────────────────────────────────────────────

export const calculateFullChart = async (
  date: Date,
  lat: number,
  lng: number,
  withDignity = false
): Promise<FullChart> => {
  const swe = new SwissEph();
  try {
    await swe.initSwissEph();
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();
    const utcHour =
      date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600;

    const julianDay = swe.julday(utcYear, utcMonth, utcDay, utcHour);
    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

    const planets = [
      { name: "Sun",     id: swe.SE_SUN },
      { name: "Moon",    id: swe.SE_MOON },
      { name: "Mars",    id: swe.SE_MARS },
      { name: "Mercury", id: swe.SE_MERCURY },
      { name: "Jupiter", id: swe.SE_JUPITER },
      { name: "Venus",   id: swe.SE_VENUS },
      { name: "Saturn",  id: swe.SE_SATURN },
      { name: "Rahu",    id: swe.SE_MEAN_NODE },
    ];

    const positions: PlanetPosition[] = planets.map((p) => {
      const res = swe.calc_ut(julianDay, p.id, flags);
      const longitude = res[0];
      const rashiIndex = Math.floor(longitude / 30);
      return {
        name: p.name,
        longitude,
        rashi: RASHIS[rashiIndex],
        rashiIndex,
        ...(withDignity ? { dignity: computeDignity(p.name, rashiIndex) } : {}),
      };
    });

    // Ketu is always exactly opposite Rahu
    const rahu = positions.find((r) => r.name === "Rahu")?.longitude || 0;
    const ketuLongitude = (rahu + 180) % 360;
    const ketuRashiIndex = Math.floor(ketuLongitude / 30);
    positions.push({
      name: "Ketu",
      longitude: ketuLongitude,
      rashi: RASHIS[ketuRashiIndex],
      rashiIndex: ketuRashiIndex,
    });

    // Houses / Lagna
    const housesResult = (swe as any).houses_ex(julianDay, flags, lat, lng, "P");
    const ascendant = housesResult.ascmc[0];
    const ascendantRashiIndex = Math.floor(ascendant / 30);

    return {
      positions,
      ascendant: {
        longitude: ascendant,
        rashi: RASHIS[ascendantRashiIndex],
        rashiIndex: ascendantRashiIndex,
      },
      houses: housesResult.cusps,
    };
  } catch (error: unknown) {
    console.error("Full Chart Calculation Error:", error);
    throw error;
  } finally {
    swe.close();
  }
};

// ─── Derived Vedic Facts ──────────────────────────────────────────────────────
/**
 * Derives all secondary Vedic facts from pre-computed charts.
 * ALL inputs come from the live Swiss Ephemeris — zero hardcoded dates or positions.
 * Works correctly for any past, present, or future reading date.
 *
 * @param natalChart       - Result of calculateFullChart for birth date/time
 * @param transitChart     - Result of calculateFullChart for the READING date (any date)
 * @param nakshatraIndex   - 0-indexed nakshatra number from natal Moon calculation
 */
export function getDerivedFacts(
  natalChart: FullChart,
  transitChart: FullChart,
  nakshatraIndex: number
) {
  // ── Lagna Lord (from natal ascendant rashi) ─────────────────────────────────
  const lagnaLord = RASHI_LORDS[natalChart.ascendant.rashiIndex] ?? "Unknown";

  // ── Nakshatra Lord (Vimshottari Dasha lord for birth star) ─────────────────
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex] ?? "Unknown";

  // ── Natal planet dignities (computed from ephemeris-derived rashi indices) ──
  const planetDignitySummary = natalChart.positions.map((p) => {
    const dignity = computeDignity(p.name, p.rashiIndex);
    return dignity
      ? `${p.name}: ${p.rashi} — ${dignity}`
      : `${p.name}: ${p.rashi}`; // Rahu/Ketu get no dignity label
  });

  // ── Key planet lookups ──────────────────────────────────────────────────────
  const natalMoon    = natalChart.positions.find((p) => p.name === "Moon");
  const transitSaturn = transitChart.positions.find((p) => p.name === "Saturn");
  const transitMoon  = transitChart.positions.find((p) => p.name === "Moon");
  const transitJupiter = transitChart.positions.find((p) => p.name === "Jupiter");
  const transitRahu  = transitChart.positions.find((p) => p.name === "Rahu");

  // ── Sade Sati phase (fully dynamic — ephemeris-driven, any date) ────────────
  const sadeSati =
    natalMoon && transitSaturn
      ? computeSadeSatiPhase(natalMoon.rashiIndex, transitSaturn.rashiIndex)
      : { phase: "None" as const, houseFromMoon: 0, description: "" };

  // ── House positions of key transit planets (counted from natal Moon) ────────
  const houseFromMoon = (planet: PlanetPosition | undefined) =>
    natalMoon && planet
      ? ((planet.rashiIndex - natalMoon.rashiIndex + 12) % 12) + 1
      : null;

  // ── House positions of key transit planets (counted from Lagna) ─────────────
  const houseFromLagna = (planet: PlanetPosition | undefined) =>
    planet
      ? ((planet.rashiIndex - natalChart.ascendant.rashiIndex + 12) % 12) + 1
      : null;

  return {
    // Natal chart derived facts
    lagnaLord,
    nakshatraLord,
    planetDignitySummary,

    // Sade Sati (dynamically computed from both ephemeris results)
    sadeSatiPhase: sadeSati.phase,
    sadeSatiDescription: sadeSati.description,
    sadeSatiHouseFromMoon: sadeSati.houseFromMoon,

    // Transit positions (for easy string interpolation in prompt)
    natalMoonRashi:     natalMoon?.rashi      ?? "",
    transitMoonRashi:   transitMoon?.rashi    ?? "",
    transitSaturnRashi: transitSaturn?.rashi  ?? "",
    transitJupiterRashi: transitJupiter?.rashi ?? "",
    transitRahuRashi:   transitRahu?.rashi    ?? "",

    // House positions of key transits relative to natal Moon
    moonHouseFromNatal:    houseFromMoon(transitMoon),
    saturnHouseFromNatal:  houseFromMoon(transitSaturn),
    jupiterHouseFromNatal: houseFromMoon(transitJupiter),
    rahuHouseFromNatal:    houseFromMoon(transitRahu),

    // House positions of key transits relative to Lagna
    saturnHouseFromLagna:  houseFromLagna(transitSaturn),
    jupiterHouseFromLagna: houseFromLagna(transitJupiter),
    rahuHouseFromLagna:    houseFromLagna(transitRahu),
    moonHouseFromLagna:    houseFromLagna(transitMoon),
  };
}
