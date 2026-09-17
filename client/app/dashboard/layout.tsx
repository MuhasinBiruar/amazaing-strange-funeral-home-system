import Header from '@/components/header';
import Footer from '@/components/footer';
import PageGuard from '@/components/pageGuard';
import React from 'react';

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Header />
      <PageGuard>{children}</PageGuard>
      <Footer />
    </>
  );
}
