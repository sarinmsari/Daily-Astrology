"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Moon,
  Sun,
  Stars,
  ArrowLeft,
  LogIn,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ProfileMenu from "@/components/ProfileMenu";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import {
  MindEmotionCard,
  CareerEnergyGauge,
  WealthAbundanceCard,
  RelationshipHarmonyGauge,
  HealthVitalityCard,
  LuckyElements,
  TransitSummary,
  OracleAdvice,
} from "@/components/AstroReadingComponents";
import InstallAppButton from "@/components/InstallAppButton";

const ReadingSchema = z.object({
  mind: z.object({
    mood: z.string(),
    content: z.string(),
  }),
  career: z.object({
    mood: z.string(),
    level: z.number(),
    content: z.string(),
  }),
  wealth: z.object({
    mood: z.string(),
    content: z.string(),
  }),
  relationship: z.object({
    mood: z.string(),
    level: z.number(),
    content: z.string(),
  }),
  health: z.object({
    mood: z.string(),
    content: z.string(),
  }),
  lucky: z.object({
    mood: z.string(),
    color: z.string(),
    number: z.string(),
    direction: z.string(),
    reason: z.string(),
  }),
  transit: z.object({
    mood: z.string(),
    content: z.string(),
  }),
  oracle: z.object({
    mood: z.string(),
    content: z.string(),
  }),
});

function ReadingContent() {
  const { user, loginWithGoogle, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const nakshatra = searchParams.get("nakshatra");
  const nakshatraIndex = searchParams.get("nakshatraIndex");
  const pada = searchParams.get("pada");
  const name = searchParams.get("name");
  const birthDate = searchParams.get("birthDate");
  const birthTime = searchParams.get("birthTime");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const language = searchParams.get("language") || "English";

  const [cachedReading, setCachedReading] = useState<any>(null);
  const [isComputingChart, setIsComputingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Keep a ref to `user` so the memoized onFinish closure can read current auth state.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const { object, submit, isLoading } = useObject({
    api: "/api/astro-reading",
    schema: ReadingSchema,
    onFinish: ({ object }) => {
      if (object) {
        const today = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          weekday: "long",
          timeZone: "Asia/Kolkata",
        });
        const cacheKey = `reading-${nakshatra}-${pada}-${name}-${birthDate}-${birthTime}-${lat}-${lng}-${language}-${today}`;
        localStorage.setItem(cacheKey, JSON.stringify(object));

        // ── Log every AI generation to the dated Firestore collection ──────
        // uid is the Firebase UID for authenticated users, guest UID otherwise.
        if (uid && nakshatra && name) {
          import("@/app/onboarding/actions").then(({ saveReadingLog }) => {
            saveReadingLog({
              uid,
              name: name!,
              nakshatra: nakshatra!,
              pada: pada ?? 0,
              language,
              isAuthenticated: !!userRef.current,
            }).catch(console.error);
          });
        }
      }
    },
  });

  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (nakshatra && pada && name && birthDate && !hasSubmitted.current) {
      const today = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
        timeZone: "Asia/Kolkata",
      });
      const cacheKey = `reading-${nakshatra}-${pada}-${name}-${birthDate}-${birthTime}-${lat}-${lng}-${language}-${today}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          setCachedReading(JSON.parse(cached));
          hasSubmitted.current = true;
          return;
        } catch (e) {
          console.error("Failed to parse cached reading", e);
        }
      }

      hasSubmitted.current = true;

      // ── Step 1: Compute ephemeris data (Node.js, fast, < 5s) ─────────────────
      const readingDateISO = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      setIsComputingChart(true);
      setChartError(null);

      const fetchChartAndSubmit = async () => {
        try {
          const chartRes = await fetch("/api/astro-chart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid, // ← used for Firestore natal chart lookup
              birthDate, // ← fallback if Firestore miss
              birthTime,
              latitude: lat ? parseFloat(lat) : undefined,
              longitude: lng ? parseFloat(lng) : undefined,
              nakshatraIndex: nakshatraIndex ? parseInt(nakshatraIndex) : 0,
              readingDateISO,
            }),
          });

          if (!chartRes.ok) throw new Error("Chart computation failed");
          const chartData = await chartRes.json();

          // ── Step 2: Stream LLM reading (Edge, up to 30s) ───────────────────
          setIsComputingChart(false);
          submit({
            nakshatra,
            pada,
            name,
            language,
            currentDate: today,
            // Pre-computed — Edge route uses these directly, no WASM needed
            natalChart: chartData.natalChart,
            transitChart: chartData.transitChart,
            derived: chartData.derived,
          });
        } catch (err: any) {
          setIsComputingChart(false);
          setChartError(
            err.message || "Could not compute chart. Please try again.",
          );
          console.error("Chart fetch error:", err);
        }
      };

      fetchChartAndSubmit();
    }
  }, [
    nakshatra,
    pada,
    name,
    birthDate,
    birthTime,
    lat,
    lng,
    language,
    nakshatraIndex,
    submit,
  ]);

  useEffect(() => {
    const syncWithUser = async () => {
      if (user && nakshatra && name && birthDate) {
        try {
          // ── Check if user already has a complete Firestore profile ──────────
          // Skip sync if natal_chart already exists — we don't want to overwrite
          // a valid chart that was computed with real coordinates.
          const { db } = await import("@/lib/firebase");
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data()?.natal_chart) {
            console.log(
              "Authenticated profile already complete, skipping sync.",
            );
            return;
          }

          const { saveUserOnboarding } =
            await import("@/app/onboarding/actions");
          await saveUserOnboarding({
            name,
            birthDate,
            birthTime: birthTime || "12:00",
            city: "Unknown",
            lat: lat ? parseFloat(lat) : 0,
            lng: lng ? parseFloat(lng) : 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            uid: user.uid,
            isAuthenticated: true,
            nakshatra,
            pada: Number(pada) || 0,
            language,
          });
          console.log("Reading synced with authenticated profile");
        } catch (e) {
          console.error("Failed to sync reading with user", e);
        }
      }
    };
    syncWithUser();
  }, [user, nakshatra, pada, name, birthDate, birthTime, lat, lng, language]);

  const handleLogout = async () => {
    await logout();
    router.push("/onboarding");
  };

  const reading = cachedReading || object;

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto px-1 sm:px-6 py-12 relative">
      <ProfileMenu />

      {/* ── Back link (guests only) ──────────────────────────────────────── */}
      {!user && (
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-muted-foreground/60 hover:text-accent mb-12 transition-all group font-serif text-xs tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Back
        </Link>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`space-y-16 md:space-y-24 relative ${user ? "pt-16" : ""}`}
      >
        <header className="text-center space-y-6 px-2 sm:px-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-black tracking-tighter text-accent leading-none">
              Day Astrology Reading for{" "}
              <span className="capitalize">{name}</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-accent/40">
              {language === "Malayalam"
                ? nakshatra?.match(/\(([^)]+)\)/)?.[1] || nakshatra
                : nakshatra}{" "}
              • Pada {pada}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 px-8 py-3 vedic-glass rounded-full border border-accent/30 saffron-glow">
            <span className="font-serif text-xs font-black tracking-[0.3em] text-accent">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                weekday: "long",
                timeZone: "Asia/Kolkata",
              })}
            </span>
          </div>
        </header>

        <div className="space-y-12 md:space-y-20 relative">
          {/* ── Phase 1 loader: computing ephemeris ───────────────────────── */}
          {isComputingChart && !reading && (
            <div className="flex flex-col items-center justify-center space-y-8 py-24">
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="text-accent/40"
              >
                <Stars className="w-20 h-20" />
              </motion.div>
              <div className="text-center space-y-2">
                <p className="text-accent text-sm font-serif font-black tracking-[0.5em] uppercase">
                  Reading the Skies
                </p>
                <p className="text-muted-foreground/40 font-body text-xs italic">
                  Calculating your natal &amp; transit chart...
                </p>
              </div>
            </div>
          )}

          {/* ── Phase 2 loader: LLM streaming ─────────────────────────────── */}
          {isLoading && !reading && (
            <div className="flex flex-col items-center justify-center space-y-8 py-24">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-accent/40"
              >
                <Sparkles className="w-20 h-20" />
              </motion.div>
              <div className="text-center space-y-2">
                <p className="text-accent text-sm font-serif font-black tracking-[0.5em] uppercase">
                  Aligning the Spheres
                </p>
                <p className="text-muted-foreground/40 font-body text-xs italic">
                  Consulting the ancient Akashic records...
                </p>
              </div>
            </div>
          )}

          {/* ── Error state ───────────────────────────────────────────────── */}
          {chartError && !reading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 border border-dashed border-red-400/30 rounded-[2rem]">
              <p className="text-red-400/70 font-body italic text-sm text-center">
                {chartError}
              </p>
            </div>
          )}

          {/* ── Idle state (no params) ────────────────────────────────────── */}
          {!isComputingChart && !isLoading && !reading && !chartError && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 border border-dashed border-accent/20 rounded-[2rem]">
              <p className="text-muted-foreground font-body italic text-sm text-center">
                The stars are quiet. <br />
                {!nakshatra || !pada || !name || !birthDate
                  ? "Celestial context is missing. Please return to the portal."
                  : "Starting channel..."}
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-10 md:gap-16">
              {reading?.mind?.content && (
                <MindEmotionCard
                  content={reading.mind.content}
                  mood={reading.mind.mood as any}
                />
              )}
              {reading?.relationship?.content && (
                <RelationshipHarmonyGauge
                  content={reading.relationship.content}
                  level={reading.relationship.level || 0}
                  mood={reading.relationship.mood as any}
                />
              )}
              {reading?.career?.content && (
                <CareerEnergyGauge
                  content={reading.career.content}
                  level={reading.career.level || 0}
                  mood={reading.career.mood as any}
                />
              )}
              {reading?.wealth?.content && (
                <WealthAbundanceCard
                  content={reading.wealth.content}
                  mood={reading.wealth.mood as any}
                />
              )}
              {reading?.health?.content && (
                <HealthVitalityCard
                  content={reading.health.content}
                  mood={reading.health.mood as any}
                />
              )}
              {reading?.lucky?.reason && (
                <LuckyElements
                  color={reading.lucky.color || ""}
                  number={reading.lucky.number || ""}
                  direction={reading.lucky.direction || ""}
                  reason={reading.lucky.reason}
                  mood={reading.lucky.mood as any}
                />
              )}
              {reading?.transit?.content && (
                <TransitSummary
                  content={reading.transit.content}
                  mood={reading.transit.mood as any}
                />
              )}
              {reading?.oracle?.content && (
                <OracleAdvice
                  content={reading.oracle.content}
                  mood={reading.oracle.mood as any}
                />
              )}
            </div>
          </AnimatePresence>

          {!isLoading && !user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 p-8 border border-accent/20 rounded-[2rem] bg-accent/5 text-center space-y-4"
            >
              <div className="space-y-2">
                <h3 className="font-serif font-black text-accent text-lg">
                  Save your birth details?
                </h3>
                <p className="text-muted-foreground text-xs font-body">
                  Sign in to save your birth profile for quick daily astrology.
                </p>
              </div>
              <button
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-3 px-8 py-3 bg-accent text-accent-foreground rounded-full cursor-pointer text-xs font-black tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </button>
            </motion.div>
          )}

          {!isLoading && <InstallAppButton />}

          {!isLoading && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="pt-12 border-t border-black/5 flex select-none justify-center gap-10 text-muted-foreground/40"
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold">
                  Surya
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold">
                  Chandra
                </span>
              </div>
            </motion.footer>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ReadingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            Channeling...
          </div>
        }
      >
        <ReadingContent />
      </Suspense>
    </main>
  );
}
