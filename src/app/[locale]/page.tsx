import { setRequestLocale } from 'next-intl/server';
import RepoExplorer from './RepoExplorer';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RepoExplorer />;
}
