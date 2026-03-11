import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import CTABanner from "@/components/CTABanner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Storage Network — Custom Shelving & Storage Solutions",
  description:
    "Auto-generate cut-lists, 3D models, and material estimates for custom shelving installations. The #1 tool for storage builders and installers.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.organization-storage.com"
  ),
  openGraph: {
    title: "Storage Network — Custom Shelving & Storage Solutions",
    description:
      "Auto-generate cut-lists, 3D models, and material estimates for custom shelving installations.",
    siteName: "Storage Network",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Storage Network — Custom Shelving & Storage Solutions",
    description:
      "Auto-generate cut-lists, 3D models, and material estimates for custom shelving installations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="pb-20">{children}</main>
        <CTABanner />
      </body>
    </html>
  );
}
