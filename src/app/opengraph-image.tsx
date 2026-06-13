import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SkillTrade — Exchange Skills with People Near You";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Green gradient bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            background: "linear-gradient(to top, rgba(34,197,94,0.25) 0%, transparent 100%)",
          }}
        />

        {/* Logo icon */}
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="6" r="3" fill="#22C55E" />
          <circle cx="18" cy="6" r="3" fill="#22C55E" />
          <circle cx="12" cy="18" r="3" fill="#166534" />
          <line x1="6" y1="6" x2="18" y2="6" stroke="#22C55E" strokeWidth="1.5" />
          <line x1="6" y1="6" x2="12" y2="18" stroke="#22C55E" strokeWidth="1.5" />
          <line x1="18" y1="6" x2="12" y2="18" stroke="#22C55E" strokeWidth="1.5" />
        </svg>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#f4f4f5",
            marginTop: 24,
            letterSpacing: "-1px",
          }}
        >
          SkillTrade
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            marginTop: 16,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Exchange skills with people near you.
          <br />
          No money. No middleman.
        </div>
      </div>
    ),
    { ...size }
  );
}
