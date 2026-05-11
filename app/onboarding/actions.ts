"use server";

import { adminDb } from "@/lib/firebase-admin";
import { calculateBirthStar } from "@/lib/astro";
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

    if (!finalNakshatra) {
      const birthDate = new Date(`${formData.birthDate}T${formData.birthTime}:00+05:30`);
      // Calculate Nakshatra
      const astroInfo = await calculateBirthStar(birthDate, formData.lat, formData.lng);
      finalNakshatra = astroInfo.name;
      finalPada = astroInfo.pada;
    }

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
      updated_at: new Date().toISOString(),
    };

    const collectionName = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    await adminDb.collection(collectionName).doc(formData.uid).set(userData, { merge: true });
    // Also keep a master record in "users" for easy lookup
    await adminDb.collection("users").doc(formData.uid).set(userData, { merge: true });

    revalidatePath("/dashboard");
    return { success: true, nakshatra: finalNakshatra, pada: finalPada };
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return { success: false, error: error.message };
  }
}
