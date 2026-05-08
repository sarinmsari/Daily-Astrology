import SwissEph from "swisseph-wasm";
import { getNakshatraInfo } from "./astro-constants";

export const calculateBirthStar = async (
  date: Date,
  lat: number,
  lng: number
) => {
  const swe = new SwissEph();
  try {
    await swe.initSwissEph();
    
    // Set Lahiri Ayanamsa (SE_SIDM_LAHIRI is 1)
    swe.set_sid_mode(1, 0, 0);

    // Convert to UTC
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();
    const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    // Calculate Julian Day
    const julianDay = swe.julday(utcYear, utcMonth, utcDay, utcHour, 1);

    // Calculate Moon position in sidereal longitude
    // SEFLG_SIDEREAL (65536) | SEFLG_SPEED (256)
    const SEFLG_SIDEREAL = 65536;
    const result = swe.calc_ut(julianDay, swe.SE_MOON, SEFLG_SIDEREAL);
    
    if (!result || result.error) {
      throw new Error(result?.error || "Failed to calculate moon position");
    }

    // calc_ut returns an array: [longitude, latitude, distance, speedLongitude, speedLatitude, speedDistance]
    const moonLongitude = result[0];
    const nakshatra = getNakshatraInfo(moonLongitude);

    return {
      moonLongitude,
      ...nakshatra
    };
  } finally {
    swe.close();
  }
};
