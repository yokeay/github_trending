import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'GitHub Trending Explorer',
  description: 'Explore trending GitHub repositories',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
