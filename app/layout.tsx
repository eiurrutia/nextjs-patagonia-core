'use client';
import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Re-add the useEffect hook to register the service worker
  useEffect(() => {
    // Temporarily disable service worker to fix redirect issues
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered: ', registration);
        })
        .catch((registrationError) => {
          console.error('Service Worker registration failed: ', registrationError);
        });
    }
    */
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Patagonia Core</title>
        <meta name="description" content="A custom solution to centralize Patagonia's platform data." />
        <meta name="theme-color" content="#4682B4" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/patagonia-core-icon.png?v=2" />
        <link rel="apple-touch-icon" href="/icons/patagonia-core-icon-192x192.png?v=2" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
