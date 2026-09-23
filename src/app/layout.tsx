import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { appInfo } from "@/lib/app-info";

export const metadata: Metadata = {
  title: appInfo.name,
  description: appInfo.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
