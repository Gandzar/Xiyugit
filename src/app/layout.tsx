import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "XIYU Studio — GitHub Uploader",
  description: "Workspace untuk mengirim proyek ke GitHub dengan lebih rapi, aman, dan terkendali.",
  applicationName: "XIYU Studio"
};
export const viewport: Viewport = { themeColor: "#111018", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
