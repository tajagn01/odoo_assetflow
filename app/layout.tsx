import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "AssetFlow | Enterprise Asset & Resource Management ERP",
  description: "Production-ready enterprise-grade asset lifecycle management, resource booking, maintenance, and compliance auditing system.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
        
        {/* Automatically clean up service worker and cache in development */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (let registration of registrations) {
                registration.unregister().then(function() {
                  console.log('Service Worker unregistered successfully');
                });
              }
            });
          }
          if ('caches' in window) {
            caches.keys().then(function(names) {
              for (let name of names) {
                caches.delete(name).then(function() {
                  console.log('Cache cleared:', name);
                });
              }
            });
          }
        `}} />
      </body>
    </html>
  );
}
