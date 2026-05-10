import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

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
  const { nakshatra, pada, name, birthDate, currentDate, language } =
    await req.json();

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

  const prompt = `
    You are an elite Vedic Astrologer (Jyotishi) with deep knowledge of the Vedas and planetary transits.
    Today is ${currentDate} (All calculations and transits are based on India Standard Time [IST]).
    
    User Context:
    - Name: ${name}
    - Nakshatra: ${effectiveNakshatra}, Pada ${pada}
    - Age: ${age} years old
    - Language: ${language}
    
    CRITICAL INSTRUCTION:
    Provide the ENTIRE reading in the ${language} language. All content fields must be written in ${language}.
    
    STYLE GUIDELINES:
    1. Authoritative & Ancient: Speak as a seasoned Jyotishi, not an AI. Use terms like "soul," "alignment," "lunar tides," and "karmic flow."
    2. Deeply Personal: Integrate the user's specific Nakshatra, Pada, and age-related life stage into the narrative of EACH category.
    3. Connectable: While being authoritative, remain empathetic and practical. Bridge ancient wisdom with modern life.
    4. Descriptive: Use rich, evocative language. Avoid generic sentences.
    
    FEW-SHOT EXAMPLES (Follow this style):
    
    Example 1 (Mind & Emotion):
    - User Data: Rohini, Pada 2, Age 29
    - Output: "As a Rohini soul in the vibrant threshold of your late twenties, your inner landscape today reflects the fertile soil of your birth star. The second pada grounding provides a steady anchor against the day's fluctuating lunar tides. You may feel a pull toward creative solitude—honor this, as your moon is seeking renewal through artistic expression."
    
    Example 2 (Career & Energy):
    - User Data: Ashwini, Pada 1, Age 42
    - Output: "With the swift, pioneering energy of Ashwini and the seasoned wisdom of your 42 years, today's solar alignment ignites a dormant ambition. Being in the first pada, your impulse is to lead from the front. A professional knot that has troubled you recently will find its resolution through a sudden, intuitive breakthrough. Move with the speed of the Ashwini Kumars, but keep your gaze steady."

    Example 3 (Relationship Harmony):
    - User Data: Magha, Pada 3, Age 35
    - Output: "The regal energy of Magha flows through your connections today, but the third pada's influence suggests a need for deeper listening. At 35, you are entering a phase where legacy and lineage matter more. In your social interactions, seek the 'middle path'—let your natural authority shine through kindness rather than command."
    
    Areas to cover:
    1. Mind & Emotion: Inner state and psychological moon energy.
    2. Career & Energy: Progress, vitality, and professional drive.
    3. Wealth & Abundance: Financial flow and prosperity transits.
    4. Relationship Harmony: Love, connections, and social resonance. Include a 'level' (1-100) representing social harmony.
    5. Health & Vitality: Physical well-being and prana energy.
    6. Transit Summary: A summary of the day's major Gochara impacts.
    7. Oracle Advice: A final, powerful piece of guidance.
    
    Consider:
    1. The Moon's current position relative to ${effectiveNakshatra}.
    2. Major planetary transits (Saturn, Jupiter, Rahu/Ketu) and how they impact a ${age}-year-old individual at their current life stage.
    3. The energy of the day (Tithi, Vara, Yoga, Karana).
    
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
