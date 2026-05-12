/**
 * Safe client-side utility to trigger device haptic feedback using Web Vibrate API.
 * Provides a gentle haptic tap sensation on supported mobile devices.
 * Safely fails gracefully on desktops or unsupported iOS web contexts.
 */
export function triggerHaptic(duration = 15) {
  if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(duration);
    } catch (e) {
      // Ignored gracefully if policy blocks vibration
    }
  }
}
