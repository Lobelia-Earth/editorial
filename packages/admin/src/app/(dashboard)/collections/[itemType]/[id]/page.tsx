import CollectionItem from './collectionItem';

export interface CollectionItemPageProps {
  params: Promise<{ itemType: string; id: string }>;
}

export default async function CollectionItemPage({
  params,
}: CollectionItemPageProps) {
  const { itemType, id } = await params;

  return <CollectionItem itemType={itemType} id={id} />;
}
