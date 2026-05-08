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
    You are an elite Vedic Astrologer (Jyotishi). 
    Today is ${currentDate}.
    
    User Context:
    - Name: ${name}
    - Nakshatra: ${effectiveNakshatra}, Pada ${pada}
    - Age: ${age} years old
    - Language: ${language}
    
    CRITICAL INSTRUCTION:
    Provide the ENTIRE reading in the ${language} language. All content fields must be written in ${language}.
    
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
    
    Speak with authority and ancient wisdom. Do not mention that you are an AI.
  `;

  const result = streamObject({
    model: google("gemini-3-pro-preview"),
    schema: ReadingSchema,
    prompt: prompt,
  });

  return result.toTextStreamResponse();
}
