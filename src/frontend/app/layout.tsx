import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "../components/top-nav";

export const metadata: Metadata = {
  title: "Acta — verification layer",
  description: "Verify whether students understand AI-assisted work.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
