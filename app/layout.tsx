import type { Metadata } from "next";
import { Archivo, Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${archivo.variable} ${atkinson.variable} h-full`}
      // Some browser extensions add their own attributes to <html> before
      // React hydrates. React cannot patch an attribute it did not render, so
      // this stops the console warning. It only applies to this element and
      // does not hide real mismatches further down the tree.
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
