import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ember — Deep Work & Task Command",
  description: "A high-performance deep work, practice, and task logger built for iPad & Web.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    // iOS ignores SVG for the home-screen icon — without a PNG here,
    // "Add to Home Screen" falls back to a screenshot thumbnail.
    apple: "/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ember Flow",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Capped, not disabled: WCAG 1.4.4 requires users be able to zoom to
  // 200%, and userScalable:false also blocks it in the installed PWA
  // (Safari ignores the restriction in-browser, but not standalone).
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

// Runs before first paint so a dark-mode user never sees a flash, default is light mode.
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('ember-theme') || localStorage.getItem('tasklog-theme') || 'light';
  document.documentElement.dataset.theme = t;
} catch (e) {
  document.documentElement.dataset.theme = 'light';
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="light" className={`light ${sans.variable}`} suppressHydrationWarning>
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Ember" />
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        </head>
        <body className="min-h-dvh antialiased font-sans touch-manipulation">{children}</body>
      </html>
    </ClerkProvider>
  );
}
