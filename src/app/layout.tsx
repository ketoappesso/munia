import './globals.css';
import 'swiper/css';
import 'swiper/css/zoom';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'react-datepicker/dist/react-datepicker.css';
// import { Poppins } from 'next/font/google';
import { cn } from '@/lib/cn';
import { Providers } from '@/components/Providers';
import { auth } from '@/auth';
import React from 'react';

// const poppins = Poppins({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   display: 'swap',
//   preload: false,
// });

export const metadata = {
  title: 'Appesso',
  description: 'A social media web app, built with Next.js 13.',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Appesso',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en" className="dark overflow-y-scroll">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        {/* PWA预加载关键资源 */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="preconnect" href="https://assets.xyuan.chat" />
        <link rel="preconnect" href="https://appesso-s3-bucket.s3.us-east-1.amazonaws.com" />
        <link rel="dns-prefetch" href="https://xiaoyuan-chat.tos-cn-guangzhou.volces.com" />
      </head>
      <body className={cn('bg-background text-foreground')}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
