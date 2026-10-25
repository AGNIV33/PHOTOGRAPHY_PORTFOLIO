import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
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

// Some browser extensions (e.g. Bitdefender's) stamp attributes like bis_skin_checked onto
// every element before React hydrates, which shows up as hydration "Issues" in development.
// Strip them as they appear. Development only; visitors never see these warnings.
const stripExtensionAttrs = `(() => {
  const bad = (n) => n === "bis_skin_checked" || n === "bis_register" || n.startsWith("__processed_");
  const clean = (el) => { for (const a of [...el.attributes]) if (bad(a.name)) el.removeAttribute(a.name); };
  const sweep = () => document.querySelectorAll("*").forEach(clean);
  new MutationObserver((ms) => ms.forEach((m) => {
    if (m.type === "attributes" && bad(m.attributeName)) m.target.removeAttribute(m.attributeName);
    m.addedNodes.forEach((n) => n.nodeType === 1 && (clean(n), n.querySelectorAll("*").forEach(clean)));
  })).observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  sweep();
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${cormorant.variable} ${jetbrains.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col" suppressHydrationWarning>
        {process.env.NODE_ENV === "development" && (
          <Script id="strip-extension-attrs" strategy="beforeInteractive">
            {stripExtensionAttrs}
          </Script>
        )}
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
