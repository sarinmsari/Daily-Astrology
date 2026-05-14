"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Briefcase,
  Zap,
  AlertCircle,
  Compass,
  Hash,
  Palette,
  Coins,
  Heart,
  Activity,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AstroMood =
  | "Mystical"
  | "Dynamic"
  | "Warning"
  | "Balanced"
  | "Success";

const moodStyles: Record<
  AstroMood,
  { bg: string; border: string; text: string; icon: string; accent: string }
> = {
  Mystical: {
    bg: "bg-purple-50/50",
    border: "border-purple-200",
    text: "text-purple-900",
    icon: "text-purple-600",
    accent: "bg-purple-500",
  },
  Dynamic: {
    bg: "bg-orange-50/50",
    border: "border-orange-200",
    text: "text-orange-900",
    icon: "text-orange-600",
    accent: "bg-orange-500",
  },
  Warning: {
    bg: "bg-red-50/50",
    border: "border-red-200",
    text: "text-red-900",
    icon: "text-red-600",
    accent: "bg-red-500",
  },
  Balanced: {
    bg: "bg-emerald-50/50",
    border: "border-emerald-200",
    text: "text-emerald-900",
    icon: "text-emerald-600",
    accent: "bg-emerald-500",
  },
  Success: {
    bg: "bg-yellow-50/50",
    border: "border-yellow-200",
    text: "text-yellow-900",
    icon: "text-yellow-600",
    accent: "bg-yellow-500",
  },
};

const SectionWrapper = ({
  children,
  mood,
  title,
  icon: Icon,
}: {
  children: React.ReactNode;
  mood: AstroMood;
  title: string;
  icon: any;
}) => {
  const style = moodStyles[mood] || moodStyles.Mystical;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-[2.5rem] border backdrop-blur-xl transition-all duration-500",
        style.bg,
        style.border,
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-2xl bg-white/5", style.icon)}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className={cn("text-xl font-bold tracking-tight", style.icon)}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
};

export const MindEmotionCard = ({
  content,
  mood = "Mystical",
}: {
  content: string;
  mood?: AstroMood;
}) => (
  <SectionWrapper title="Mind & Emotion" icon={Brain} mood={mood}>
    <p className="text-foreground/90 leading-relaxed font-serif text-sm sm:text-lg italic">
      {content}
    </p>
  </SectionWrapper>
);

export const RelationshipHarmonyGauge = ({
  content,
  level,
  mood = "Mystical",
}: {
  content: string;
  level: number;
  mood?: AstroMood;
}) => {
  const style = moodStyles[mood] || moodStyles.Mystical;
  return (
    <SectionWrapper title="Relationship Harmony" icon={Heart} mood={mood}>
      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-6">
        {content}
      </p>
      {/* <div className="space-y-3">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
          <span>Social Resonance</span>
          <span>{level}%</span>
        </div>
        <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden p-0.5 border border-black/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${level}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={cn("h-full rounded-full", style.accent)}
          />
        </div>
      </div> */}
    </SectionWrapper>
  );
};

export const CareerEnergyGauge = ({
  content,
  level,
  mood = "Mystical",
}: {
  content: string;
  level: number;
  mood?: AstroMood;
}) => {
  const style = moodStyles[mood] || moodStyles.Mystical;
  return (
    <SectionWrapper title="Career & Energy" icon={Briefcase} mood={mood}>
      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-6">
        {content}
      </p>
      {/* <div className="space-y-3">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
          <span>Celestial Drive</span>
          <span>{level}%</span>
        </div>
        <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden p-0.5 border border-black/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${level}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={cn("h-full rounded-full", style.accent)}
          />
        </div>
      </div> */}
    </SectionWrapper>
  );
};

export const WealthAbundanceCard = ({
  content,
  mood = "Mystical",
}: {
  content: string;
  mood?: AstroMood;
}) => (
  <SectionWrapper title="Wealth & Abundance" icon={Coins} mood={mood}>
    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed italic">
      {content}
    </p>
  </SectionWrapper>
);

export const HealthVitalityCard = ({
  content,
  mood = "Mystical",
}: {
  content: string;
  mood?: AstroMood;
}) => (
  <SectionWrapper title="Health & Vitality" icon={Activity} mood={mood}>
    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed italic">
      {content}
    </p>
  </SectionWrapper>
);

export const OracleAdvice = ({
  content,
  mood = "Mystical",
}: {
  content: string;
  mood?: AstroMood;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative group overflow-hidden bg-foreground text-background p-8 sm:p-10 rounded-[3rem] border border-white/10"
  >
    <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
      <Zap className="w-40 h-40" />
    </div>
    <div className="relative z-10 space-y-6">
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="w-5 h-5 opacity-60" />
        <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-60">
          The Oracle Speaks
        </span>
      </div>
      <p className="text-sm sm:text-base font-serif font-bold leading-relaxed tracking-tight">
        {content}
      </p>
    </div>
  </motion.div>
);

export const LuckyElements = ({
  color,
  number,
  direction,
  reason,
  mood = "Mystical",
}: {
  color: string;
  number: string;
  direction: string;
  reason: string;
  mood?: AstroMood;
}) => (
  <SectionWrapper title="Lucky Vibrations" icon={Zap} mood={mood}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {[
        { label: "Color", value: color, icon: Palette },
        { label: "Number", value: number, icon: Hash },
        { label: "Path", value: direction, icon: Compass },
      ].map((item, i) => (
        <div
          key={i}
          className="bg-black/5 border border-black/10 p-4 rounded-3xl text-center hover:bg-black/10 transition-colors group"
        >
          <item.icon className="w-4 h-4 mx-auto mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
          <span className="block text-[8px] uppercase tracking-widest opacity-40 mb-1">
            {item.label}
          </span>
          <span className="block text-sm sm:text-base font-bold">
            {item.value}
          </span>
        </div>
      ))}
    </div>
    <p className="text-xs text-foreground/60 italic text-center px-4 leading-relaxed">
      {reason}
    </p>
  </SectionWrapper>
);

export const TransitSummary = ({
  content,
  mood = "Mystical",
}: {
  content: string;
  mood?: AstroMood;
}) => (
  <SectionWrapper title="Cosmic Transit" icon={AlertCircle} mood={mood}>
    <div className="relative">
      <p className="text-foreground/80 text-sm sm:text-base leading-relaxed font-medium italic">
        {content}
      </p>
    </div>
  </SectionWrapper>
);
