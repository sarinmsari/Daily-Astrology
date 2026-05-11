"use server";

import { adminDb } from "@/lib/firebase-admin";
import { calculateBirthStar, calculateFullChart } from "@/lib/astro";
import { revalidatePath } from "next/cache";

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
}) {
  try {
    if (!formData.uid) throw new Error("User ID is required");

    let finalNakshatra = formData.nakshatra;
    let finalPada = formData.pada;
    let nakshatraIndex = 0;

    const birthDateTime = new Date(`${formData.birthDate}T${formData.birthTime}:00+05:30`);

    if (!finalNakshatra) {
      const astroInfo = await calculateBirthStar(birthDateTime, formData.lat, formData.lng);
      finalNakshatra = astroInfo.name;
      finalPada = astroInfo.pada;
      nakshatraIndex = astroInfo.index;
    }

    // ── Compute natal chart ONCE and persist it ─────────────────────────────
    // This is deterministic for a given birth date/time/location — never needs recomputing.
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
      dignity: p.dignity ?? "",   // Rahu/Ketu have no dignity — default to empty string
    }));
    const userData = {
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
      // Stored as plain JSON — no re-computation needed on future readings.
      // houses omitted: unused in readings and may be undefined on some platforms.
      natal_chart: {
        positions: sanitizedPositions,
        ascendant: {
          longitude: natalChart.ascendant.longitude,
          rashi: natalChart.ascendant.rashi,
          rashiIndex: natalChart.ascendant.rashiIndex,
        },
      },
      updated_at: new Date().toISOString(),
    };

    const collectionName = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    await adminDb.collection(collectionName).doc(formData.uid).set(userData, { merge: true });
    // Master record in "users" for chart lookups
    await adminDb.collection("users").doc(formData.uid).set(userData, { merge: true });

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
