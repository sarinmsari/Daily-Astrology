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

// SectionWrapper provides a consistent, minimal container for all reading cards
const SectionWrapper = ({
  children,
  title,
  icon: Icon,
}: {
  children: React.ReactNode;
  title: string;
  icon: any;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 sm:p-8 rounded-[2rem] border border-black/5 bg-white/40 backdrop-blur-md transition-all duration-500"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-accent/5 text-accent">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-serif font-black tracking-tight text-accent/80">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
};

export const MindEmotionCard = ({ content }: { content: string }) => (
  <SectionWrapper title="Mind & Emotion" icon={Brain}>
    <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
      {content}
    </p>
  </SectionWrapper>
);

export const RelationshipHarmonyGauge = ({
  content,
  level,
}: {
  content: string;
  level: number;
}) => {
  return (
    <SectionWrapper title="Relationship Harmony" icon={Heart}>
      <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
        {content}
      </p>
    </SectionWrapper>
  );
};

export const CareerEnergyGauge = ({
  content,
  level,
}: {
  content: string;
  level: number;
}) => {
  return (
    <SectionWrapper title="Career & Energy" icon={Briefcase}>
      <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
        {content}
      </p>
    </SectionWrapper>
  );
};

export const WealthAbundanceCard = ({ content }: { content: string }) => (
  <SectionWrapper title="Wealth & Abundance" icon={Coins}>
    <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
      {content}
    </p>
  </SectionWrapper>
);

export const HealthVitalityCard = ({ content }: { content: string }) => (
  <SectionWrapper title="Health & Vitality" icon={Activity}>
    <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
      {content}
    </p>
  </SectionWrapper>
);

export const OracleAdvice = ({ content }: { content: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative group overflow-hidden bg-accent text-accent-foreground p-8 sm:p-10 rounded-[3rem] border border-accent/20 shadow-xl shadow-accent/10"
  >
    <div className="absolute -top-10 -right-10 opacity-20 group-hover:opacity-30 transition-opacity duration-1000">
      <Zap className="w-40 h-40 fill-current" />
    </div>
    <div className="relative z-10 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 opacity-70" />
        <span className="text-[10px] uppercase tracking-[0.5em] font-black opacity-70">
          The Oracle Speaks
        </span>
      </div>
      <p className="text-base sm:text-lg font-serif font-semibold leading-relaxed tracking-tight">
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
}: {
  color: string;
  number: string;
  direction: string;
  reason: string;
}) => (
  <SectionWrapper title="Lucky Vibrations" icon={Zap}>
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
          <div className="flex items-center justify-center gap-2">
            {item.label === "Color" && (
              <div
                className="w-2 h-2 rounded-full border border-black/10"
                style={{ backgroundColor: item.value.toLowerCase() }}
              />
            )}
            <span className="block text-sm sm:text-base font-bold">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-foreground/60 italic text-center px-4 leading-relaxed">
      {reason}
    </p>
  </SectionWrapper>
);

export const TransitSummary = ({ content }: { content: string }) => (
  <SectionWrapper title="Cosmic Transit" icon={AlertCircle}>
    <div className="relative">
      <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
        {content}
      </p>
    </div>
  </SectionWrapper>
);
