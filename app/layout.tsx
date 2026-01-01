import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Video Code Generator',
  description: 'AI-powered Remotion video code generator with interactive coding experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        {/* 预加载关键资源 */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"
          as="script"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://cdn.jsdelivr.net"
        />
        <link
          rel="dns-prefetch"
          href="https://unpkg.com"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

