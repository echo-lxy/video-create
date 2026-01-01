import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Video Code Generator',
  description: 'AI-powered Remotion video code generator with interactive coding experience',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction ? '/video-create' : '';
  
  return (
    <html lang="zh-CN" className="dark">
      <head>
        {/* 预加载本地资源（仅在需要时预加载，避免警告） */}
        {isProduction && (
          <>
            <link
              rel="prefetch"
              href={`${basePath}/esbuild/esbuild.wasm`}
              as="fetch"
              crossOrigin="anonymous"
            />
            <link
              rel="prefetch"
              href={`${basePath}/monaco/vs/loader.js`}
              as="script"
              crossOrigin="anonymous"
            />
          </>
        )}
        {/* DNS 预解析（优先 unpkg.com，通常更快） */}
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        {/* Service Worker 注册（客户端） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('${basePath}/sw.js')
                    .then(() => console.log('✅ Service Worker registered'))
                    .catch(() => console.log('⚠️ Service Worker registration failed'));
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

