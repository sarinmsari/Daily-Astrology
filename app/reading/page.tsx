"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Stars, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  const searchParams = useSearchParams();
  const nakshatra = searchParams.get("nakshatra");
  const pada = searchParams.get("pada");
  const name = searchParams.get("name");
  const birthDate = searchParams.get("birthDate");
  const language = searchParams.get("language") || "English";

  const [cachedReading, setCachedReading] = useState<any>(null);

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
        const cacheKey = `reading-${nakshatra}-${pada}-${name}-${birthDate}-${language}-${today}`;
        localStorage.setItem(cacheKey, JSON.stringify(object));
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
      const cacheKey = `reading-${nakshatra}-${pada}-${name}-${birthDate}-${language}-${today}`;
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
      submit({
        nakshatra,
        pada,
        name,
        birthDate,
        language,
        currentDate: today,
      });
    }
  }, [nakshatra, pada, name, birthDate, language, submit]);

  const reading = cachedReading || object;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-2 text-muted-foreground/60 hover:text-accent mb-12 transition-all group font-serif text-xs tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
        Back to Stars
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-16 md:space-y-24 relative"
      >
        {/* Background Mandala-like Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -z-10" />

        <header className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-accent leading-none">
              Cosmic Oracle
            </h1>
            <p className="font-body italic text-muted-foreground/60 text-lg">
              Insights revealed for {name}
            </p>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-accent/40">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                weekday: "long",
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 px-8 py-3 vedic-glass rounded-full border border-accent/30 saffron-glow">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="font-serif text-xs font-black tracking-[0.3em] text-accent">
              {language === "Malayalam"
                ? nakshatra?.match(/\(([^)]+)\)/)?.[1] || nakshatra
                : nakshatra}{" "}
              • Pada {pada}
            </span>
          </div>
        </header>

        <div className="space-y-12 md:space-y-20 relative">
          {!isLoading && !reading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 border border-dashed border-accent/20 rounded-[2rem]">
              <p className="text-muted-foreground font-body italic text-sm text-center">
                The stars are quiet. <br />
                {!nakshatra || !pada || !name || !birthDate
                  ? "Celestial context is missing. Please return to the portal."
                  : "Click below to channel the Oracle."}
              </p>
              {nakshatra && pada && name && birthDate && (
                <button
                  onClick={() =>
                    submit({
                      nakshatra,
                      pada,
                      name,
                      birthDate,
                      currentDate: new Date().toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        weekday: "long",
                        timeZone: "Asia/Kolkata",
                      }),
                    })
                  }
                  className="px-6 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-full text-xs font-black tracking-widest transition-all"
                >
                  CHANNEL NOW
                </button>
              )}
            </div>
          )}

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

          {!isLoading && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="pt-12 border-t border-black/5 flex justify-center gap-10 text-muted-foreground/40"
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
