"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Stars,
  Moon,
  Sun,
  ArrowRight,
  Compass,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto gap-12 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-accent/10 blur-2xl rounded-full animate-pulse" />
          <Stars className="w-16 h-16 text-accent relative" />
        </motion.div>

        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-serif font-black tracking-tighter text-accent leading-tight"
          >
            Ancient Wisdom. <br />
            <span className="text-foreground/80">Vedic Astrology.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed"
          >
            Unlock the secrets of your destiny with Daily Astrology. We combine
            5,000 years of Vedic tradition with advanced intelligence to guide
            your every day.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link
            href="/onboarding"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-accent text-accent-foreground rounded-full text-sm font-black tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl saffron-glow overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative">KNOW MY DAY</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 text-muted-foreground/30"
        >
          <Sun className="w-6 h-6 animate-spin-slow" />
          <Moon className="w-6 h-6" />
          <Sparkles className="w-6 h-6 animate-pulse" />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 px-6 bg-black/[0.02] border-y border-black/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard
            icon={<Compass className="w-8 h-8" />}
            title="Nakshatra Precise"
            description="Our algorithms calculate your exact birth star positions down to the second for true authenticity."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Karmic Guidance"
            description="Not just predictions, but insights into your soul's journey and practical advice for daily success."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Real-time Transits"
            description="Daily updates based on the current movement of celestial bodies relative to your natal signature."
          />
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-32 px-6 text-center max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl font-serif italic text-accent/60 leading-relaxed">
          "The stars do not compel, they impel. Knowing your celestial tide is
          the first step to mastering your own destiny."
        </h2>
        <div className="w-12 h-px bg-accent/20 mx-auto" />
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground/40">
          The Jyotish Tradition
        </p>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-black/5 text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-accent font-serif font-black text-xl tracking-tighter">
          <Stars className="w-5 h-5" />
          Daily Astrology
        </div>
        <p className="text-xs text-muted-foreground/60 font-body">
          © {new Date().getFullYear()} Daily Astrology. Ancient Wisdom for the
          Modern Soul.
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-[2rem] vedic-glass border border-accent/10 space-y-4 text-center"
    >
      <div className="inline-flex p-4 bg-accent/5 rounded-2xl text-accent mb-2">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-black text-accent">{title}</h3>
      <p className="text-sm text-muted-foreground font-body leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
