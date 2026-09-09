import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemePageCurl } from "@/components/theme-page-curl/theme-page-curl";
import "./globals.css";

/** Same face frederic.ooo ships: Innovator Grotesk at 300/400/600/700. */
const innovatorGrotesk = localFont({
  src: [
    {
      path: "../fonts/InnovatorGrotesk-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/InnovatorGrotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/InnovatorGrotesk-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/InnovatorGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-innovator-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "bharath / bharath kumar",
  description:
    "software engineer at the intersection of design and web development",
  icons: {
    icon: "/favicon.svg",
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
      className={`${innovatorGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-neutral-1 font-sans text-neutral-8">
        <ThemeProvider>
          <ThemePageCurl>{children}</ThemePageCurl>
        </ThemeProvider>
      </body>
    </html>
  );
}
