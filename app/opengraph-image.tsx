import { ImageResponse } from "next/og";

// Image metadata
export const alt =
  "DailyAstrology | Vedic Astrology & Personalized Daily Nakshatra Readings";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FDFCFB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top-left subtle decorative circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: 250,
          backgroundColor: "rgba(198, 156, 44, 0.06)",
        }}
      />

      {/* Bottom-right subtle decorative circle */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: 250,
          backgroundColor: "rgba(198, 156, 44, 0.06)",
        }}
      />

      {/* Center cosmic geometry SVG background */}
      <svg
        width="800"
        height="800"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r="32"
          fill="none"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r="20"
          fill="none"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="95"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <line
          x1="5"
          y1="50"
          x2="95"
          y2="50"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <line
          x1="18"
          y1="18"
          x2="82"
          y2="82"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <line
          x1="82"
          y1="18"
          x2="18"
          y2="82"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
        <polygon
          points="50,8 62,38 92,50 62,62 50,92 38,62 8,50 38,38"
          fill="none"
          stroke="rgba(198, 156, 44, 0.1)"
          strokeWidth="0.5"
        />
      </svg>

      {/* Inner Content Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 1040,
          height: 500,
          border: "1px solid rgba(198, 156, 44, 0.25)",
          borderRadius: 32,
          backgroundColor: "rgba(253, 252, 251, 0.9)",
          padding: 40,
        }}
      >
        {/* Top Star Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(198, 156, 44, 0.08)",
            marginBottom: 20,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="#C69C2C"
            stroke="#C69C2C"
            strokeWidth="1"
          >
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "#C69C2C",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Daily Astrology
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 34,
            fontWeight: "bold",
            color: "#2C1810",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Ancient Wisdom. Modern Intelligence.
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: "#8B5C45",
            textAlign: "center",
            maxWidth: 780,
          }}
        >
          Unlock personalized Vedic Nakshatra readings, real-time transits, and
          customized cosmic guidance tailored to your exact birth star.
        </div>

        {/* Bottom simple divider */}
        <div
          style={{
            display: "flex",
            width: 60,
            height: 4,
            backgroundColor: "#C69C2C",
            marginTop: 32,
            borderRadius: 2,
          }}
        />
      </div>
    </div>,
    // ImageResponse options
    {
      ...size,
    },
  );
}
