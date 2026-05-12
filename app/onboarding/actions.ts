"use server";

import { adminDb } from "@/lib/firebase-admin";
import { calculateBirthStar, calculateFullChart } from "@/lib/astro";
import { revalidatePath } from "next/cache";

// ─── Helper: today's date-keyed collection name (IST) ──────────────────────
function getTodayCollection() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function saveUserOnboarding(formData: {
  name: string;
  birthDate: string;
  birthTime: string;
  city: string;
  lat: number;
  lng: number;
  timezone: string;
  uid?: string;
  nakshatra?: string; // Manually selected
  pada?: number;      // Manually selected
  language?: string;
  isAuthenticated?: boolean; // Whether this is a signed-in Google user
}) {
  try {
    if (!formData.uid) throw new Error("User ID is required");

    let finalNakshatra = formData.nakshatra;
    let finalPada = formData.pada;
    let nakshatraIndex = 0;

    // ── If coordinates look invalid (0,0 = Gulf of Guinea), bail early ────────
    // This prevents the reading-page sync from corrupting an existing valid chart.
    const hasValidCoords = formData.lat !== 0 || formData.lng !== 0;

    const birthDateTime = new Date(`${formData.birthDate}T${formData.birthTime}:00+05:30`);

    if (!finalNakshatra) {
      if (!hasValidCoords) {
        throw new Error("Valid birth coordinates are required to calculate birth star.");
      }
      const astroInfo = await calculateBirthStar(birthDateTime, formData.lat, formData.lng);
      finalNakshatra = astroInfo.name;
      finalPada = astroInfo.pada;
      nakshatraIndex = astroInfo.index;
    }

    // ── Compute natal chart ONCE and persist it ─────────────────────────────
    // Only compute when we have valid coordinates — skip on sync calls with lat=0,lng=0.
    let natalChartData: object | undefined;
    if (hasValidCoords) {
      const natalChart = await calculateFullChart(
        birthDateTime,
        formData.lat,
        formData.lng,
        true // include dignity
      );

      // Sanitize before writing to Firestore:
      //  - Firestore rejects undefined values (houses can be undefined if houses_ex fails)
      //  - Only store positions + ascendant — houses are never used in readings
      const sanitizedPositions = natalChart.positions.map((p) => ({
        name: p.name,
        longitude: p.longitude,
        rashi: p.rashi,
        rashiIndex: p.rashiIndex,
        dignity: p.dignity ?? "", // Rahu/Ketu have no dignity — default to empty string
      }));
      natalChartData = {
        positions: sanitizedPositions,
        ascendant: {
          longitude: natalChart.ascendant.longitude,
          rashi: natalChart.ascendant.rashi,
          rashiIndex: natalChart.ascendant.rashiIndex,
        },
      };
    }

    const userData: Record<string, unknown> = {
      uid: formData.uid,
      full_name: formData.name,
      birth_date: formData.birthDate,
      birth_time: formData.birthTime,
      birth_location: formData.city,
      latitude: formData.lat,
      longitude: formData.lng,
      timezone: formData.timezone,
      birth_star_nakshatra: finalNakshatra,
      nakshatra_pada: finalPada,
      nakshatra_index: nakshatraIndex,
      language: formData.language ?? "English",
      updated_at: new Date().toISOString(),
    };

    if (natalChartData) {
      userData.natal_chart = natalChartData;
    }

    // ── Persistence strategy ────────────────────────────────────────────────
    // Authenticated (Google UID)  → "users" (permanent profile) + dated collection (daily log)
    // Guest / anonymous           → dated collection only (NOT written to "users")
    if (formData.isAuthenticated) {
      await adminDb.collection("users").doc(formData.uid).set(userData, { merge: true });
      await adminDb
        .collection(getTodayCollection())
        .doc(formData.uid)
        .set(userData, { merge: true });
    } else {
      await adminDb
        .collection(getTodayCollection())
        .doc(formData.uid)
        .set(userData, { merge: true });
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      nakshatra: finalNakshatra,
      pada: finalPada,
      nakshatraIndex,
      uid: formData.uid,
    };
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Reading log ─────────────────────────────────────────────────────────────
// Called from the reading page after every successful AI generation.
// Writes a lightweight metadata entry to the dated collection so we have a
// full daily log of all readings served (authenticated + guest).
export async function saveReadingLog(payload: {
  uid: string;
  name: string;
  nakshatra: string;
  pada: number | string;
  language: string;
  isAuthenticated: boolean;
}) {
  try {
    const logEntry: Record<string, unknown> = {
      uid: payload.uid,
      name: payload.name,
      nakshatra: payload.nakshatra,
      pada: payload.pada,
      language: payload.language,
      is_authenticated: payload.isAuthenticated,
      generated_at: new Date().toISOString(),
    };

    // Dated collection: document key is "<uid>_reading" so multiple calls on
    // the same day merge gracefully rather than creating duplicates.
    await adminDb
      .collection(getTodayCollection())
      .doc(`${payload.uid}_reading`)
      .set(logEntry, { merge: true });
  } catch (error: any) {
    // Non-fatal — logging failure should never break the reading experience.
    console.error("Reading log error:", error);
  }
}

// ─── Reset user data ──────────────────────────────────────────────────────────
// Deletes the user's permanent profile from the "users" collection.
// After this the user will be re-onboarded from scratch on next visit.
export async function resetUserData(uid: string) {
  try {
    if (!uid) throw new Error("uid is required");
    await adminDb.collection("users").doc(uid).delete();
    return { success: true };
  } catch (error: any) {
    console.error("Reset user data error:", error);
    return { success: false, error: error.message };
  }
}
