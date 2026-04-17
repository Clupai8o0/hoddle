import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hoddle.com.au"),
  title: {
    default: "Hoddle Melbourne — Mentorship for International Students",
    template: "%s | Hoddle Melbourne",
  },
  description:
    "Connect with high-achieving mentors who've walked the same path. Guidance, community, and real stories for first-year international students in Melbourne.",
  openGraph: {
    title: "Hoddle Melbourne — Mentorship for International Students",
    description:
      "Connect with high-achieving mentors who've walked the same path. Guidance, community, and real stories for first-year international students in Melbourne.",
    url: "https://hoddle.com.au",
    siteName: "Hoddle Melbourne",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoddle Melbourne — Mentorship for International Students",
    description:
      "Guidance, community, and real stories for first-year international students in Melbourne.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}
    >
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface-container)",
              color: "var(--color-on-surface)",
              border: "none",
              boxShadow: "0 12px 40px rgba(0, 24, 66, 0.10)",
              fontFamily: "var(--font-be-vietnam-pro), sans-serif",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
