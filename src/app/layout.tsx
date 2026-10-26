import type { Metadata } from "next";
import { Archivo, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { IrisLoader, IrisView } from "@/components/iris-loader";
import { SiteHeader, SiteHeaderView } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/config/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} · Photography`,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${cormorant.variable} ${jetbrains.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col" suppressHydrationWarning>
        {/* The loading iris. Its stand-in is part of the page the server sends, so the cover
            is there from the first paint. Without scripts it is simply not shown. */}
        <Suspense fallback={<IrisView />}>
          <IrisLoader />
        </Suspense>
        <noscript>
          <style>{".iris-loader{display:none!important}"}</style>
        </noscript>
        <Suspense fallback={<SiteHeaderView pathname={null} />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
