'use client';

import {
  useGetDataObjectQuery,
  useGetSchemaTypeQuery,
} from '@/lib/store/editorialApi';
import ItemForm from '../../../singles/[itemType]/itemForm';

export interface CollectionItemProps {
  itemType: string;
  id: string;
}

export default function CollectionItem({ itemType, id }: CollectionItemProps) {
  const { data: schema } = useGetSchemaTypeQuery(itemType);
  const { data: item } = useGetDataObjectQuery({ itemType, id });

  if (!schema || !item) return null;

  return <ItemForm itemType={itemType} fields={schema.fields} data={item} />;
}
