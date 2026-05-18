import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendDailyReminder } from "@/lib/push-sender";

export async function GET(request: Request) {
  // Secure with Authorization secret header to prevent arbitrary requests in production.
  // In local development, we allow direct triggers for quick testing.
  const authHeader = request.headers.get("authorization");
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const usersSnap = await adminDb.collection("users").get();
    let sentCount = 0;
    let failedCount = 0;

    // We execute concurrently to avoid running into Vercel Hobby's 10-second function timeout.
    // Each user's subscriptions are resolved and dispatched in parallel.
    const userDispatchPromises = usersSnap.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      const userName = userData.full_name || "Soul";

      const subCollectionSnap = await userDoc.ref
        .collection("subscriptions")
        .get();
      if (subCollectionSnap.empty) return;

      const deviceDispatchPromises = subCollectionSnap.docs.map(
        async (subDoc) => {
          const { subscription } = subDoc.data();

          const result = await sendDailyReminder(subscription, userName);

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            if (result.expired) {
              // Self-healing database: clean up expired subscriptions immediately
              await subDoc.ref.delete();
            }
          }
        },
      );

      await Promise.all(deviceDispatchPromises);
    });

    await Promise.all(userDispatchPromises);

    return NextResponse.json({
      success: true,
      message: "Daily morning reminders processed successfully.",
      stats: { sent: sentCount, failed: failedCount },
    });
  } catch (error: any) {
    console.error("Cron execution error:", error);
    return NextResponse.json(
      { error: error.message || "Cron internal server error." },
      { status: 500 },
    );
  }
}
