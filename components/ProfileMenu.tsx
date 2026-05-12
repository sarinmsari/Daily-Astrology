"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, RefreshCw, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { triggerHaptic } from "@/lib/haptics";

/**
 * Fixed top-right profile avatar with a dropdown.
 * Shows for authenticated users only; renders nothing for guests.
 *
 * Props:
 *   showReset – whether to include the "Reset My Data" option (default true).
 *               Pass false on pages where resetting makes no sense.
 */
export default function ProfileMenu({ showReset = true }: { showReset?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    triggerHaptic(15);
    setProfileOpen(false);
    await logout();
    router.push("/onboarding");
  };

  const handleReset = async () => {
    triggerHaptic(20);
    setIsResetting(true);
    setProfileOpen(false);
    try {
      const { resetUserData } = await import("@/app/onboarding/actions");
      await resetUserData(user.uid);

      // Clear all reading cache keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("reading-")) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      router.push("/onboarding");
    } catch (e) {
      console.error("Reset failed:", e);
      setIsResetting(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 sm:fixed sm:top-5 sm:right-5 z-50">
      {/* Avatar button */}
      <button
        id="profile-menu-btn"
        onClick={() => {
          triggerHaptic(10);
          setProfileOpen((o) => !o);
        }}
        className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-accent/30 hover:border-accent/70 transition-all focus:outline-none cursor-pointer"
        aria-label="Profile menu"
        disabled={isResetting}
      >
        {isResetting ? (
          <div className="w-full h-full bg-accent/10 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-accent/60 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full bg-accent/10 flex items-center justify-center">
            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-accent/60" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {profileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-11 sm:top-12 z-50 w-56 bg-background/98 backdrop-blur-xl border border-accent/15 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-black/5 flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    referrerPolicy="no-referrer"
                    alt=""
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-serif font-black text-accent truncate">
                    {user.displayName || "Soul"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 truncate font-body">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Reset My Data */}
              {showReset && (
                <button
                  id="profile-reset-btn"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-serif text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 flex-shrink-0 ${isResetting ? "animate-spin" : ""}`}
                  />
                  <span>{isResetting ? "Resetting..." : "Reset My Data"}</span>
                </button>
              )}

              {/* Sign Out */}
              <button
                id="profile-logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-serif text-muted-foreground hover:bg-red-50 hover:text-red-400 transition-colors cursor-pointer border-t border-black/5"
              >
                <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

