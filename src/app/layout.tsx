import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { site } from "@/content/site";
import { getSiteUrl } from "@/lib/seo";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { PageTransition } from "@/components/ui/PageTransition";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

// URL-based fields (canonical, og:url, og:image) need metadataBase, so they are only
// added once site.seo.siteUrl is a real URL. Until then they are left out.
export const metadata: Metadata = {
  title: { default: site.seo.title, template: `%s – ${site.name}` },
  description: site.seo.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.seo.title,
    description: site.seo.description,
    ...(siteUrl ? { url: "/", images: [{ url: site.seo.ogImage, width: 1200, height: 630 }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    ...(siteUrl ? { images: [site.seo.ogImage] } : {}),
  },
  ...(siteUrl ? { metadataBase: siteUrl, alternates: { canonical: "/" } } : {}),
};

// Runs before first paint: stored choice wins, otherwise follow the OS setting. The second
// part sets data-booted (hides the boot overlay) for non-home pages, a visit that already
// booted this session, and reduced motion.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}try{if(location.pathname!=="/"||sessionStorage.getItem("booted")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.booted="1"}catch(e){}try{var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];var r=n?n.type==="reload":!!(performance.navigation&&performance.navigation.type===1);if(r){var h=history,w=window,top=function(){w.scrollTo({top:0,left:0,behavior:"instant"})},auto=function(){h.scrollRestoration="auto"};h.scrollRestoration="manual";if(location.hash)h.replaceState(null,"",location.pathname+location.search);top();document.addEventListener("DOMContentLoaded",top,{once:true});w.addEventListener("load",function(){top();auto()},{once:true});w.addEventListener("pagehide",auto,{once:true})}}catch(e){}})()`;

// Reload handling (second try block): a reload always starts at the top, with any #hash removed.
// scrollRestoration is only touched on reload, and is set back to "auto" on load or pagehide.

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <SkipLink />
        <Header />
        {children}
        <Footer />
        <PageTransition />
        <CustomCursor />
      </body>
    </html>
  );
}
