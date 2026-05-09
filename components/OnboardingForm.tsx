"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, Calendar, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    city: "",
    lat: 0,
    lng: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: "English",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`,
        );
        const data = await res.json();

        // Photon returns GeoJSON format
        const mappedSuggestions = data.features.map((f: any) => ({
          display_name: [
            f.properties.name,
            f.properties.city,
            f.properties.state,
            f.properties.country,
          ]
            .filter(Boolean)
            .join(", "),
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        }));

        setSuggestions(mappedSuggestions);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeocoding(false);
        setSelectedIndex(-1);
      }
    }, 500); // Wait 500ms after last keystroke

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCitySearch = (query: string) => {
    setSearchQuery(query);
    setFormData({ ...formData, city: query });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const selectCity = (item: any) => {
    setFormData({
      ...formData,
      city: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    setSuggestions([]);
  };

  const nextStep = () => setStep(step + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Import the action dynamically to avoid issues with "use server" in client components
      const { saveUserOnboarding } = await import("@/app/onboarding/actions");

      const res = await saveUserOnboarding({
        ...formData,
        uid: "dummy-user-id-" + Math.random().toString(36).substring(7),
      });

      if (res.success) {
        setResult(res);
        setStep(4);
      } else {
        setError(res.error || "Failed to sync with the stars.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full md:max-w-xl mx-auto py-12 px-6 md:px-12 relative overflow-visible min-h-[600px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif font-bold text-accent tracking-widest">
                Seeker's Call
              </h2>
              <p className="text-muted-foreground font-body text-sm">
                Enter your name
              </p>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-black/5 border border-black/10 rounded-2xl px-6 py-4 outline-none focus:border-accent/40 focus:bg-black/10 transition-all font-body text-lg text-center"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent/60 block text-center">
                  Preferred Tongue
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["English", "Hindi", "Malayalam", "Tamil"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() =>
                        setFormData({ ...formData, language: lang })
                      }
                      className={cn(
                        "py-3 rounded-xl text-xs font-serif font-bold transition-all border",
                        formData.language === lang
                          ? "bg-accent text-accent-foreground border-accent shadow-lg scale-[1.02]"
                          : "bg-black/5 text-muted-foreground border-black/5 hover:bg-black/10",
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.name}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed text-accent-foreground font-serif font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif font-bold text-accent tracking-widest">
                Birth Portal
              </h2>
              <p className="text-muted-foreground font-body text-sm px-4">
                The exact moment you entered this physical realm.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent/60 flex items-center gap-2 ml-4">
                  <Calendar className="w-3 h-3" /> Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full bg-black/5 border border-black/10 rounded-2xl px-6 py-4 outline-none focus:border-accent/40 focus:bg-black/10 transition-all text-center"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent/60 flex items-center gap-2 ml-4">
                  <Clock className="w-3 h-3" /> Time of Birth
                </label>
                <input
                  type="time"
                  className="w-full bg-black/5 border border-black/10 rounded-2xl px-6 py-4 outline-none focus:border-accent/40 focus:bg-black/10 transition-all text-center"
                  value={formData.birthTime}
                  onChange={(e) =>
                    setFormData({ ...formData, birthTime: e.target.value })
                  }
                />
              </div>
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.birthDate || !formData.birthTime}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-30 text-accent-foreground font-serif font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
            >
              Next <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif font-bold text-accent tracking-widest">
                Earth Plane
              </h2>
              <p className="text-muted-foreground font-body text-sm px-4">
                Where were you when you first drew breath?
              </p>
            </div>
            <div className="relative">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/40" />
              <input
                type="text"
                placeholder="Birth City"
                className="w-full bg-black/5 border border-black/10 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-accent/40 focus:bg-black/10 transition-all font-body text-lg"
                value={formData.city}
                onChange={(e) => handleCitySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (suggestions.length === 0) return;

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                      prev < suggestions.length - 1 ? prev + 1 : prev,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (selectedIndex >= 0) {
                      selectCity(suggestions[selectedIndex]);
                    }
                  } else if (e.key === "Escape") {
                    setSuggestions([]);
                    setSelectedIndex(-1);
                  }
                }}
              />
              {suggestions.length > 0 && (
                <div className="absolute w-full mt-4 bg-muted border border-accent/20 rounded-2xl overflow-hidden z-20 shadow-2xl backdrop-blur-2xl">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        "w-full text-left px-6 py-4 transition-colors text-sm border-b border-white/5 last:border-none outline-none",
                        selectedIndex === idx
                          ? "bg-accent/20 text-accent font-bold"
                          : "hover:bg-accent/10 text-muted-foreground",
                      )}
                      onClick={() => selectCity(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <p className="text-red-400 text-xs text-center animate-shake">
                {error}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!formData.lat || !formData.lng || isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-30 text-accent-foreground font-serif font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>Calculating Fate...</>
              ) : (
                <>
                  Reveal My Destiny <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {step === 4 && result && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-10"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-serif font-bold text-accent tracking-[0.2em]">
                Signature Found
              </h2>
              <p className="text-muted-foreground font-body italic">
                Your celestial resonance has been identified.
              </p>
            </div>

            <motion.div
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="p-12 bg-accent/5 rounded-[3rem] border border-accent/10 relative group overflow-hidden max-w-2xl mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] uppercase tracking-[0.5em] font-black text-accent/60 mb-2 block">
                Sacred Nakshatra
              </span>
              <h3 className="text-xl font-serif font-black text-accent drop-shadow-[0_0_15px_rgba(234,190,83,0.3)]">
                {result.nakshatra}
              </h3>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1 bg-accent/10 rounded-full border border-accent/20 text-sm font-bold text-accent">
                Pada {result.pada}
              </div>
            </motion.div>

            <button
              onClick={() =>
                router.push(
                  `/reading?nakshatra=${encodeURIComponent(result.nakshatra)}&pada=${result.pada}&name=${encodeURIComponent(formData.name)}&birthDate=${formData.birthDate}&language=${formData.language}`,
                )
              }
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-serif font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all group"
            >
              Enter The Oracle{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
