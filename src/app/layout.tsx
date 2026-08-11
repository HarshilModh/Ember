import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeepWork Log — Practice & Task Tracker",
  description: "A high-performance deep work, practice, and task logger.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
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
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        </head>
        <body className="min-h-dvh antialiased font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}

