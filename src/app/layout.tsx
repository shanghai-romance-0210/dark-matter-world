import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "野獣ドットコム",
  description: "This website is powered by Vercel.",
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
