import type { Metadata, Viewport } from "next";
import { ExpertModeProvider } from "@/context/ExpertMode";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROI — Real Estate Investing",
  description: "AI-powered real estate investment platform for first-time investors.",
  applicationName: "ROI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ROI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ExpertModeProvider>
          <div className="phone-frame">{children}</div>
        </ExpertModeProvider>
      </body>
    </html>
  );
}
