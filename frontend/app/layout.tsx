import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { QueryProvider } from '../context/QueryProvider';
import { GlobalAlertDialog } from './components/global-alert-dialog';
import './globals.css';

const poppins = Poppins({
  variable: '---poppins',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Tattara',
  description: 'For App Collection',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <GlobalAlertDialog />
      </body>
    </html>
  );
}
