import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import { useMemo } from 'react';

export interface SinglesPageProps {
  params: Promise<{ itemType: string }>;
}

export default async function SinglesPage({ params }: SinglesPageProps) {
  const { itemType } = await params;

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8"></div>
    </div>
  );
}
