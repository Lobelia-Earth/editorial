'use client';

import { useGetDataQuery, useGetSchemaQuery } from '@/lib/store/editorialApi';
import { useMemo } from 'react';
import ItemForm from './itemForm';

export interface SinglesPageProps {
  itemType: string;
}

export default function Singleton({ itemType }: SinglesPageProps) {
  const { data: schema } = useGetSchemaQuery();
  const { data } = useGetDataQuery();

  const itemSchema = useMemo(() => {
    if (!schema) return null;

    return schema[itemType];
  }, [schema, itemType]);

  const itemFields = useMemo(() => {
    if (!schema) return null;

    return schema[itemType].fields;
  }, [schema, itemType]);

  if (!itemFields || !data) return null;

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <h1 className="text-2xl">{itemSchema?.displayName}</h1>

        <ItemForm
          itemType={itemType}
          fields={itemFields}
          data={data[itemType]['default']}
        />
      </div>
    </div>
  );
}
