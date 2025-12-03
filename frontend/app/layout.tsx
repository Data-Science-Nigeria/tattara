import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { QueryProvider } from '../context/QueryProvider';
import { GlobalAlertDialog } from './components/global-alert-dialog';
import { Toaster } from 'sonner';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Tattara Data Collection App',
  description: 'A data collection application for Tattara project',
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
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
