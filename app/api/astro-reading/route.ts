import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";
import { calculateFullChart } from "@/lib/astro";

export const maxDuration = 30;

const MoodSchema = z.enum([
  "Mystical",
  "Dynamic",
  "Warning",
  "Balanced",
  "Success",
]);

const ReadingSchema = z.object({
  mind: z.object({
    mood: MoodSchema,
    content: z.string(),
  }),
  career: z.object({
    mood: MoodSchema,
    level: z.number().min(1).max(100),
    content: z.string(),
  }),
  wealth: z.object({
    mood: MoodSchema,
    content: z.string(),
  }),
  relationship: z.object({
    mood: MoodSchema,
    level: z.number().min(1).max(100),
    content: z.string(),
  }),
  health: z.object({
    mood: MoodSchema,
    content: z.string(),
  }),
  lucky: z.object({
    mood: MoodSchema,
    color: z.string(),
    number: z.string(),
    direction: z.string(),
    reason: z.string(),
  }),
  transit: z.object({
    mood: MoodSchema,
    content: z.string(),
  }),
  oracle: z.object({
    mood: MoodSchema,
    content: z.string(),
  }),
});

export async function POST(req: Request) {
  const {
    nakshatra,
    pada,
    name,
    birthDate,
    birthTime,
    latitude,
    longitude,
    currentDate,
    language,
  } = await req.json();

  // Calculate age for context
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  const effectiveNakshatra =
    language === "Malayalam"
      ? nakshatra?.match(/\(([^)]+)\)/)?.[1] || nakshatra
      : nakshatra;

  // Calculate Natal Chart
  const birthDateTime = new Date(`${birthDate}T${birthTime || "12:00"}:00`);
  const natalChart = await calculateFullChart(
    birthDateTime,
    latitude || 12.97,
    longitude || 77.59
  );

  // Calculate Current Transit Chart (Delhi/India context for general transits if current location not provided)
  const transitChart = await calculateFullChart(new Date(), 28.61, 77.2);

  const prompt = `
    You are an elite Vedic Astrologer (Jyotishi) with deep knowledge of the Vedas and planetary transits.
    Today is ${currentDate} (All calculations and transits are based on India Standard Time [IST]).
    
    User Context:
    - Name: ${name}
    - Birth Nakshatra: ${effectiveNakshatra}, Pada ${pada}
    - Age: ${age} years old
    - Language: ${language}
    
    NATAL SIGNATURE:
    - Ascendant (Lagna): ${natalChart.ascendant.rashi} at ${natalChart.ascendant.longitude.toFixed(2)}°
    - Natal Planets:
      ${natalChart.positions
        .map((p) => `- ${p.name}: ${p.rashi} (${p.longitude.toFixed(2)}°)`)
        .join("\n      ")}
    
    CURRENT CELESTIAL TRANSITS (GOCHARA):
    - Current Positions:
      ${transitChart.positions
        .map((p) => `- ${p.name}: ${p.rashi} (${p.longitude.toFixed(2)}°)`)
        .join("\n      ")}
    
    CRITICAL INSTRUCTION:
    Provide the ENTIRE reading in the ${language} language. All content fields must be written in ${language}.
    
    STYLE GUIDELINES:
    1. Authoritative & Ancient: Speak as a seasoned Jyotishi. Use terms like "soul," "alignment," "lunar tides," and "karmic flow."
    2. Deeply Personal: Integrate the user's specific Natal Signature and current Gochara into the narrative of EACH category.
    3. Technical but Accessible: Reference how current planetary movements (e.g., Saturn in ${transitChart.positions.find((p) => p.name === "Saturn")?.rashi}) interact with the user's natal ${natalChart.positions.find((p) => p.name === "Moon")?.rashi} Moon or ${natalChart.ascendant.rashi} Lagna.
    4. Descriptive: Use rich, evocative language. Avoid generic sentences.
    
    FEW-SHOT EXAMPLES (Follow this style):
    
    Example 1 (Mind & Emotion):
    - User Data: Rohini, Pada 2, Age 29, Natal Moon in Vrishabha, Transit Saturn in Kumbha (10th from Moon)
    - Output: "As a Rohini soul with your natal Moon exalted in Vrishabha, you naturally possess emotional stability. However, with Saturn currently transiting your tenth house of karma, your mind may feel the weight of professional responsibility today. The second pada grounding provides a steady anchor. Do not let the shadow of Rahu's glance disturb your inner peace; focus on creative solitude."
    
    Areas to cover:
    1. Mind & Emotion: Inner state and psychological moon energy.
    2. Career & Energy: Progress, vitality, and professional drive.
    3. Wealth & Abundance: Financial flow and prosperity transits.
    4. Relationship Harmony: Love, connections, and social resonance. Include a 'level' (1-100) representing social harmony.
    5. Health & Vitality: Physical well-being and prana energy.
    6. Transit Summary: A summary of the day's major Gochara impacts specifically for this user's chart.
    7. Oracle Advice: A final, powerful piece of guidance.
    
    Consider:
    1. The Moon's current position relative to natal Moon (Chandra Lagna).
    2. Sade Sati or Dhaiya status if applicable (Saturn relative to Moon).
    3. Major transits of Jupiter, Rahu/Ketu relative to the user's natal houses.
    
    Mood Definitions:
    - Mystical: Spiritual/Lunar depth.
    - Dynamic: Action/Solar energy.
    - Warning: Cautious transits (Rahu/Ketu/Retrogrades).
    - Balanced: Harmonious alignments.
    - Success: Auspicious results.
  `;

  const result = streamObject({
    model: google("gemini-3-flash-preview"),
    schema: ReadingSchema,
    prompt: prompt,
  });

  return result.toTextStreamResponse();
}
