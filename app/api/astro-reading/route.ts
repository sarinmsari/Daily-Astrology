import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

/**
 * Edge Runtime — no Node.js APIs, no WASM.
 * Vercel Hobby plan: Edge functions get 30s (vs 10s for serverless).
 * All ephemeris data is pre-computed by /api/astro-chart and passed in the request body.
 */
export const runtime = "edge";
export const maxDuration = 30;

const ReadingSchema = z.object({
  mind: z.object({ content: z.string() }),
  career: z.object({
    level: z.number().min(1).max(100),
    content: z.string(),
  }),
  wealth: z.object({ content: z.string() }),
  relationship: z.object({
    level: z.number().min(1).max(100),
    content: z.string(),
  }),
  health: z.object({ content: z.string() }),
  lucky: z.object({
    color: z.string(),
    number: z.string(),
    direction: z.string(),
    reason: z.string(),
  }),
  transit: z.object({ content: z.string() }),
  oracle: z.object({ content: z.string() }),
});

export async function POST(req: Request) {
  const {
    // User identity
    nakshatra,
    pada,
    name,
    language,
    currentDate,
    // Pre-computed by /api/astro-chart (no WASM needed here)
    natalChart,
    transitChart,
    derived,
    moonDayTransit,
  } = await req.json();

  // ── Age is not critical to re-compute here; derived context is sufficient ──

  const effectiveNakshatra =
    language === "Malayalam"
      ? nakshatra?.match(/\(([^)]+)\)/)?.[1] || nakshatra
      : nakshatra;

  // ── Build prompt from pre-computed ephemeris data ─────────────────────────
  const prompt = `
You are an elite Vedic Astrologer (Jyotishi) with mastery over Parashari and Jaimini systems.
Today's reading date is: ${currentDate} (India Standard Time).

═══════════════════════════════════════════════════════════════
USER PROFILE
═══════════════════════════════════════════════════════════════
Name:              ${name}
Birth Nakshatra:   ${effectiveNakshatra}, Pada ${pada}
Language:          ${language}

═══════════════════════════════════════════════════════════════
NATAL SIGNATURE (Swiss Ephemeris — Lahiri Ayanamsa)
═══════════════════════════════════════════════════════════════
Ascendant (Lagna): ${natalChart.ascendant.rashi} at ${natalChart.ascendant.longitude.toFixed(2)}°
Lagna Lord:        ${derived.lagnaLord}
Nakshatra Lord:    ${derived.nakshatraLord}

Natal Planet Positions & Dignities:
${derived.planetDignitySummary.map((d: string) => `  • ${d}`).join("\n")}

═══════════════════════════════════════════════════════════════
CURRENT TRANSITS / GOCHARA (${currentDate})
All positions computed by Swiss Ephemeris for this exact date.
═══════════════════════════════════════════════════════════════
${transitChart.positions
  .map(
    (p: { name: string; rashi: string; longitude: number }) =>
      `  • ${p.name}: ${p.rashi} (${p.longitude.toFixed(2)}°)` +
      (p.name === "Saturn"
        ? `  ← ${derived.saturnHouseFromNatal}th from natal Moon / ${derived.saturnHouseFromLagna}th from Lagna`
        : "") +
      (p.name === "Jupiter"
        ? `  ← ${derived.jupiterHouseFromNatal}th from natal Moon / ${derived.jupiterHouseFromLagna}th from Lagna`
        : "") +
      (p.name === "Moon"
        ? `  ← ${derived.moonHouseFromNatal}th from natal Moon`
        : "") +
      (p.name === "Rahu"
        ? `  ← ${derived.rahuHouseFromNatal}th from natal Moon`
        : ""),
  )
  .join("\n")}

═══════════════════════════════════════════════════════════════
MOON'S FULL-DAY ARC (${currentDate})
All positions from Swiss Ephemeris — covers the entire IST calendar day.
═════════════════════════════════════════════════════════════
${moonDayTransit
  ? moonDayTransit.nakshatraChanges || moonDayTransit.rashiChanges
    ? `Moon begins the day in ${moonDayTransit.startOfDay.nakshatra} (${moonDayTransit.startOfDay.rashi}), Pada ${moonDayTransit.startOfDay.pada}.
Moon transitions to ${moonDayTransit.endOfDay.nakshatra} (${moonDayTransit.endOfDay.rashi}), Pada ${moonDayTransit.endOfDay.pada} at approx. ${new Date(moonDayTransit.transitionTimeISO).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata", hour12: true })} IST.
The reading must reflect BOTH lunar energies: the morning tone (${moonDayTransit.startOfDay.nakshatra}) and the afternoon/evening shift (${moonDayTransit.endOfDay.nakshatra}).`
    : `Moon remains in ${moonDayTransit.startOfDay.nakshatra} (${moonDayTransit.startOfDay.rashi}), Pada ${moonDayTransit.startOfDay.pada} throughout the entire day. Single unified lunar energy.`
  : `Transit Moon: ${derived.transitMoonRashi} — ${derived.moonHouseFromNatal}th from natal Moon.`
}

═══════════════════════════════════════════════════════════════
VERIFIED VEDIC ANALYSIS (Pre-computed — DO NOT contradict)
═══════════════════════════════════════════════════════════════
Shani Transit Status:
  Phase:  ${derived.shaniTransitPhase}
  Detail: ${derived.shaniTransitDescription}

Transit Moon: ${derived.moonHouseFromNatal}th from natal Moon (${derived.natalMoonRashi})
Transit Jupiter: ${derived.jupiterHouseFromNatal}th from natal Moon
Transit Rahu: ${derived.rahuHouseFromNatal}th from natal Moon

═══════════════════════════════════════════════════════════════
PERSONALITY ARCHETYPE
═══════════════════════════════════════════════════════════════
Lagna: ${natalChart.ascendant.rashi} — ruled by ${derived.lagnaLord}
Natal Moon: ${derived.natalMoonRashi}
Tailor tone to this Lagna + Moon nature.
Saturn-ruled Lagna → discipline, strategy, long-term thinking.
Do NOT default to generic spiritual language unless chart supports it.

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════
1. All chart data above is from a certified Swiss Ephemeris engine.
   Use these positions EXACTLY. Do NOT override with your own assumptions.
2. Accept Shani transit phase, house positions, and dignity labels as given.
3. Every section must reference specific planets, rashis, and house numbers.
4. Write the ENTIRE reading in ${language}.

STYLE: Authoritative · Deeply Personal · Technical but Accessible · Evocative.

═══════════════════════════════════════════════════════════════
AREAS TO COVER
═══════════════════════════════════════════════════════════════
1. Mind & Emotion: Inner state, current Moon transit vs natal Moon.
2. Career & Energy: Professional drive. Include 'level' (1–100).
3. Wealth & Abundance: Financial transits, 2nd/11th house influences.
4. Relationship Harmony: Social resonance. Include 'level' (1–100).
5. Health & Vitality: Prana, 6th/8th house influences.
6. Lucky Elements: Color, number, direction — justified by the chart.
7. Transit Summary: Key Gochara impacts for this specific chart.
8. Oracle Advice: One powerful, chart-specific closing directive.


⚠ LENGTH CONSTRAINT: Each 'content' field must be exactly 3–4 sentences. No more.
   All 8 sections must be fully completed within a single response.
  `.trim();

  const result = streamObject({
    model: google("gemini-2.5-flash"),
    schema: ReadingSchema,
    prompt: prompt,
  });

  return result.toTextStreamResponse();
}
