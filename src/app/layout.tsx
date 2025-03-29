import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Providers } from '@/util/Providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mago Final",
  description: "Tu asistente mágico de IA",
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/images/Magofinal2.png',
        type: 'image/png',
      }
    ],
    apple: '/images/Magofinal2.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
