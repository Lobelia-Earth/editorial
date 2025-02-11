'use client';

import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import { useMemo } from 'react';
import ItemForm from '../../../singles/[itemType]/itemForm';

export interface NewCollectionItemProps {
  itemType: string;
}

export default function NewCollectionItem({
  itemType,
}: NewCollectionItemProps) {
  const { data: schema } = useGetSchemaQuery();

  const itemFields = useMemo(() => {
    if (!schema) return null;

    return schema[itemType].fields;
  }, [schema, itemType]);

  if (!schema) return null;

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <ItemForm itemType={itemType} fields={itemFields} data={{}} isNew />
      </div>
    </div>
  );
}
