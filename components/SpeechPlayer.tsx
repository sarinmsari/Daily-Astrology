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

            const currentElapsed = Math.min(
              Math.ceil((totalWordsRead / totalWords) * estimatedTotalSeconds),
              estimatedTotalSeconds,
            );
            setElapsedTime(currentElapsed);
          }
        };

        utterance.onend = () => {
          wordsReadBeforeCurrentChunk += chunkText.split(/\s+/).length;
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

  if (!isSupported || !reading) return null;  if (!voiceAvailable) return null;

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
        <div className="w-full flex flex-col sm:flex-row items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={isPlaying ? stopSpeech : () => startSpeech()}
              className={cn(
                "p-4 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer",
                isPlaying
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/10 text-accent",
              )}
            >
              {isPlaying ? (
                <Square className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current" />
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
    </motion.div>
  );
}
