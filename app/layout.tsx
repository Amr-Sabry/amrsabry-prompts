import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AmrSabry-prompts — Extract & Edit Text from Images",
  description: "Extract, edit and organize text from any image. Powered by AI OCR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
