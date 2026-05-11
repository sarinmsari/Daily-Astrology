import SwissEph from "swisseph-wasm";
import { getNakshatraInfo, RASHIS } from "./astro-constants";

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

    // Calculate Julian Day (Expected 4 arguments: year, month, day, hour)
    const julianDay = swe.julday(utcYear, utcMonth, utcDay, utcHour);

    // Calculate Moon position in sidereal longitude
    // SEFLG_SIDEREAL (65536) | SEFLG_SPEED (256)
    const SEFLG_SIDEREAL = swe.SEFLG_SIDEREAL;
    const SEFLG_SWIEPH = swe.SEFLG_SWIEPH;
    
    // pos returns: [longitude, latitude, distance, speed]
    const result = swe.calc_ut(julianDay, swe.SE_MOON, SEFLG_SWIEPH | SEFLG_SIDEREAL);
    
    if (!result || result.length < 1) {
      throw new Error("Failed to calculate moon position");
    }

    const moonLongitude = result[0];
    const nakshatra = getNakshatraInfo(moonLongitude);

    return {
      moonLongitude,
      ...nakshatra
    };
  } catch (error: unknown) {
    console.error("SwissEph Calculation Error:", error);
    throw error;
  } finally {
    swe.close();
  }
};

export const calculateFullChart = async (
  date: Date,
  lat: number,
  lng: number
) => {
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
      { name: "Sun", id: swe.SE_SUN },
      { name: "Moon", id: swe.SE_MOON },
      { name: "Mars", id: swe.SE_MARS },
      { name: "Mercury", id: swe.SE_MERCURY },
      { name: "Jupiter", id: swe.SE_JUPITER },
      { name: "Venus", id: swe.SE_VENUS },
      { name: "Saturn", id: swe.SE_SATURN },
      { name: "Rahu", id: swe.SE_MEAN_NODE },
    ];

    const positions = planets.map((p) => {
      const res = swe.calc_ut(julianDay, p.id, flags);
      const longitude = res[0];
      const rashiIndex = Math.floor(longitude / 30);
      return {
        name: p.name,
        longitude,
        rashi: RASHIS[rashiIndex],
        rashiIndex,
      };
    });

    const rahu = positions.find((r) => r.name === "Rahu")?.longitude || 0;
    const ketuLongitude = (rahu + 180) % 360;
    positions.push({
      name: "Ketu",
      longitude: ketuLongitude,
      rashi: RASHIS[Math.floor(ketuLongitude / 30)],
      rashiIndex: Math.floor(ketuLongitude / 30),
    });

    // Houses/Lagna
    const housesResult = swe.houses_ex(julianDay, flags, lat, lng, "P");
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
