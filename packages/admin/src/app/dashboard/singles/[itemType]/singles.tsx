'use client';

import {
  useGetDataObjectQuery,
  useGetSchemaTypeQuery,
} from '@/lib/store/slices/editorialApi';
import ItemForm from './itemForm';

export interface SinglesPageProps {
  itemType: string;
}

export default function Singleton({ itemType }: SinglesPageProps) {
  const { data: schema } = useGetSchemaTypeQuery(itemType);
  const { data: item } = useGetDataObjectQuery({ itemType, id: 'default' });

  if (!schema || !item) return null;

  return <ItemForm itemType={itemType} fields={schema.fields} data={item} />;
}
