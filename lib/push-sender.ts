import webpush from "web-push";

// Initialize VAPID details if environment variables are available
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:doopstech@gmail.com",
    vapidPublicKey,
    vapidPrivateKey,
  );
} else {
  console.warn(
    "VAPID keys are missing from environment variables. Daily reminders cannot be dispatched.",
  );
}

/**
 * Sends a standard daily reminder notification to a given browser subscription.
 */
export async function sendDailyReminder(subscription: any, userName: string) {
  const payload = JSON.stringify({
    title: `Good Morning, ${userName}`,
    body: "Your daily Nakshatra transit & Vedic astrology readings are ready. Click to know your day",
    url: "/",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error: any) {
    // 410 (Gone) or 404 (Not Found) means the user revoked permissions or the subscription expired
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true };
    }
    console.error("Web Push delivery error:", error);
    return { success: false, expired: false, error: error.message };
  }
}
export default sendDailyReminder;
