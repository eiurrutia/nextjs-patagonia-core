import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import '@/app/ui/global.css'; // Import global styles

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
