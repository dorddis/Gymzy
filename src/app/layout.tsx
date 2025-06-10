import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';

export const metadata: Metadata = {
  title: 'Gymzy - Your Smart Fitness Partner',
  description: 'Interactive anatomy, smart workout logging, and progress analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter antialiased">
        <AuthProvider>
          <WorkoutProvider>
            {children}
          </WorkoutProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
