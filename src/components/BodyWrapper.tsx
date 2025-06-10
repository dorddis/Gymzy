'use client';

import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/app/providers';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export function BodyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <body className={inter.className}>
      <Providers>
        {children}
      </Providers>
      <Toaster />
    </body>
  );
} 