import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Barbearia Papo Furado | Agendamento Premium',
  description: 'Agende seu corte com precisão e estilo na Barbearia Papo Furado.',
};

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from "@/lib/utils";

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={cn("dark", inter.variable, "font-sans")}>
      <body className="bg-[#131313] text-[#e5e2e1] antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
