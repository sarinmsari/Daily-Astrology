import SwissEph from "swisseph-wasm";
import {
  getNakshatraInfo,
  RASHIS,
  RASHI_LORDS,
  NAKSHATRA_LORDS,
  computeDignity,
  computeShaniTransitPhase,
} from "./astro-constants";



// ─── Mutex for Thread Safety ──────────────────────────────────────────────────
// swisseph-wasm utilizes internal C-level globals and WASM memory. 
// Concurrent execution in a serverless function causes memory corruption
// and incorrect calculations. We strictly serialize access per instance.
class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let begin: (unlock: () => void) => void = () => {};
    this.mutex = this.mutex.then(() => new Promise(begin));
    return new Promise((res) => {
      begin = res;
    });
  }
}

const astroMutex = new Mutex();

// ─── Types ────────────────────────────────────────────────────────────────────

export type MoonDayTransit = {
  /** Moon position at 00:00 IST (start of day) */
  startOfDay: {
    longitude: number;
    rashi: string;
    rashiIndex: number;
    nakshatra: string;
    nakshatraIndex: number;
    pada: number;
  };
  /** Moon position at 23:59 IST (end of day) */
  endOfDay: {
    longitude: number;
    rashi: string;
    rashiIndex: number;
    nakshatra: string;
    nakshatraIndex: number;
    pada: number;
  };
  /** True when Moon crosses into a new Nakshatra during this calendar day */
  nakshatraChanges: boolean;
  /** True when Moon crosses into a new Rashi during this calendar day */
  rashiChanges: boolean;
  /** Approximate UTC time of the Nakshatra/Rashi boundary crossing (if any) */
  transitionTimeISO: string | null;
};

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
  const unlock = await astroMutex.lock();
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
    unlock();
  }
};

// ─── Moon Day Transit ─────────────────────────────────────────────────────────
/**
 * For a given IST calendar date, computes Moon's position at the very start
 * (00:00 IST) and very end (23:59 IST) of that day.
 *
 * If the Moon crosses a Nakshatra or Rashi boundary during the day, the
 * function binary-searches for the approximate crossing time so the reading
 * can describe the full-day lunar energy accurately.
 *
 * @param dateISO - "YYYY-MM-DD" in IST (e.g. "2026-05-26")
 */
export const calculateMoonDayTransit = async (
  dateISO: string
): Promise<MoonDayTransit> => {
  const unlock = await astroMutex.lock();
  const swe = new SwissEph();
  try {
    await swe.initSwissEph();
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

    const getMoonAt = (isoWithOffset: string) => {
      const d = new Date(isoWithOffset);
      const jd = swe.julday(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
      );
      const res = swe.calc_ut(jd, swe.SE_MOON, flags);
      const longitude = res[0];
      const rashiIndex = Math.floor(longitude / 30);
      const nakshatraSpan = 360 / 27;
      const nakshatraIndex = Math.floor(longitude / nakshatraSpan);
      const remainder = longitude % nakshatraSpan;
      const pada = Math.min(Math.floor(remainder / (nakshatraSpan / 4)) + 1, 4);
      return { longitude, rashiIndex, nakshatraIndex, pada };
    };

    const start = getMoonAt(`${dateISO}T00:00:00+05:30`);
    const end   = getMoonAt(`${dateISO}T23:59:00+05:30`);

    const nakshatraChanges = start.nakshatraIndex !== end.nakshatraIndex;
    const rashiChanges     = start.rashiIndex !== end.rashiIndex;

    // ── Binary search for transition time (only if a boundary crossing exists) ──
    let transitionTimeISO: string | null = null;
    if (nakshatraChanges || rashiChanges) {
      let loMs = new Date(`${dateISO}T00:00:00+05:30`).getTime();
      let hiMs = new Date(`${dateISO}T23:59:00+05:30`).getTime();
      const startBucket = nakshatraChanges ? start.nakshatraIndex : start.rashiIndex;
      for (let i = 0; i < 18; i++) {
        const midMs = Math.floor((loMs + hiMs) / 2);
        const mid = new Date(midMs);
        const midISO = mid.toISOString();
        const midMoon = getMoonAt(midISO);
        const midBucket = nakshatraChanges ? midMoon.nakshatraIndex : midMoon.rashiIndex;
        if (midBucket === startBucket) {
          loMs = midMs;
        } else {
          hiMs = midMs;
        }
      }
      transitionTimeISO = new Date(Math.floor((loMs + hiMs) / 2)).toISOString();
    }

    // getNakshatraInfo and RASHIS are statically imported at the top of this file
    const startNak = getNakshatraInfo(start.longitude);
    const endNak   = getNakshatraInfo(end.longitude);

    return {
      startOfDay: {
        longitude:      start.longitude,
        rashi:          RASHIS[start.rashiIndex],
        rashiIndex:     start.rashiIndex,
        nakshatra:      startNak.name,
        nakshatraIndex: startNak.index,
        pada:           startNak.pada,
      },
      endOfDay: {
        longitude:      end.longitude,
        rashi:          RASHIS[end.rashiIndex],
        rashiIndex:     end.rashiIndex,
        nakshatra:      endNak.name,
        nakshatraIndex: endNak.index,
        pada:           endNak.pada,
      },
      nakshatraChanges,
      rashiChanges,
      transitionTimeISO,
    };
  } finally {
    swe.close();
    unlock();
  }
};

// ─── Full Chart ───────────────────────────────────────────────────────────────

export const calculateFullChart = async (
  date: Date,
  lat: number,
  lng: number,
  withDignity = false
): Promise<FullChart> => {
  const unlock = await astroMutex.lock();
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
        ...(withDignity ? { dignity: computeDignity(p.name, rashiIndex, longitude) } : {}),
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
    unlock();
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
    const dignity = computeDignity(p.name, p.rashiIndex, p.longitude);
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

  // ── Shani Transit Phase (fully dynamic — ephemeris-driven, any date) ────────────
  const shaniTransit =
    natalMoon && transitSaturn
      ? computeShaniTransitPhase(natalMoon.rashiIndex, transitSaturn.rashiIndex)
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

    // Shani Transit (dynamically computed from both ephemeris results)
    shaniTransitPhase: shaniTransit.phase,
    shaniTransitDescription: shaniTransit.description,
    shaniTransitHouseFromMoon: shaniTransit.houseFromMoon,

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
