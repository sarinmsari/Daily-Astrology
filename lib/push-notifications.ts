"use client";

// Base64 helper required for Web Push subscription (converts URL-safe base64 VAPID public key to Uint8Array)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if push notifications are supported and if the browser is currently subscribed.
 */
export async function getPushSubscriptionStatus(): Promise<"supported" | "unsupported" | "granted" | "denied" | "subscribed" | "default"> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }

  try {
    const permission = Notification.permission;
    if (permission === "denied") return "denied";

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return "subscribed";
    }
    
    return permission; // 'default' or 'granted' (but not yet subscribed)
  } catch (err) {
    console.error("Error checking push status:", err);
    return "unsupported";
  }
}

/**
 * Request notification permissions and register for Push Notifications.
 */
export async function subscribeUserToPush(userId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Push notifications are not supported on this device." };
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission denied." };
    }

    // 2. Get active service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Subscribe to push manager using VAPID Public Key
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables.");
      return { success: false, error: "Push notification system configuration error." };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // 4. Send subscription details to Next.js API endpoint
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: userId,
        subscription,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to save subscription on server.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error subscribing to push notifications:", error);
    return { success: false, error: error.message || "Failed to align notification channels." };
  }
}

/**
 * Revokes current browser subscription and updates the backend.
 */
export async function unsubscribeUserFromPush(userId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { success: false };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // 1. Tell backend to delete the subscription from Firestore
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          endpoint: subscription.endpoint,
        }),
      });

      // 2. Unsubscribe browser-side
      const unsubscribed = await subscription.unsubscribe();
      return { success: unsubscribed };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error unsubscribing from push notifications:", error);
    return { success: false, error: error.message || "Failed to unlink notifications." };
  }
}
