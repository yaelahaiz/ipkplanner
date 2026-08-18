import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPK Planner",
  description: "Kalkulator IPS dan IPK mahasiswa",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body>{children}</body></html>;
}
