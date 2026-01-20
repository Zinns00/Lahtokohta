import type { Metadata } from "next";
import { UnifrakturMaguntia, Space_Mono, Grenze_Gotisch } from "next/font/google"; // Gothic & Monospace
import "./globals.css";

const unifraktur = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gothic",
});

const grenze = Grenze_Gotisch({
  weight: ["400", "800"],
  subsets: ["latin"],
  variable: "--font-grenze",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Lähtökohta | VOID",
  description: "Digital Wasteland for Learning, Immersion, and Creation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${unifraktur.variable} ${grenze.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
