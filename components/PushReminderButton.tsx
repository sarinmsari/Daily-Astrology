"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, RefreshCw, Sparkles, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPushSubscriptionStatus, subscribeUserToPush, unsubscribeUserFromPush } from "@/lib/push-notifications";
import { useAuth } from "@/context/AuthContext";
import { triggerHaptic } from "@/lib/haptics";

export default function PushReminderButton({ uid }: { uid: string }) {
  const { user, loginWithGoogle } = useAuth();
  const [status, setStatus] = useState<"loading" | "supported" | "unsupported" | "granted" | "denied" | "subscribed" | "default">("loading");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      const currentStatus = await getPushSubscriptionStatus();
      setStatus(currentStatus);
    }
    checkStatus();
  }, [user]);

  const handleSubscribe = async () => {
    triggerHaptic(15);
    setIsUpdating(true);
    setErrorMessage(null);

    const result = await subscribeUserToPush(uid);
    if (result.success) {
      setStatus("subscribed");
    } else {
      setErrorMessage(result.error || "Failed to enable notifications.");
    }
    setIsUpdating(false);
  };

  const handleUnsubscribe = async () => {
    triggerHaptic(10);
    setIsUpdating(true);
    setErrorMessage(null);

    const result = await unsubscribeUserFromPush(uid);
    if (result.success) {
      setStatus("granted"); // can resubscribe
    } else {
      setErrorMessage(result.error || "Failed to disable notifications.");
    }
    setIsUpdating(false);
  };

  const handleGuestSignIn = async () => {
    triggerHaptic(20);
    setIsUpdating(true);
    try {
      await loginWithGoogle();
      // Upon successful sign-in, the AuthContext state updates and triggers checkStatus()
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === "unsupported") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="mt-12 p-8 border border-accent/20 rounded-[2rem] bg-accent/5 backdrop-blur-xl text-center space-y-5 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <h3 className="font-serif font-black text-accent text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-accent/60 animate-pulse" />
            Daily Morning Reminders
          </h3>
          <p className="text-muted-foreground text-xs font-body max-w-sm mx-auto leading-relaxed">
            Receive a gentle cosmic nudge at exactly 7:00 AM IST with your personalized Nakshatra daily transit alignment.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 relative z-10">
          {status === "loading" || isUpdating ? (
            <button
              disabled
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-accent/20 text-accent/50 rounded-full cursor-not-allowed text-xs font-black tracking-widest"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              ALIGNING SATELLITES...
            </button>
          ) : !user ? (
            <button
              onClick={handleGuestSignIn}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-accent text-accent-foreground rounded-full cursor-pointer text-xs font-black tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/10"
            >
              <LogIn className="w-4 h-4" />
              SIGN IN TO ENABLE REMINDERS
            </button>
          ) : status === "subscribed" ? (
            <button
              onClick={handleUnsubscribe}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-black/10 hover:bg-red-500/10 text-accent hover:text-red-400 border border-accent/30 hover:border-red-500/30 rounded-full cursor-pointer text-xs font-black tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <BellOff className="w-4 h-4" />
              DISABLE REMINDERS
            </button>
          ) : status === "denied" ? (
            <div className="text-red-400 text-xs font-body font-bold uppercase tracking-wider">
              🔔 Notifications blocked in browser settings.
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-accent text-accent-foreground rounded-full cursor-pointer text-xs font-black tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/10"
            >
              <Bell className="w-4 h-4" />
              ENABLE REMINDERS
            </button>
          )}

          {errorMessage && (
            <p className="text-red-400 text-[10px] uppercase font-bold tracking-wider animate-shake mt-2">
              {errorMessage}
            </p>
          )}

          {status === "subscribed" && !isUpdating && (
            <p className="text-accent/60 text-[10px] uppercase font-bold tracking-widest animate-pulse mt-1">
              ✓ Subscribed to daily morning readings
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
