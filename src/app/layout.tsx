import type { Metadata } from "next";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ConsentProvider } from "@/components/consent/ConsentContext";
import { CookieConsentBanner, CookiePreferencesModal } from "@/components/consent/CookieConsentBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MarketProvider } from "@/components/market/MarketContext";
import { MarketSuggestionBanner } from "@/components/market/MarketSelector";
import { getServerEnv } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const serverEnv = getServerEnv();
  const verification = serverEnv.GOOGLE_SITE_VERIFICATION;

  return {
    title: {
      default: "Basco Sports – Premium Sports Gear & Apparel",
      template: "%s | Basco Sports",
    },
    description: "Premium sports gear and apparel – football, cricket, basketball, running, gym & outdoor. Editorial curation, worldwide delivery. Demo store.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://basco-sports.example.com"),
    openGraph: {
      title: "Basco Sports – Premium Sports Gear",
      description: "Editorial curation, worldwide delivery. Football, cricket, basketball, running, gym & outdoor.",
      type: "website",
      siteName: "Basco Sports",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Basco Sports" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Basco Sports – Premium Sports Gear",
      description: "Editorial curation, worldwide delivery.",
    },
    robots: { index: true, follow: true },
    icons: { icon: "/favicon.ico" },
    verification: verification ? { google: verification } : undefined,
    other: verification ? { "google-site-verification": verification } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ConsentProvider>
          <MarketProvider>
            <CartProvider>
              <MarketSuggestionBanner />
              <AnnouncementBar />
              <Header />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieConsentBanner />
              <CookiePreferencesModal />
              <GoogleAnalytics />
            </CartProvider>
          </MarketProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
