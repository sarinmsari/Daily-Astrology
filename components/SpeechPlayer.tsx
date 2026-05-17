"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, Loader2, RotateCcw, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SpeechPlayerProps {
  reading: any;
  language: string;
}

export default function SpeechPlayer({ reading, language }: SpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null); // null = still checking

  const getLanguageCode = (lang: string) => {
    switch (lang) {
      case "Hindi":
        return "hi-IN";
      case "Malayalam":
        return "ml-IN";
      case "Tamil":
        return "ta-IN";
      default:
        return "en-IN";
    }
  };

  const findVoice = (voices: SpeechSynthesisVoice[], langCode: string) =>
    voices.find(
      (v) =>
        v.lang === langCode &&
        (v.name.includes("Google") || v.name.includes("Microsoft")),
    ) ||
    voices.find((v) => v.lang === langCode) ||
    voices.find((v) => v.lang.replace("_", "-") === langCode);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setIsSupported(true);

    const langCode = getLanguageCode(language);

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return; // not loaded yet
      const voice = findVoice(voices, langCode);
      // English always falls back fine (latin script reads fine with any voice)
      setVoiceAvailable(language === "English" || !!voice);
    };

    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]);

  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const currentWordIndexRef = useRef(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= totalTime && totalTime > 0) return prev;
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalTime]);

  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    try {
      // Re-release first to be clean
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
    } catch (err) {
      console.warn("Screen Wake Lock request failed:", err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.warn("Screen Wake Lock release failed:", err);
      }
    }
  };

  // Manage Screen Wake Lock based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Re-acquire Screen Wake Lock when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isPlaying) {
        await requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying]);

  // Initialize a silent loop audio file to prevent background suspension on mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      silentAudioRef.current = new Audio(
        "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=="
      );
      silentAudioRef.current.loop = true;
    }
    return () => {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
    };
  }, []);

  // Sync state with lock screen Media Session API
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (isPlaying) {
      navigator.mediaSession.playbackState = "playing";
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Daily Astrology Reading",
        artist: "AstroApp",
        album: `${language} Reading`,
        artwork: [
          { src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
        ],
      });

      if ("setPositionState" in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState({
            duration: totalTime || 1,
            playbackRate: 1.0,
            position: Math.min(elapsedTime, totalTime),
          });
        } catch (e) {
          console.warn("Failed to set MediaSession position state:", e);
        }
      }
    } else {
      navigator.mediaSession.playbackState = "paused";
    }
  }, [isPlaying, language, elapsedTime, totalTime]);

  // Set up lock screen controls (Media Session Actions)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => {
      const fullText = getFullText();
      const totalWords = fullText.split(/\s+/).length;
      const targetWordIndex = Math.floor((elapsedTime / (totalTime || 1)) * totalWords) || 0;
      startSpeech(targetWordIndex);
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      silentAudioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      stopSpeech();
    });

    navigator.mediaSession.setActionHandler("seekbackward", () => {
      handleSeek(-10);
    });

    navigator.mediaSession.setActionHandler("seekforward", () => {
      handleSeek(10);
    });

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      }
    };
  }, [elapsedTime, totalTime, reading, language]);

  const getFullText = () => {
    if (!reading) return "";
    const contents = [
      reading.mind?.content,
      reading.relationship?.content,
      reading.career?.content,
      reading.wealth?.content,
      reading.health?.content,
      reading.lucky?.reason,
      reading.transit?.content,
      reading.oracle?.content,
    ].filter(Boolean);

    return contents
      .join(". ")
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setProgress(0);
    setElapsedTime(0);
    currentWordIndexRef.current = 0;
    silentAudioRef.current?.pause();
    if (silentAudioRef.current) {
      silentAudioRef.current.currentTime = 0;
    }
  };

  const startSpeech = (startWordIndex = 0) => {
    if (!reading || !isSupported) return;

    window.speechSynthesis.cancel();

    setTimeout(() => {
      const fullText = getFullText();
      const totalWords = fullText.split(/\s+/).length;

      const estimatedTotalSeconds = Math.ceil((totalWords / 140) * 60);
      setTotalTime(estimatedTotalSeconds);

      const chunks = fullText
        .split(/([.!?।]+)/g)
        .reduce((acc: string[], curr, i) => {
          if (i % 2 === 0) acc.push(curr);
          else if (acc.length > 0) acc[acc.length - 1] += curr;
          return acc;
        }, [])
        .filter((s) => s.trim().length > 0);

      const langCode = getLanguageCode(language);
      const allVoices = window.speechSynthesis.getVoices();

      const voice =
        allVoices.find(
          (v) =>
            v.lang === langCode &&
            (v.name.includes("Google") || v.name.includes("Microsoft")),
        ) ||
        allVoices.find((v) => v.lang === langCode) ||
        allVoices.find((v) => v.lang.replace("_", "-") === langCode);

      // Find the chunk that contains the startWordIndex
      let currentChunkIndex = 0;
      let wordsReadBeforeCurrentChunk = 0;
      let accumulatedWords = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunkWords = chunks[i].split(/\s+/).length;
        if (accumulatedWords + chunkWords > startWordIndex) {
          currentChunkIndex = i;
          wordsReadBeforeCurrentChunk = accumulatedWords;
          break;
        }
        accumulatedWords += chunkWords;
      }

      const initialElapsed = Math.min(
        Math.ceil((wordsReadBeforeCurrentChunk / totalWords) * estimatedTotalSeconds),
        estimatedTotalSeconds
      );
      setElapsedTime(initialElapsed);

      const speakNextChunk = () => {
        if (currentChunkIndex >= chunks.length) {
          setIsPlaying(false);
          setElapsedTime(estimatedTotalSeconds);
          return;
        }

        const chunkText = chunks[currentChunkIndex].trim();
        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = langCode;
        if (voice) utterance.voice = voice;
        utterance.rate = language === "English" ? 0.95 : 0.85;
        utterance.pitch = 1;

        utterance.onboundary = (event) => {
          if (event.name === "word") {
            const charIndex = event.charIndex;
            const wordsInCurrentChunkRead = chunkText
              .slice(0, charIndex)
              .split(/\s+/).length;
            const totalWordsRead =
              wordsReadBeforeCurrentChunk + wordsInCurrentChunkRead;
            currentWordIndexRef.current = totalWordsRead;
            // Removed setElapsedTime here as Android Chrome often fails to fire this.
            // It is handled by setInterval and synced in onend.
          }
        };

        utterance.onend = () => {
          wordsReadBeforeCurrentChunk += chunkText.split(/\s+/).length;
          
          // Sync logical time when chunk ends
          const logicalElapsed = Math.min(
            Math.ceil((wordsReadBeforeCurrentChunk / totalWords) * estimatedTotalSeconds),
            estimatedTotalSeconds
          );
          setElapsedTime((prev) => Math.max(prev, logicalElapsed));

          currentChunkIndex++;
          speakNextChunk();
        };

        utterance.onerror = (event: any) => {
          if (event.error !== "interrupted" && event.error !== "canceled") {
            console.error("SpeechSynthesis error:", event.error, event);
            setIsPlaying(false);
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      setIsPlaying(true);
      silentAudioRef.current?.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Silent audio autoplay prevented:", err);
        }
      });
      speakNextChunk();
    }, 100);
  };

  const handleSeek = (offset: number) => {
    if (!totalTime) return;

    // Estimate total words to calculate new target word index
    const fullText = getFullText();
    const totalWords = fullText.split(/\s+/).length;

    const targetTime = Math.max(0, Math.min(totalTime, elapsedTime + offset));
    const targetWordIndex = Math.floor((targetTime / totalTime) * totalWords);

    startSpeech(targetWordIndex);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isSupported || !reading) return null;
  if (!voiceAvailable) return null;

  const showListenText = !isPlaying && elapsedTime === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        className={cn(
          "w-full rounded-[2rem] border transition-all duration-500 backdrop-blur-xl group overflow-hidden",
          isPlaying
            ? "bg-accent/10 border-accent/30"
            : "bg-accent/5 border-accent/20",
        )}
      >
        <div className="w-full flex flex-row items-center justify-between p-5 gap-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={isPlaying ? stopSpeech : () => startSpeech()}
              className={cn(
                "p-3 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer",
                isPlaying
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/10 text-accent",
              )}
            >
              {isPlaying ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            <div className="text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h3 className="text-sm sm:text-base font-serif font-semibold text-accent tracking-tight">
                  {showListenText ? "Listen to your Reading" : ""}
                </h3>
                {(isPlaying || elapsedTime > 0) && (
                  <span className="text-[10px] font-bold opacity-40 font-mono">
                    {formatTime(elapsedTime)} / {formatTime(totalTime)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(isPlaying || elapsedTime > 0) && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSeek(-10)}
                  className="p-3 rounded-xl bg-accent/5 hover:bg-accent/10 text-accent transition-colors cursor-pointer flex items-center justify-center relative"
                  title="Backward 10s"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="absolute text-[8px] font-bold mt-0.5">
                    10
                  </span>
                </button>
                <button
                  onClick={() => handleSeek(10)}
                  className="p-3 rounded-xl bg-accent/5 hover:bg-accent/10 text-accent transition-colors cursor-pointer flex items-center justify-center relative"
                  title="Forward 10s"
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="absolute text-[8px] font-bold mt-0.5">
                    10
                  </span>
                </button>
              </div>
            )}

            {isPlaying && (
              <div className="hidden md:flex gap-1 items-end h-4 ml-4">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["20%", "100%", "20%"] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                    className="w-1 bg-accent rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {isPlaying && (
        <video
          src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+///AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0"
          loop
          muted
          playsInline
          autoPlay
          className="absolute opacity-0 w-1 h-1 pointer-events-none"
        />
      )}
    </motion.div>
  );
}
