import Header from '@/components/header';
import Footer from '@/components/footer';
import PageGuard from '@/components/pageGuard';
import { AuthProvider } from '@/contexts/AuthProvider';
import React from 'react';

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <AuthProvider>
      <Header />
      <PageGuard>{children}</PageGuard>
      <Footer />
    </AuthProvider>
  );
}
