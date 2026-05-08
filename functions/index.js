const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { generateText } = require("ai");
const { google } = require("@ai-sdk/google");

admin.initializeApp();
const resend = new Resend(process.env.RESEND_API_KEY);

exports.dailyAstroReading = functions.pubsub
  .schedule("0 7 * * *") // Every day at 7 AM
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore().collection("users").get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      // 1. Generate Reading
      const prompt = `Generate a 3-sentence personalized Vedic astrology reading for someone with ${userData.birth_star_nakshatra} Nakshatra, Pada ${userData.nakshatra_pada}. Focus on today's planetary transits and keep it mysterious and insightful.`;
      
      const { text } = await generateText({
        model: google("gemini-3-pro-preview"),
        prompt: prompt,
      });

      // 2. Send Email
      await resend.emails.send({
        from: "Astrology <oracles@yourdomain.com>",
        to: [userData.email || "user@example.com"],
        subject: "Your Daily Cosmic Insight",
        html: `<div style="background: #050508; color: #f0f0f5; padding: 40px; font-family: sans-serif;">
          <h1 style="color: #8b5cf6;">Celestial Insight</h1>
          <p style="font-size: 18px; line-height: 1.6;">${text}</p>
          <hr style="border: 0; border-top: 1px solid #1e1e2e; margin: 20px 0;">
          <small style="color: #94a3b8;">Reflecting the stars of ${userData.birth_star_nakshatra}</small>
        </div>`,
      });

      // 3. Send Push Notification
      if (userData.fcm_token) {
        await admin.messaging().send({
          token: userData.fcm_token,
          notification: {
            title: "The Stars Have Spoken",
            body: text.substring(0, 100) + "...",
          },
        });
      }
    }

    return null;
  });
