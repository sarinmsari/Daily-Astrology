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
  } catch (error: any) {
    console.error("SwissEph Calculation Error:", error);
    throw error;
  } finally {
    swe.close();
  }
};
