'use client';

import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import { useMemo } from 'react';

export interface SinglesPageProps {
  itemType: string;
  params: Promise<{ itemType: string }>;
}

export default function Singleton({ itemType, params }: SinglesPageProps) {
  console.log(params);
  const { data: schema } = useGetSchemaQuery();

  const itemSchema = useMemo(() => {
    if (!schema) return null;

    return schema[itemType];
  }, [schema, itemType]);

  if (!schema) return null;

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <h1>{itemSchema?.displayName}</h1>
      </div>
    </div>
  );
}
