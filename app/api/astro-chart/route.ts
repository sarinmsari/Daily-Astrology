import { calculateFullChart, getDerivedFacts } from "@/lib/astro";
import { adminDb } from "@/lib/firebase-admin";

/**
 * POST /api/astro-chart
 *
 * Node.js (serverless) route — ephemeris data only, no LLM.
 *
 * Strategy:
 *   1. If `uid` is provided, read the pre-computed natal chart from Firestore
 *      (stored once at onboarding — never needs recomputing for the same user).
 *   2. Compute ONLY the transit chart for the reading date via SwissEph.
 *   3. Combine natal + transit → derived Vedic facts.
 *
 * Falls back to full computation if Firestore lookup fails.
 */
export async function POST(req: Request) {
  const { uid, birthDate, birthTime, latitude, longitude, nakshatraIndex, readingDateISO } =
    await req.json();

  // Resolve the reading date (any date, not hardcoded)
  const readingDate = readingDateISO
    ? new Date(`${readingDateISO}T12:00:00+05:30`)
    : new Date();

  let natalChart: Awaited<ReturnType<typeof calculateFullChart>> | null = null;
  let resolvedNakshatraIndex: number = nakshatraIndex ?? 0;

  // ── Step 1: Try to load natal chart from Firestore ──────────────────────────
  if (uid) {
    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        if (data.natal_chart?.positions && data.natal_chart?.ascendant) {
          // Reconstitute the FullChart shape — houses not stored (unused in readings)
          natalChart = {
            ...data.natal_chart,
            houses: data.natal_chart.houses ?? [],
          } as Awaited<ReturnType<typeof calculateFullChart>>;
          if (data.nakshatra_index !== undefined) {
            resolvedNakshatraIndex = data.nakshatra_index;
          }
        }
      }
    } catch (err) {
      // Non-fatal: fall through to recompute below
      console.warn("Firestore natal chart lookup failed, recomputing:", err);
    }
  }

  // ── Step 2: Recompute natal chart only if Firestore miss ────────────────────
  const needsNatalCompute = !natalChart;

  const transitPromise = calculateFullChart(readingDate, 28.61, 77.2, false);
  const natalPromise = needsNatalCompute
    ? calculateFullChart(
        new Date(`${birthDate}T${birthTime || "12:00"}:00`),
        latitude ?? 12.97,
        longitude ?? 77.59,
        true
      )
    : Promise.resolve(null);

  const [transitChart, recomputedNatal] = await Promise.all([transitPromise, natalPromise]);

  if (recomputedNatal) {
    natalChart = recomputedNatal;
  }

  const derived = getDerivedFacts(natalChart!, transitChart, resolvedNakshatraIndex);

  return Response.json({ natalChart, transitChart, derived });
}
