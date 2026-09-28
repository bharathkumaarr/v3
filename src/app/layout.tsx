import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { ThemePageCurl } from "@/components/theme-page-curl/theme-page-curl";
import "./globals.css";

/** Same faces paco.me ships: Söhne for body, Inter for headings/UI, Newsreader for editorial italics */
const sohne = localFont({
  src: "../fonts/sohne-subset-0.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-sohne",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/inter-subset.woff2",
  variable: "--font-inter",
  display: "swap",
});

const newsreader = localFont({
  src: "../fonts/newsreader-subset-0.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-newsreader",
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
      className={`${sohne.variable} ${inter.variable} ${newsreader.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-neutral-1 font-sans text-neutral-8">
        <ThemeProvider>
          <SmoothScroll>
            <ThemePageCurl>{children}</ThemePageCurl>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
