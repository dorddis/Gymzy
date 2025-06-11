import type { Metadata } from 'next/types';
import { BodyWrapper } from '@/components/BodyWrapper';

export const metadata: Metadata = {
  title: 'Gymzy',
  description: 'Gymzy - Your ultimate fitness companion',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <BodyWrapper>
        {children}
      </BodyWrapper>
    </html>
  );
}
