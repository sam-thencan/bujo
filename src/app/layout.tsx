import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bujo — bullet journal",
  description: "A calm, fast bullet journal for daily, monthly, and future capture.",
  appleWebApp: { capable: true, title: "bujo" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f8f7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans text-ink-800 antialiased">{children}</body>
    </html>
  );
}
