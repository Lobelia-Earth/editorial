import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
