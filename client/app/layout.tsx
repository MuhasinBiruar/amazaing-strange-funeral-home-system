import type { Metadata } from 'next';
import { Work_Sans } from 'next/font/google';
import { PrimeReactProvider } from 'primereact/api';
import './globals.css';

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
});

/* const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
}); */

export const metadata: Metadata = {
  title: 'The Funeral Assistant',
  description: 'Funeral Home Integrated Management System',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${workSans.variable} antialiased bg-white`}>
      <body
        className="min-h-dvh flex flex-col bg-white"
        suppressHydrationWarning
      >
        <PrimeReactProvider
          value={{
            inputStyle: 'outlined',
          }}
        >
          {children}
        </PrimeReactProvider>
      </body>
    </html>
  );
}
