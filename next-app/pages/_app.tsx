import React from 'react';
import type { AppProps } from 'next/app';
import AntdProvider from '../components/AntdProvider';
import '../app/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AntdProvider>
      <Component {...pageProps} />
    </AntdProvider>
  );
}
