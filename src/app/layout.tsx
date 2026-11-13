import type { Metadata } from "next";
import { AppProvider } from "@/lib/store";
import "@fontsource-variable/geist";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "WISED ERP", template: "%s · WISED ERP" },
  description: "ERP WISED : ventes, achats, stocks, projets et RH, par agence ou en vue consolidée.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
