import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axon",
  description: "Axon AI",

  icons: {
    icon: "/axon-logo.png",
    shortcut: "/axon-logo.png",
    apple: "/axon-logo.png",
  },

  appleWebApp: {
    capable: true,
    title: "Axon",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}