import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Instrument_Serif } from "next/font/google";
import { getSessionContext } from "@/lib/permissions";
import { getServerEnv } from "@/lib/env";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import "@/app/design-system.css";

const inter = Inter({
  variable: "--font-landing",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-landing-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Repairs and Other Services",
    template: "%s | Repairs and Other Services",
  },
  description:
    "Find local people in Glasgow's West End who repair, alter, refurbish, organise and help. Or offer your own skills.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

/**
 * The session read is not cacheable, so it sits behind a Suspense boundary.
 * Without one the landing route cannot be prerendered.
 */
async function Header() {
  const context = await getSessionContext();

  return (
    <LandingHeader
      user={context.user}
      isProvider={Boolean(context.providerProfile)}
    />
  );
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const env = getServerEnv();
  const supportEmail = env.supportEmail || env.adminEmail;

  return (
    <div className={`landing ${inter.variable} ${serif.variable}`}>
      {/* The skip link lives in the root layout, which wraps this one. */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <main id="main" className="l-main">
        {children}
      </main>

      <LandingFooter supportEmail={supportEmail} />
    </div>
  );
}
