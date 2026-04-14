// NOTE: Hex values in this file are intentional.
// ImageResponse uses Satori for server-side rendering, which does not support
// CSS custom properties. Tokens must be inlined as literal values here.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Hoddle Melbourne — Mentorship for International Students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f5f7fa",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Tonal wash — top-right gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 480,
            height: 480,
            background: "radial-gradient(circle at top right, #dbe5f1 0%, transparent 70%)",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 80,
            fontSize: 24,
            fontWeight: 700,
            color: "#001842",
            letterSpacing: "-0.01em",
          }}
        >
          Hoddle Melbourne
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#5a6275",
            marginBottom: 20,
          }}
        >
          Mentorship platform
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: "#001842",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 780,
          }}
        >
          Find your footing in Melbourne.
        </div>

        {/* Sub-headline */}
        <div
          style={{
            fontSize: 22,
            color: "#5a6275",
            marginTop: 24,
            maxWidth: 620,
            lineHeight: 1.5,
          }}
        >
          Connect with mentors who&apos;ve walked the same path — built for
          first-year international students.
        </div>
      </div>
    ),
    { ...size },
  );
}
