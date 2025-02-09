import Singleton from './singles';

export interface SinglesPageProps {
  params: Promise<{ itemType: string }>;
}

export default async function SinglesPage({ params }: SinglesPageProps) {
  const { itemType } = await params;

  return <Singleton itemType={itemType} />;
}
