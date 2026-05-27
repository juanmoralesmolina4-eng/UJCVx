import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Sidebar } from "@/components/sidebar";
import { TopbarMobile } from "@/components/topbar-mobile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UJCVx",
  description:
    "Sistema de programación académica y gestión de pagos docentes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const correo = user?.email;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {correo ? (
          <div className="flex h-screen overflow-hidden bg-muted/40">
            <Sidebar correoUsuario={correo} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <TopbarMobile correoUsuario={correo} />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
