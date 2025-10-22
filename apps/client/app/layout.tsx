import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inklink",
  description: "A shared visual workspace that lets teams draw, plan, and brainstorm together in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
