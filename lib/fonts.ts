import { Inter, Instrument_Serif } from "next/font/google";

/**
 * Studio type: Inter for everything, with Instrument Serif reserved for the
 * single italic accent used on the landing page.
 */
export const studioSans = Inter({
  variable: "--font-studio-sans",
  subsets: ["latin"],
  display: "swap",
});

export const studioSerif = Instrument_Serif({
  variable: "--font-studio-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
