import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { uid, subscription } = await request.json();

    if (!uid || !subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Missing required fields: uid or subscription." }, { status: 400 });
    }

    // Hash the subscription endpoint to use as a safe, unique document ID
    const endpointHash = Buffer.from(subscription.endpoint).toString("base64url");

    // Save the subscription in the users/{uid}/subscriptions subcollection
    // Storing it in a subcollection allows the same user to have multiple subscriptions (e.g. laptop + mobile phone)
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("subscriptions")
      .doc(endpointHash)
      .set({
        subscription,
        updated_at: new Date().toISOString(),
      }, { merge: true });

    // Ensure the parent user document physically exists in Firestore
    // so queries on collection("users") can resolve this subscriber.
    await adminDb
      .collection("users")
      .doc(uid)
      .set({
        has_active_push: true,
        last_subscribed_at: new Date().toISOString(),
      }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Subscription save error:", error);
    return NextResponse.json({ error: error.message || "Failed to save subscription." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { uid, endpoint } = await request.json();

    if (!uid || !endpoint) {
      return NextResponse.json({ error: "Missing required fields: uid or endpoint." }, { status: 400 });
    }

    const endpointHash = Buffer.from(endpoint).toString("base64url");

    // Delete the subscription from Firestore
    await adminDb
      .collection("users")
      .doc(uid)
      .collection("subscriptions")
      .doc(endpointHash)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Subscription delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to remove subscription." }, { status: 500 });
  }
}
