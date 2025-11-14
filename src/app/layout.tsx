import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MountainTracker - Track Your Mountain Adventures",
  description:
    "Keep track of all your mountain tours, hikes, and climbing adventures",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MountainTracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "MountainTracker",
    title: "MountainTracker - Track Your Mountain Adventures",
    description:
      "Keep track of all your mountain tours, hikes, and climbing adventures",
  },
  twitter: {
    card: "summary",
    title: "MountainTracker - Track Your Mountain Adventures",
    description:
      "Keep track of all your mountain tours, hikes, and climbing adventures",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#1e40af" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
